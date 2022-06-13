import * as path from 'path';

import type { Compiler } from 'webpack';

import { ChainInternal } from '../ChainInternal';
import { Context } from '../Context';
import { Node } from '../Node';
import type { Options } from '../Options';

const JS_FILE_REGEXP = /\.js$/;

export class Plugin {
    static pluginName = 'SourceryMapper';

    private _options: Options;

    constructor ( options: Options ) {
        this._options = options;
    }

    apply ( compiler: Compiler ) {
        compiler.hooks.emit.tap( Plugin.pluginName, ( compilation ) => {
            const context = new Context( compiler.context, this._options );
            const files = new Set<string>();
            for (const chunk of compilation.chunks) {
                for (const file of chunk.files) {
                    files.add(file);
                }
                for (const file of chunk.auxiliaryFiles) {
                    files.add(file);
                }
            }
            for (const file of files) {
                if (JS_FILE_REGEXP.test(file)) {
                    const node = Node.Create(context, path.join(compiler.context, file));
                    node.loadSync();
                    if (!node.isOriginalSource) {
                        const chain = new ChainInternal(node);
                        chain.writeSync();
                    }
                }
            }
        });
    }
}