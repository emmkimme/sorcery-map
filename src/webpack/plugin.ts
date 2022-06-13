const { loadSync } = require( '../load' );
import type { Compiler } from 'webpack';
import { Options, parseOptions } from '../Options';
// import { Compilation } from 'webpack';

// const DEFAULT_INCLUDE = /\.js$/;

export class Plugin {
    static pluginName = 'SourceryMapper';

    private _options: Options;

    constructor ( options ) {
        this._options = parseOptions(options);
    }

    apply ( compiler: Compiler ) {
        compiler.hooks.emit.tap( Plugin.pluginName, ( compilation ) => {
            compilation.chunks.forEach((chunk) => {

               let ref = json[chunk.name]
            });
        });
    }
  
    // getFiles(compilation: webpack.Compilation) {
    //   return Object.keys(compilation.assets)
    //     .map((name) => {
    //       if (this.isIncludeOrExclude(name)) {
    //         return {
    //           name,
    //           path: compilation.assets[name].existsAt
    //         };
    //       }
    //       return null;
    //     })
    //     .filter(i => i);
    // }

    // isIncludeOrExclude(filename: string) {
    //   const isIncluded = DEFAULT_INCLUDE.test(filename);
    //   return isIncluded;
    // }

    // sorceryFiles(files: string[]) {
    //   return Promise.all(files.map(({
    //     path,
    //     name
    //   }) => sourcery_map.load(path).then((chain) => chain.write())));
    // }
}