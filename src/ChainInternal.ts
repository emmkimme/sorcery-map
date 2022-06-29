import * as path from 'path';

import * as fse from 'fs-extra';
import { encode, SourceMapSegment, SourceMapMappings, SourceMapLine } from 'sourcemap-codec';
import { writable } from 'is-stream';

import { replaceSourceMappingURLComment } from './utils/sourceMappingURL';
import { slash } from './utils/path';

import { SourceMap, SourceMapProps } from './SourceMap';
import type { Stats } from './Stats';
import { parseWriteOptions, Options } from './Options';
import { Node } from './Node';
import { mergeOptions } from './Options';
import type { Context } from './Context';
import type { Writable } from 'stream';
import type { Chain } from './Chain';

/** @internal */
export class ChainInternal implements Chain {
    static Load ( context: Context, file?: string, content?: string, map?: SourceMapProps ): Promise<ChainInternal | null> {
        return Node.Load( context, file, content, map )
            .then( ( node ) => node.isOriginalSource ? null : new ChainInternal( node ) );
    }

    static LoadSync ( context: Context, file?: string, content?: string, map?: SourceMapProps ): ChainInternal | null {
        const node = Node.LoadSync( context, file, content, map );
        return node.isOriginalSource ? null : new ChainInternal( node );
    }

    private _node: Node;
    private _stats: Stats;

    private constructor ( node: Node ) {
        this._node = node;
        this._stats = {
            decodingTime: 0,
            encodingTime: 0,
            tracingTime: 0,
        
            untraceable: 0,
        };
    }

    stats (): Stats {
        return {
            decodingTime: ( this._stats.decodingTime + tally( this._node.sources ) ) / 1e6,
            encodingTime: this._stats.encodingTime / 1e6,
            tracingTime: this._stats.tracingTime / 1e6,

            untraceable: this._stats.untraceable
        };
    }

    apply ( apply_options: Options ): SourceMap | null {
        return this._generateMap(this._node.file, apply_options);
    }

    private _generateMap ( content_file: string, apply_options: Options ): SourceMap | null {
        const options = mergeOptions( this._node.context.options, apply_options );

        if ( !this._node.map || ( options && options.flatten === 'existing' && !this._node.isCompleteSourceContent ) ) {
            return null;
        }

        let allNames: string[] = [];
        let allSources: Node[] = [];
        let allMappings: SourceMapMappings;

        const applySegment = ( segment: SourceMapSegment, result: SourceMapLine ) => {
            if ( segment.length < 4 ) return;

            const traced = this._node.sources[ segment[1] ].trace( // source
                segment[2], // source code line
                segment[3], // source code column
                this._node.map.names[ segment[4] ],
                options
            );

            if ( !traced ) {
                this._stats.untraceable += 1;
                return;
            }

            let sourceIndex = allSources.findIndex( ( node ) => node.file === traced.source );
            if ( !~sourceIndex ) {
                sourceIndex = allSources.length;
                allSources.push( this._node.context.cache[traced.source]);
            }

            const newSegment: SourceMapSegment = [
                segment[0], // generated code column
                sourceIndex,
                traced.line - 1,
                traced.column
            ];

            if ( traced.name ) {
                let nameIndex = allNames.indexOf( traced.name );
                if ( !~nameIndex ) {
                    nameIndex = allNames.length;
                    allNames.push( traced.name );
                }
                newSegment.push( nameIndex );
            }

            result.push( newSegment );
        };

        if ( options.flatten ) {
            let i = this._node.mappings.length;
            allMappings = new Array( i );
            // Trace mappings
            const tracingStart = process.hrtime();
            while ( i-- ) {
                const line = this._node.mappings[i];
                allMappings[i] = [];

                for ( let j = 0; j < line.length; j += 1 ) {
                    applySegment( line[j], allMappings[i]);
                }
            }

            const tracingTime = process.hrtime( tracingStart );
            this._stats.tracingTime = 1e9 * tracingTime[0] + tracingTime[1];
        }
        else {
            allMappings = this._node.mappings;
            allSources = this._node.sources;
            allNames = this._node.map.names;
        }

        // Encode mappings
        const hrEncodingStart = process.hrtime();
        const mappings = encode( allMappings );
        const hrEncodingTime = process.hrtime( hrEncodingStart );
        this._stats.encodingTime = 1e9 * hrEncodingTime[0] + hrEncodingTime[1];

        const map_file = path.basename(content_file || this._node.map.file );
        // source locations are usually compute from the content file origin
        const sourceRootDefault = content_file ? path.dirname(content_file) : this._node.context.origin;
        const map = new SourceMap({
            version: 3,
            file: map_file,
            sources: allSources.map( ( sourceNode ) => {
                return computeSourcePath( sourceRootDefault, sourceNode.file, options );
            }),
            sourcesContent: allSources.map( ( sourceNode ) => {
                return options.excludeContent ? null : sourceNode.content;
            }),
            names: allNames,
            mappings
        });
        const map_sourceRoot = [ options.sourceRoot, this._node.map.sourceRoot ].find( ( sourceRoot ) => sourceRoot != null );
        if ( map_sourceRoot != null ) {
            map.sourceRoot = map_sourceRoot;
        }
        return map;
    }

    trace ( oneBasedLineIndex: number, zeroBasedColumnIndex: number, trace_options: Options ) {
        const options = mergeOptions( this._node.context.options, trace_options );
        return this._node.trace( oneBasedLineIndex - 1, zeroBasedColumnIndex, null, options );
    }

    write ( write_raw_options?: Options ): Promise<void>;
    write ( dest: string, write_raw_options?: Options ): Promise<void>;
    write ( destOrOptions: string | Options, write_raw_options?: Options ): Promise<void> {
        const { options: write_options, output } = parseWriteOptions( destOrOptions, write_raw_options );
        const content_file = output ? path.resolve(output) : this._node.file;
        const { content, map_file, map_stream, map } = this.getContentAndMap( content_file, null, write_options );
        const promises = [];
        if ( content ) {
            promises.push( fse.ensureDir( path.dirname( content_file ) ).then( () => fse.writeFile( content_file, content ) ) );
        }
        if ( map_stream ) {
            map_stream.end( map.toString(), 'utf-8' );
        }
        else if ( map_file ) {
            promises.push( fse.ensureDir( path.dirname( map_file ) ).then( () => fse.writeFile( map_file, map.toString() ) ) );
        }
        return Promise.all( promises ).then( () => {});
    }

    writeSync ( write_raw_options?: Options ): void;
    writeSync ( dest: string, write_raw_options?: Options ): void;
    writeSync ( destOrOptions: string | Options, write_raw_options?: Options ): void {
        const { options: write_options, output } = parseWriteOptions( destOrOptions, write_raw_options );
        const content_file = output ? path.resolve(output) : this._node.file;
        const { content, map_file, map_stream, map } = this.getContentAndMap( content_file, null, write_options );
        if ( content ) {
            fse.ensureDirSync( path.dirname( content_file ) );
            fse.writeFileSync( content_file, content );
        }
        if ( map_stream ) {
            map_stream.end( map.toString(), 'utf-8' );
        }
        else if ( map_file ) {
            fse.ensureDirSync( path.dirname( map_file ) );
            fse.writeFileSync( map_file, map.toString() );
        }
    }
    
    // Tons of parameters (optional or mandatory), options, configurations to manage !!!
    getContentAndMap ( content_file?: string, map_output?: string | Writable, write_options?: Options ) {
        const options = mergeOptions( this._node.context.options, write_options );

        const candidat_map_file = (typeof map_output === 'string') ? path.resolve(map_output): content_file ? content_file + '.map' : null;
        const candidat_map_stream = writable(map_output) ? map_output: null;

        const map = this._generateMap( content_file, options );
        if ( map ) {
            const map_file = ( options.sourceMappingURLTemplate === 'inline') ? null : candidat_map_file;
            const map_stream = ( options.sourceMappingURLTemplate === 'inline') ? null : candidat_map_stream;
            const sourceMappingURLDefault = content_file ? path.dirname(content_file) : map_file ? path.dirname(map_file) : this._node.context.origin;
            const sourceMappingURL = computeSourceMappingURL( sourceMappingURLDefault, map, map_file, options );

            const newSourceMappingURLInfo = { url: sourceMappingURL };
            // inherit of current info for optimizing replacement
            const info = this._node.mapInfo ? { ...this._node.mapInfo, ...newSourceMappingURLInfo } : newSourceMappingURLInfo;
            const content = this._node.content && replaceSourceMappingURLComment( this._node.content, info );
            return { content_file, content, map_file, map_stream, map };
        }
        else {
            const newSourceMappingURLInfo = { url: '' };
            // inherit of current info for optimizing replacement
            const info = this._node.mapInfo ? { ...this._node.mapInfo, ...newSourceMappingURLInfo } : newSourceMappingURLInfo;
            const content = this._node.content && replaceSourceMappingURLComment( this._node.content, info );
            return { content_file, content };
        }
    }
}

function tally ( nodes: Node[]) {
    return nodes.reduce( ( total, node ) => {
        return total + node.decodingTime;
    }, 0 );
}

function computeSourceMappingURL ( sourceMappingURLDefault: string, map: SourceMap, map_file: string, options: Options ) {
    let sourceMappingURL = options.sourceMappingURLTemplate;
    if ( sourceMappingURL === 'inline' ) {
        sourceMappingURL = map.toUrl();
    }
    else if ( sourceMappingURL === 'none' ) {
        sourceMappingURL = null;
    }
    else {
        const replacer: Record<string, () => string> = {
            '[absolute-path]': () => map_file,
            '[relative-path]': () => path.relative( options.sourceMappingURLBase || sourceMappingURLDefault, map_file ),
            '[resource-path]': () => {
                const result = path.relative( options.sourceMappingURLBase || sourceMappingURLDefault, map_file );
                const resultParts = path.parse(result);
                return result.substring(resultParts.root.length);
            }
        };
        Object.keys( replacer ).forEach( ( key ) => {
            if ( sourceMappingURL.includes( key ) ) {
                try {
                    sourceMappingURL = sourceMappingURL.replace( key, replacer[key]() );
                }
                catch ( err ) {
                    throw new Error( 'map file URL is required' );
                }
            }
        });
    }
    return sourceMappingURL;
}

function computeSourcePath ( sourceRootDefault: string, source_file: string, options: Options ) {
    const replacer: Record<string, () => string> = {
        '[absolute-path]': () => source_file,
        '[relative-path]': () => path.relative( options.sourceRootBase || sourceRootDefault, source_file ),
        '[resource-path]': () => {
            const result = path.relative( options.sourceRootBase || sourceRootDefault, source_file );
            const resultParts = path.parse(result);
            return result.substring(resultParts.root.length);
        }
    };
    let sourcePath = options.sourcePathTemplate;
    Object.keys( replacer ).forEach( ( key ) => {
        if ( sourcePath.includes( key ) ) {
            sourcePath = sourcePath.replace( key, replacer[key]() );
        }
    });
    return slash( sourcePath );
}
