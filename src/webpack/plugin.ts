import * as path from 'path';

import type { Compiler, LoaderOptionsPlugin } from 'webpack';

import { ChainInternal } from '../ChainInternal';
import { Context } from '../Context';
import type { Options } from '../Options';
import { Serial } from '../utils/promise';

const JS_FILE_REGEXP = /\.js$/;

export class Plugin implements LoaderOptionsPlugin {
    static pluginName = 'SourceryMapper';

    private _options: Options;

    constructor ( options: Options ) {
        this._options = options;
    }

    get options () {
        return this._options;
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
                        return ChainInternal.Load( context, path.join( compiler.context, file ) )
                            .then( ( chain ) => {
                                if ( chain ) {
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