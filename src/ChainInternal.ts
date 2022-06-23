import * as path from 'path';

import * as fse from 'fs-extra';
import { encode, SourceMapSegment, SourceMapMappings, SourceMapLine } from 'sourcemap-codec';
import { writable } from 'is-stream';

import { replaceSourceMappingURLComment } from './utils/sourceMappingURL';
import { slash } from './utils/path';

import { SourceMap, SourceMapProps } from './SourceMap';
import type { Stats } from './Stats';
import { normalizeOutputOptions, Options } from './Options';
import { Node } from './Node';
import { resolveOptions } from './Options';
import type { Context } from './Context';
import type { Writable } from 'stream';

/** @internal */
export class ChainInternal {
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
        const options = resolveOptions( this._node.context.options, apply_options );

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

        const map_file = path.basename( this._node.file || this._node.map.file );
        const map = new SourceMap({
            version: 3,
            file: map_file,
            sources: allSources.map( ( sourceNode ) => {
                return computeSourcePath( this._node, sourceNode.file, options );
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
        const options = resolveOptions( this._node.context.options, trace_options );
        return this._node.trace( oneBasedLineIndex - 1, zeroBasedColumnIndex, null, options );
    }

    write ( dest?: string | Writable | Options, write_options?: Options ) {
        const { content_file, content, map_file, map_stream, map } = this.getContentAndMap( dest, write_options );
        const promises = [];
        if ( content ) {
            fse.ensureDirSync( path.dirname( content_file ) );
            promises.push( fse.writeFile( content_file, content ) );
        }
        if ( map_stream ) {
            map_stream.end( map.toString(), 'utf-8' );
        }
        else if ( map_file ) {
            fse.ensureDirSync( path.dirname( map_file ) );
            promises.push( fse.writeFile( map_file, map.toString() ) );
        }
        return Promise.all( promises ).then( () => {});
    }

    writeSync ( dest: string | Writable | Options, write_options?: Options ) {
        const { content_file, content, map_file, map_stream, map } = this.getContentAndMap( dest, write_options );
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
    
    getContentAndMap ( destOrStreamOrOptions?: string | Writable | Options, write_raw_options?: Options ) {
        const { options: write_options, map_output } = normalizeOutputOptions( destOrStreamOrOptions, write_raw_options );

        const options = resolveOptions( this._node.context.options, write_options );

        const content_file = ( typeof map_output === 'string' ) ? path.resolve( map_output ) : this._node.file;
        options.sourceRootBase = options.sourceRootBase ? path.resolve( options.sourceRootBase ) : content_file ? path.dirname( content_file ) : path.resolve();
    
        const map = this.apply( options );
        if ( map ) {
            const map_file = ( options.sourceMappingURLTemplate === 'inline' ) ? null : content_file ? content_file + '.map' : null;
            const map_stream = ( writable( map_output ) ) ? map_output : null;
            const sourceMappingURL = computeSourceMappingURL( map, map_file, options );

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

function computeSourceMappingURL ( map: SourceMap, map_file: string, options: Options ) {
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
            '[base-path]': () => path.basename( map_file )
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

function computeSourcePath ( node: Node, content_file: string, options: Options ) {
    const replacer: Record<string, () => string> = {
        '[absolute-path]': () => content_file,
        '[relative-path]': () => path.relative( options.sourceRootBase || ( node.file ? path.dirname( node.file ) : '' ), content_file )
    };
    let sourcePath = options.sourcePathTemplate;
    Object.keys( replacer ).forEach( ( key ) => {
        if ( sourcePath.includes( key ) ) {
            sourcePath = sourcePath.replace( key, replacer[key]() );
        }
    });
    return slash( sourcePath );
}
