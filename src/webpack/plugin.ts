// const sourcery_map = require( '../' );
import type { Compiler } from 'webpack';
import { Compilation } from 'webpack';

// const DEFAULT_INCLUDE = /\.js$/;

export class Plugin {
    static pluginName = 'SourceryMapper';

    constructor ( options = {}) {
    }

    apply ( compiler: Compiler ) {
        compiler.hooks.compilation.tap( Plugin.pluginName, compilation => {
            compilation.hooks.processAssets.tapAsync(
                {
                    name: Plugin.pluginName,
                    stage: Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
                    additionalAssets: true
                },
                ( assets, callback ) => {
                    console.log( 'here we are' );
                }
            );
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