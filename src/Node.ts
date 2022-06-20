import * as path from 'path';

import { decode, SourceMapMappings } from 'sourcemap-codec';
import * as fse from 'fs-extra';

import { getMap, getMapSync } from './utils/getMap';
import { getContent, getContentSync } from './utils/getContent';
import { manageFileProtocol } from './utils/path';

import type { Trace } from './Trace';
import type { Options } from './Options';
import type { Context } from './Context';
import type { SourceMapProps } from './SourceMap';

/** @internal */
export class Node {
    static Create ( context: Context, file?: string, content?: string, map?: SourceMapProps ): Node {
        let node: Node;
        if ( file ) {
            file = path.resolve( manageFileProtocol( file ) );
            node = context.cache[file];
            if ( node ) {
                if ( node._content === undefined ) {
                    node._content = content;
                }
                if ( node._map === undefined ) {
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

    private readonly _context: Context;
    private readonly _file?: string | null;
    private _content?: string | null;
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

    get decodingTime () {
        return this._decodingTime;
    }

    get mappings () {
        return this._mappings;
    }

    get isOriginalSource () {
        return ( this._map == null );
    }

    get isCompleteSourceContent () {
        if ( this.isOriginalSource ) {
            return true;
        }
        return ( this._sources == null ) || this._sources.some( ( node ) => node._content == null );
    }

    trace ( lineIndex: number, columnIndex: number, name?: string, options?: Options ): Trace {
        // If this node doesn't have a source map, we have
        // to assume it is the original source
        if ( this.isOriginalSource || ( options && options.flatten === 'existing' && !this.isCompleteSourceContent ) ) {
            return {
                source: this._file,
                line: lineIndex + 1,
                column: columnIndex || 0,
                name: name
            };
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
                    if ( segments[i].length < 4 ) return null;

                    const sourceFileIndex = segments[i][1] || 0;
                    const sourceCodeLine = segments[i][2] || 0;
                    const sourceCodeColumn = segments[i][3] || 0;
                    const nameIndex = segments[i][4] || 0;

                    const parent = this._sources[sourceFileIndex];
                    return parent.trace( sourceCodeLine, sourceCodeColumn, this._map.names[nameIndex] || name, options );
                }
            }
        }

        // fall back to a line mapping
        const sourceFileIndex = segments[0][1] || 0;
        const sourceCodeLine = segments[0][2] || 0;
        const nameIndex = segments[0][4] || 0;

        const parent = this._sources[sourceFileIndex];
        return parent.trace( sourceCodeLine, null, this._map.names[nameIndex] || name, options );
    }

    private _load (): Promise<void> {
        return getContent( this ).then( content => {
            this._content = content;
            if ( content == null ) {
                return Promise.resolve();
            }
            return getMap( this ).then( map => {
                this._map = map;
                if ( map == null ) {
                    return Promise.resolve();
                }
                this._resolveSources();
                return Promise.all( this._sources.map( node => node._load() ) )
                    .then( () => {});
            });
        });
    }

    private _loadSync (): void {
        this._content = getContentSync( this );
        if ( this._content != null ) {
            this._map = getMapSync( this );
            if ( this._map != null ) {
                this._resolveSources();
                this._sources.forEach( node => node._loadSync() );
            }
        }
    }

    private _resolveSources () {
        const map = this._map;

        // Browserify or similar tools when inlining the map, set the file to a generic name like "generated.js"
        // We restore the proper name here
        map.file = this._file || map.file;

        const hrDecodingStart = process.hrtime();
        this._mappings = decode( map.mappings );
        const hrDecodingTime = process.hrtime( hrDecodingStart );
        this._decodingTime = 1e9 * hrDecodingTime[0] + hrDecodingTime[1];

        const sourcesContent = map.sourcesContent || [];

        const sourceRootBases = ( this._file ) ? [ path.dirname( this._file ), ...this._context.sourceRoots ] : this._context.sourceRoots;

        const mapSourceRoot = map.sourceRoot ? manageFileProtocol( map.sourceRoot ) : '';
        const sourceRoots = sourceRootBases.map( ( sourceRoot ) => path.resolve( sourceRoot, mapSourceRoot ) );

        this._sources = map.sources.map( ( source, i ) => {
            const content = ( sourcesContent[i] == null ) ? undefined : sourcesContent[i];
            if ( source && sourceRoots ) {
                const fileResolved = sourceRoots
                    .map( ( sourceRoot ) => {
                        return path.resolve( sourceRoot, source );
                    });
                source = fileResolved.find( fse.existsSync ) || fileResolved[0];
            }
            return Node.Create( this._context, source, content );
        });
    }
}
