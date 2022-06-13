// const sourcery_map = require( '../' );
import type { Compiler } from 'webpack';
// import { Compilation } from 'webpack';

// const DEFAULT_INCLUDE = /\.js$/;

export class Plugin {
    static pluginName = 'SourceryMapper';

    constructor ( options = {}) {
    }

    apply ( compiler: Compiler ) {
        compiler.hooks.emit.tap( Plugin.pluginName, ( compilation ) => {
            const json: any = {};
            compilation.chunks.forEach((chunk) => {
                chunk.files.forEach((filename) => {
                  let ref = json[chunk.name]
                  if (ref === undefined) {
                    ref = {};
                    json[chunk.name] = ref;
                  }
          
                  if (filename.endsWith('css')) {
                    ref.css = filename;
                  } else if (filename.endsWith('css.map')) {
                    ref.cssMap = filename;
                  } else if (filename.endsWith('js')) {
                    ref.source = filename;
                  } else if (filename.endsWith('js.map')) {
                    ref.sourceMap = filename;
                  }
                });
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