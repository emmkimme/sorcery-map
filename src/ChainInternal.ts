import * as path from 'path';

import * as fse from 'fs-extra';
import { encode, SourceMapSegment, SourceMapMappings, SourceMapLine } from 'sourcemap-codec';

import { generateSourceMappingURLComment, sourceMappingURLRegex } from './utils/sourceMappingURL';
import { slash } from './utils/path';

import { SourceMap } from './SourceMap';
import type { Stats } from './Stats';
import type { Options } from './Options';
import type { Node } from './Node';
import { parseOptions } from './Options';

/** @internal */
export class ChainInternal {
    private _node: Node;
    private _stats: Stats;

    constructor ( node: Node ) {
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
        const options = parseOptions( this._node.context.options, apply_options );

        if ( this._node.isOriginalSource || ( options && options.flatten === 'existing' && !this._node.isCompleteSourceContent ) ) {
            return null;
        }

        let allNames: string[] = [];
        let allSources: Node[] = [];

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

        let i = this._node.mappings.length;
        let allMappings: SourceMapMappings;
        if ( options.flatten ) {
            allMappings = new Array( i );
            // Trace mappings
            const tracingStart = process.hrtime();

            let j: number;
            let line: SourceMapLine;
            let result: SourceMapLine;

            while ( i-- ) {
                line = this._node.mappings[i];
                allMappings[i] = result = [];

                for ( j = 0; j < line.length; j += 1 ) {
                    applySegment( line[j], result );
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

        const file = path.basename( this._node.file || this._node.map.file );
        const map = new SourceMap({
            version: 3,
            file,
            sources: allSources.map( ( sourceNode ) => {
                return getSourcePath( this._node, sourceNode.file, options );
            }),
            sourcesContent: allSources.map( ( sourceNode ) => {
                return options.excludeContent ? null : sourceNode.content;
            }),
            names: allNames,
            mappings
        });
        if ( options.sourceRoot != null ) {
            map.sourceRoot = options.sourceRoot;
        }
        return map;
    }

    trace ( oneBasedLineIndex: number, zeroBasedColumnIndex: number, trace_options: Options ) {
        const options = parseOptions( this._node.context.options, trace_options );
        return this._node.trace( oneBasedLineIndex - 1, zeroBasedColumnIndex, null, options );
    }

    write ( dest?: string, write_options?: Options ) {
        return writeChain( this, dest, write_options );
    }

    writeSync ( dest?: string, write_options?: Options ) {
        writeSyncChain( this, dest, write_options );
    }

    getContentAndMap ( dest?: string, write_options?: Options ) {
        if ( typeof dest === 'string' ) {
            write_options = Object.assign({}, write_options );
            write_options.output = dest;
        }
        else if ( typeof dest === 'object' ) {
            write_options = dest;
            write_options.output = this._node.file;
        }
        else {
            write_options = Object.assign({}, write_options );
            write_options.output = this._node.file;
        }
        const options = parseOptions( this._node.context.options, write_options );

        const resolved = path.resolve( options.output );
        options.sourceRootBase = options.sourceRootBase ? path.resolve( options.sourceRootBase ) : path.dirname( resolved );
    
        const map = this.apply( options );
    
        if ( map ) {
            const url = ( options.sourceMappingURL === 'inline' ) ? map.toUrl() : ( ( options.sourceMappingURL === '[absolute-path]' ) ? resolved : path.basename( resolved ) ) + '.map';
            // TODO shouldn't url be path.relative?
            const content = this._node.content && this._node.content.replace( sourceMappingURLRegex, '' ) + generateSourceMappingURLComment( url, resolved );
            return { resolved, content, map, options };
        }
        else {
            const content = this._node.content && this._node.content.replace( sourceMappingURLRegex, '' );
            return { resolved, content, options };
        }
    }
}

function tally ( nodes: Node[]) {
    return nodes.reduce( ( total, node ) => {
        return total + node.decodingTime;
    }, 0 );
}

function getSourcePath ( node: Node, source: string, options: Options ) {
    const replacer: Record<string, string> = {
        '[absolute-path]': source,
        '[relative-path]': path.relative( options.sourceRootBase || ( node.file ? path.dirname( node.file ) : '' ), source )
    };
    let sourcePath = options.sourcePathTemplate;
    Object.keys( replacer ).forEach( ( key ) => {
        sourcePath = sourcePath.replace( key, replacer[key]);
    });
    return slash( sourcePath );
}

function writeChain ( chain: ChainInternal, dest: string, write_options: Options ) {
    const { resolved, content, map, options } = chain.getContentAndMap( dest, write_options );
    return fse.ensureDir( path.dirname( resolved ) )
        .then( () => {
            const promises = [];
            if ( content ) {
                promises.push( fse.writeFile( resolved, content ) );
            }
            if ( map && options.sourceMappingURL !== 'inline' ) {
                promises.push( fse.writeFile( resolved + '.map', map.toString() ) );
            }

            return Promise.all( promises ).then( () => {});
        });
}

function writeSyncChain ( chain: ChainInternal, dest: string, write_options: Options ) {
    const { resolved, content, map, options } = chain.getContentAndMap( dest, write_options );
    fse.ensureDirSync( path.dirname( resolved ) );
    if ( content ) {
        fse.writeFileSync( resolved, content );
    }
    if ( map && options.sourceMappingURL !== 'inline' ) {
        fse.writeFileSync( resolved + '.map', map.toString() );
    }
}
