import * as path from 'path';

import type { Compiler } from 'webpack';

import { ChainInternal } from '../ChainInternal';
import { Context } from '../Context';
import { Node } from '../Node';
import type { Options } from '../Options';
import { Serial } from '../utils/promise';

const JS_FILE_REGEXP = /\.js$/;

export class Plugin {
    static pluginName = 'SourceryMapper';

    private _options: Options;

    constructor ( options: Options ) {
        this._options = options;
    }

    apply ( compiler: Compiler ) {
        compiler.hooks.afterEmit.tapPromise( Plugin.pluginName, ( compilation ) => {
            const files = new Set<string>();
            for ( const chunk of compilation.chunks ) {
                for ( const file of chunk.files ) {
                    files.add( file );
                }
                for ( const file of chunk.auxiliaryFiles ) {
                    files.add( file );
                }
            }

            const context = new Context( compiler.context, this._options );
            // Would prefer to serialize in case of multiple access/s to the same sources
            const sourceries = Array.from( files )
                .filter( file => JS_FILE_REGEXP.test( file ) )
                .map( ( file ) => {
                    return () => {
                        const node = Node.Create( context, path.join( compiler.context, file ) );
                        return node.load()
                            .then( () => {
                                if ( !node.isOriginalSource ) {
                                    const chain = new ChainInternal( node );
                                    return chain.write();
                                }
                                else {
                                    return Promise.resolve();
                                }
                            });
                    };
                });
            return Serial( sourceries ).then( () => {});
        });
    }
}