import * as path from 'path';

import type { OnLoadResult, Plugin as ESBuildPlugin, PluginBuild } from 'esbuild/lib/main';

import { Options, JS_FILE_REGEXP } from '../Options';
import { ChainInternal } from '../ChainInternal';
import { Context } from '../Context';

export function Plugin ( options: Options ): ESBuildPlugin {
    return {
        name: 'sourcery-map',
        setup ( build: PluginBuild ): void | Promise<void> {
            build.onLoad({ filter: JS_FILE_REGEXP }, ({ path: file }) => {
                const context = new Context( path.resolve(), options );
                return ChainInternal.Load( context, file ).then( ( chain ) => {
                    const onLoadResult: OnLoadResult = {};
                    if ( chain ) {
                        const { content, map } = chain.getContentAndMap( );
                        if ( !map && content ) {
                            onLoadResult.contents = content;
                        }
                    }
                    return onLoadResult;
                });
            });
        }
    };
}
