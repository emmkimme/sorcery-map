import * as path from 'path';

import type { OnLoadResult, Plugin as ESBuildPlugin, PluginBuild } from 'esbuild/lib/main';

import { Options, JS_FILE_REGEXP } from '../Options';
import { ChainInternal } from '../ChainInternal';
import { Context } from '../Context';

export class Plugin implements ESBuildPlugin {
    public name: 'sourcery-map';
    private _options: Options;

    constructor ( options: Options ) {
        this._options = options;
    }

    setup ( build: PluginBuild ): void | Promise<void> {
        build.onLoad({ filter:JS_FILE_REGEXP }, ({ path: file }) => {
            const context = new Context( path.resolve(), this._options );
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
}