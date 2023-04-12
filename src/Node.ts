import * as path from 'path';

import { decode, SourceMapMappings } from 'sourcemap-codec';
import * as fse from 'fs-extra';

import { manageFileProtocol } from './utils/path';

import type { Trace } from './Trace';
import type { Options } from './Options';
import type { Context } from './Context';
import type { SourceMapProps } from './sourceMap/SourceMap';
import { SourceMapInfo, SourceMapInfoProps } from './sourceMap/SourceMapInfo';

/** @internal */
export class Node {
    static Create ( context: Context, file?: string, content?: string, map?: SourceMapProps ): Node {
        let node: Node;
        if ( file ) {
            file = path.resolve( manageFileProtocol( file ) );
            node = context.cache[file];
            if ( node ) {
                if ( node._content === undefined && content ) {
                    node._content = content;
                }
                if ( node._map === undefined && map ) {
                    node._map = map;
                }
            }
            else {
                node = new Node( context, file, content, map );
                context.cache[file] = node;
            }
        }
        else {
            node = new Node( context, undefined, content, map );
        }
        return node;
    }

    static Load ( context: Context, file?: string, content?: string, map?: SourceMapProps ): Promise<Node> {
        const node = Node.Create( context, file, content, map );
        return node._load()
            .then( () => {
                return node;
            });
    }

    static LoadSync ( context: Context, file?: string, content?: string, map?: SourceMapProps ): Node {
        const node = Node.Create( context, file, content, map );
        node._loadSync();
        return node;
    }

    private static g_nextid = 0;

    private readonly _id: number;
    private readonly _context: Context;
    private readonly _file?: string | null;
    private _content?: string | null;
    private _mapInfo?: SourceMapInfoProps | null;
    private _map?: SourceMapProps | null;
    private _mappings: SourceMapMappings;
    private _sources: Node[];
    private _decodingTime: number;

    private constructor ( context: Context, file?: string, content?: string, map?: SourceMapProps ) {
        this._context = context;

        this._file = file;
        this._content = content;
        this._map = map;

        if ( ( this._file == null ) && ( this._content == null ) ) {
            throw new Error( 'A source must specify either file or content' );
        }

        this._id = ++Node.g_nextid;

        this._decodingTime = 0;
    }

    // Use to find the map file
    // - if node has a physical file content, we have to use the dirname of the file as root
    // - if node has a memory stream content, we have to use the context origin as root
    get origin () {
        return this._file ? path.dirname( this._file ) : this._context.origin;
    }

    get context () {
        return this._context;
    }

    get content () {
        return this._content;
    }

    get sources () {
        return this._sources;
    }

    get file () {
        return this._file;
    }

    get map () {
        return this._map;
    }

    get mapInfo () {
        return this._mapInfo;
    }

    get decodingTime () {
        return this._decodingTime;
    }

    get mappings () {
        return this._mappings;
    }

    get isPureSource () {
        return ( this._mapInfo == null && this._map == null );
    }

    get exist () {
        return ( this._file && this._content );
    }

    private _defaultTrace ( lineIndex: number, columnIndex: number, name?: string ) {
        return {
            source: this._file,
            line: lineIndex + 1,
            column: columnIndex || 0,
            name
        };
    }

    trace ( lineIndex: number, columnIndex: number, name?: string, options?: Options ): Trace {
        // If this node doesn't have a source map, we have
        // to assume it is the original source
        if ( !this._map ) {
            return this._defaultTrace( lineIndex, columnIndex, name );
        }

        // Otherwise, we need to figure out what this position in
        // the intermediate file corresponds to in *its* source
        const segments = this._mappings[lineIndex];
        if ( !segments || segments.length === 0 ) {
            return null;
        }

        if ( columnIndex != null ) {
            const len = segments.length;
            for ( let i = 0; i < len; i += 1 ) {
                const generatedCodeColumn = segments[i][0];
                if ( generatedCodeColumn > columnIndex ) {
                    break;
                }
                if ( generatedCodeColumn === columnIndex ) {
                    if ( segments[i].length < 4 ) {
                        return null;
                    }

                    const sourceFileIndex = segments[i][1] || 0;
                    const sourceCodeLine = segments[i][2] || 0;
                    const sourceCodeColumn = segments[i][3] || 0;
                    const nameIndex = segments[i][4] || 0;

                    const parent = this._sources[sourceFileIndex];
                    if ( ( options && options.flatten === 'existing' ) && !parent.exist ) {
                        return this._defaultTrace( lineIndex, columnIndex, name );
                    }
                    else {
                        return parent.trace( sourceCodeLine, sourceCodeColumn, this._map.names[nameIndex] || name, options );
                    }
                }
            }
        }

        // fall back to a line mapping
        const sourceFileIndex = segments[0][1] || 0;
        const sourceCodeLine = segments[0][2] || 0;
        const nameIndex = segments[0][4] || 0;

        const parent = this._sources[sourceFileIndex];
        if ( ( options && options.flatten === 'existing' ) && !parent.exist ) {
            return this._defaultTrace( lineIndex, columnIndex, name );
        }
        else {
            return parent.trace( sourceCodeLine, null, this._map.names[nameIndex] || name, options );
        }
    }

    private _load (): Promise<void> {
        return this._updateContent().then( () => {
            if ( this._content == null ) {
                return Promise.resolve();
            }
            return this._updateMap().then( () => {
                if ( this._map == null ) {
                    return Promise.resolve();
                }
                this._resolveSources();
                return Promise.all( this._sources.map( node => node._load() ) )
                    .then( () => { });
            });
        });
    }

    private _loadSync (): void {
        this._updateContentSync();
        if ( this._content == null ) {
            return;
        }
        this._updateMapSync();
        if ( this._map == null ) {
            return;
        }
        this._resolveSources();
        this._sources.forEach( node => node._loadSync() );
    }

    private _resolveSources () {
        const map = this._map;

        const hrDecodingStart = process.hrtime();
        this._mappings = decode( map.mappings );
        const hrDecodingTime = process.hrtime( hrDecodingStart );
        this._decodingTime = 1e9 * hrDecodingTime[0] + hrDecodingTime[1];

        const localSourceRoots = new Set<string>();
        // map file location has the priority
        if ( this._mapInfo && this._mapInfo.file ) {
            localSourceRoots.add( path.dirname( this._mapInfo.file ) );
        }
        // then content file location
        if ( this._file ) {
            localSourceRoots.add( path.dirname( this._file ) );
        }
        // then other locations depending on the context
        this._context.sourceRoots.forEach( ( sourceRoot ) => localSourceRoots.add( sourceRoot ) );

        // generate absolute path based on the 'sourceRoot' map field
        const mapSourceRoot = map.sourceRoot ? manageFileProtocol( map.sourceRoot ) : '';
        const sourceRoots = Array.from( localSourceRoots ).map( ( sourceRoot ) => path.resolve( sourceRoot, mapSourceRoot ) );

        this._context.log( `[Node-${this._id}] map resolve sources using roots: ${sourceRoots}` );

        const sourcesContent = map.sourcesContent || [];
        this._sources = map.sources.map( ( source, i ) => {
            const content = ( sourcesContent[i] == null ) ? undefined : sourcesContent[i];
            if ( source && sourceRoots.length ) {
                const sourcesResolved = sourceRoots
                    .map( ( sourceRoot ) => {
                        return path.resolve( sourceRoot, source );
                    });
                const sourceResolved = sourcesResolved.find( fse.existsSync ) || sourcesResolved[0];
                this._context.log( `[Node-${this._id}] map source ${source} => ${sourceResolved} using ${sourcesResolved}` );
                source = sourceResolved;
            }
            return Node.Create( this._context, source, content );
        });
    }

    private _updateContent (): Promise<void> {
        // 'undefined' never seen
        // 'null' seen but not found
        if ( this._content === undefined ) {
            this._content = null;
            return fse.readFile( this._file, { encoding: 'utf-8' })
                .then( ( content ) => {
                    this._context.log( `[Node-${this._id}] read content from ${this._file}` );
                    this._content = content;
                })
                .catch( ( err ) => {
                    this._context.log( `[Node-${this._id}] read content failed ${err}` );
                });
        }
        this._context.log( `[Node-${this._id}] content is ${this._content ? 'known' : 'null'}` );
        return Promise.resolve();
    }

    private _updateContentSync (): void {
        // 'undefined' never seen
        // 'null' seen but not found
        if ( this._content === undefined ) {
            this._content = null;
            try {
                this._content = fse.readFileSync( this._file, { encoding: 'utf-8' });
                this._context.log( `[Node-${this._id}] read content from ${this._file}` );
            }
            catch ( err ) {
                this._context.log( `[Node-${this._id}] read content failed ${err}` );
            }
            return;
        }
        this._context.log( `[Node-${this._id}] content is ${this._content ? 'known' : 'null'}` );
    }

    private _flushMapInfo () {
        if ( this._context.logActivated() ) {
            this._context.log( `[Node-${this._id}] map ${JSON.stringify( this._mapInfo )}` );
            if ( this._map ) {
                this._context.log( JSON.stringify( this._map, null, 4 ) );
            }
            else {
                this._context.log( 'no map' );
            }
        }
    }

    private _updateMap (): Promise<void> {
        // 'undefined' never seen
        // 'null' seen but not found
        if ( this._map === undefined ) {
            this._map = null;
            const mapInfo = new SourceMapInfo();
            if ( mapInfo.readContent( this._content ) ) {
                this._mapInfo = mapInfo;
                return mapInfo.readMap( this.origin )
                    .then( ( map ) => {
                        this._context.log( `[Node-${this._id}] read map` );
                        this._map = map;
                    })
                    .catch( ( err ) => {
                        this._context.log( `[Node-${this._id}] read map failed ${err}` );
                        // throw new Error(`Error when reading map ${url}`);
                    })
                    .finally( () => {
                        this._flushMapInfo();
                    });
            }
        }
        this._flushMapInfo();
        return Promise.resolve();
    }

    private _updateMapSync (): void {
        // 'undefined' never seen
        // 'null' seen but not found
        if ( this._map === undefined ) {
            this._map = null;
            const mapInfo = new SourceMapInfo();
            if ( mapInfo.readContent( this._content ) ) {
                this._mapInfo = mapInfo;
                try {
                    this._map = mapInfo.readMapSync( this.origin );
                    this._context.log( `[Node-${this._id}] read map` );
                }
                catch ( err ) {
                    this._context.log( `[Node-${this._id}] read map failed ${err}` );
                    // throw new Error(`Error when reading map ${url}`);
                }
                finally {
                    this._flushMapInfo();
                }
                return;
            }
        }
        this._flushMapInfo();
    }

}
