# sourcery-map.js

This package is a JavaScript source map management toolset
- fork of [sorcery](https://github.com/Rich-Harris/sorcery)
- including [exorcist](https://www.npmjs.com/package/exorcist)
- implementing [webpack](https://webpack.js.org/) loader and plugin
- implementing [esbuild](https://esbuild.github.io/) plugin

The purpose is to be consistent, have the same implementation and the same options for managing these different purposes.
 
**We merged pull requests**  
* [Adjust delimiter used to detect the end of source map URLs in JS files](https://github.com/Rich-Harris/sorcery/pull/176)
* [chore(deps-dev): bump eslint from 2.13.1 to 6.6.0](https://github.com/Rich-Harris/sorcery/pull/175)
* [Handle file:// paths to source files](https://github.com/Rich-Harris/sorcery/pull/173)
* [Ignore missing / unavailable files](https://github.com/Rich-Harris/sorcery/pull/165)
* [Single character segment compatibility (needed for traceur)](https://github.com/Rich-Harris/sorcery/pull/14)
* [chore(deps-dev): bump eslint from 2.13.1 to 6.6.0](https://github.com/Rich-Harris/sorcery/pull/175)

**New features**
* Flatten is optional and can be limited to existing physical files only (ease the debugging)
* source path can be customized, relative or absolute.
* Provide a source root resolution fallback when map has been generated from another path (browserify)
* sourceMappingURL can be inline content, absolute, relative...

**Beware**, some features are still experimental and not fully covered by tests, if you find an issue, do not hesitate to create a bug or contribute ;-)

## Usage

First, install sourcery-map globally:

```bash
npm install -g sourcery-map
```

## Options

### Reading map (load, loadSync)
| API                  | Command line           | Value                                | Description |
| -------------------- | ---------------------- | ------------------------------------ | ----------- |
| ---                  | -i, --input            | `<file>`<br/>`<folder>`              | Input file<br/>Input folder |
| content              | ---                    | a map of `filename: contents` pairs. | `filename` will be resolved against the current working directory if needs be |
| sourcemaps           | ---                    | a map of `filename: sourcemap` pairs | where `filename` is the name of the file the sourcemap is related to. This will override any `sourceMappingURL` comments in the file itself |
| sourceRootResolution | --sourceRootResolution | <folder>                             | base path of the relative sources path in the map |

### Generating map (apply, write, writeSync)
| API                      | Command line         | Value       | Description |
| ------------------------ | -------------------- | ----------- | ----------- |
| ---                      | -o, --output         | `<file>`    | Output file (if absent, will use input) |
| excludeContent           | -x, --excludeContent | flag        | Don't populate the sourcesContent array |
| sourceMappingURLTemplate | --sourceMappingURLTemplate | `[relative-path]` (default)<br/>`[resource-path]`<br/>`[absolute-path]`<br/>`inline`<br/>`none`<br>`<string>`| SourceMapping path is relative to the file map location or `sourceMappingURLBase`<br/>relative-path without root ([drive]:/ or /)<br/>SourceMapping path is absolute</br>Append map as a data URI rather than separate file</br>Remove map reference<br/>TBD|
| sourceMappingURLBase     | --sourceMappingURLBase | `<folder>`  | allows the base to be specified as something other than the map file, used by `[relative-path]`/`[resource-path]` |
| sourcePathTemplate       | --sourcePathTemplate | `[relative-path]` (default)<br/>`[resource-path]`<br/>`[absolute-path]`<br/>`<string>`| Source paths are relative to the file location or `sourcePathBase`<br/>relative-path without root ([drive]:/ or /)<br/>Source paths are absolute<br/>Customize the relative path, can contain `[relative-path]` or `[absolute-path]`<br/>for instance ```webpack://[resource-path]``` |
| sourcePathBase           | --sourcePathBase     | `<folder>`  | Base path for calculating relative source paths, used by `[relative-path]`/`[resource-path]` |
| sourceRoot               | --sourceRoot         | `<folder>`  | Root URL for loading relative source paths. Set as sourceRoot in the source map |
| flatten                  | -f, --flatten        | `full` (default)<br/>`existing`<br/>`<false>` | flatten source map until the original file is reached<br/>flatten source map as long as the file (content) exists<br/>do not flatten the map |

### deprecated
| API                      | Command line         | Value       | Description |
| ------------------------ | -------------------- | ----------- | ----------- |
| inline                   | -d, --datauri        | flag        | equivalent to `sourceMappingURLTemplate=inline` |
| absolutePath             | ---                  | flag        | equivalent to `sourceMappingURLTemplate=[absolute-path]` |
| sourceMappingURL         | --sourceMappingURL   |             | see `sourceMappingURLTemplate` |

### misc
| Command line  | Description |
| ------------- |----------- |
| -h, --help    | Show help message |
| -v, --version | Show version |


## Sourcery-map

### command line

```
  Usage:
    sourcery-map <input file> [options]

  Resolve a chain of sourcemaps back to the original source.

  Options:
    -h, --help                      Show help message
    -v, --version                   Show version
    -i, --input <file|folder>       Input file (option will override default provided value)
    -o, --output <file|folder>      Output file (if absent, will overwrite input)
    -d, --datauri                   Append map as a data URI, rather than separate file
    -x, --excludeContent            Do not populate the sourcesContent array

Examples:

  # overwrite sourcemap in place (will write map to
  # some/generated/code.min.js.map, and update
  # sourceMappingURL comment if necessary
  sourcery-map -i some/generated/code.min.js

  # append flattened sourcemap as an inline data URI
  # (will delete existing .map file, if applicable)
  sourcery-map -d -i some/generated/code.min.js

  # write to a new file (will create newfile.js and
  # newfile.js.map)
  sourcery-map -i some/generated/code.min.js -o newfile.js
```

### API

```js
interface SourceMap {
    version: 3;
    file: string;
    sources: string[];
    sourcesContent: string[];
    names: string[];
    mappings: string;
    sourceRoot: string;
    toString(): string;
    toUrl(): string;
}

interface Chain {
    apply ( apply_options: Options ): SourceMap | null;
    trace ( oneBasedLineIndex: number, zeroBasedColumnIndex: number, trace_options: Options ): Trace;

    write ( write_options?: Options ): Promise<void>;
    write ( dest: string, write_options?: Options ): Promise<void>;
    writeSync ( write_options?: Options ): void;
    writeSync ( dest: string, write_options?: Options ): void;
}

function load(file: string, options: Options): Promise<Chain | null>;
function loadSync(file: string, options: Options): Chain | null;
```

```js
var sourcery_map = require( 'sourcery-map' );

sourcery_map.load( 'some/generated/code.min.js' ).then( ( chain ) => {
  // generate a flattened sourcemap
  var map = chain.apply(); // { version: 3, file: 'code.min.js', ... }

  // get a JSON representation of the sourcemap
  map.toString(); // '{"version":3,"file":"code.min.js",...}'

  // get a data URI representation
  map.toUrl(); // 'data:application/json;charset=utf-8;base64,eyJ2ZXJ...'

  // write to a new file - this will create `output.js` and
  // `output.js.map`, and will preserve relative paths. It
  // returns a Promise
  chain.write( 'output.js' );

  // write to a new file but use an absolute path for the
  // sourceMappingURL
  chain.write( 'output.js', { absolutePath: true });

  // write to a new file, but append the flattened sourcemap as a data URI
  chain.write( 'output.js', { inline: true });

  // overwrite the existing file
  chain.write();
  chain.write({ inline: true });

  // find the origin of line x, column y. Returns an object with
  // `source`, `line`, `column` and (if applicable) `name` properties.
  // Note - for consistency with other tools, line numbers are always
  // one-based, column numbers are always zero-based. It's daft, I know.
  var loc = chain.trace( x, y );
});

// You can also use sourcery-map synchronously:
var chain = sourcery_map.loadSync( 'some/generated/code.min.js' );
var map = chain.apply();
var loc = chain.trace( x, y );
chain.writeSync();
```

You can pass an optional second argument to sourcery_map.load() and sourcery_map.loadSync(), with zero or more of the following properties:
content - a map of filename: contents pairs. filename will be resolved against the current working directory if needs be
sourcemaps - a map of filename: sourcemap pairs, where filename is the name of the file the sourcemap is related to. This will override any sourceMappingURL comments in the file itself.
```js
sourcery_map.load( 'some/generated/code.min.js', {
  content: {
    'some/minified/code.min.js': '...',
    'some/transpiled/code.js': '...',
    'some/original/code.js': '...'
  },
  sourcemaps: {
    'some/minified/code.min.js': {...},
    'some/transpiled/code.js': {...}
  },
  existingContentOnly: false
}).then( chain => {
  /* ... */
});
```
Any files not found will be read from the filesystem as normal.

## Sourcery-exorcist
Can replace [exorcist](https://www.npmjs.com/package/exorcist)

### command line
```
  Usage:
    sourcery-exorcist <map file> [options]

  Externalizes the source map of the file streamed in.

  The source map is written as JSON to map_file, and the original file is streamed out with its
  sourceMappingURL set to the path of map_file (or to the value of the --url option).

  Options:
    --base -b   Base path for calculating relative source paths.
                (default: use absolute paths)

    --root -r   Root URL for loading relative source paths.
                Set as sourceRoot in the source map.
                (default: '')

    --url -u   Full URL to source map.
              Set as sourceMappingURL in the output stream.
              (default: map_file)

    --error-on-missing -e   Abort with error if no map is found in the stream.
                          (default: warn but still pipe through source)

Examples:

  Bundle main.js with browserify into bundle.js and externalize the map to bundle.js.map.

    browserify main.js --debug | sourcery-exorcist bundle.js.map > bundle.js
```

### API

```js
function transform(mapFileOrStream: string | Writable, options?: Options): Transform;
```

```js
  const basedir = process.cwd();
  const browserify_options = { 
        debug: true,
        basedir,
        ...options
    };

    browserify(inputFile, browserify_options)
    .bundle()
    .pipe(exorcist(mapFile, undefined, undefined, path.dirname(inputFile)))
    .pipe(fse.createWriteStream(bundleFile));
```
by such code
```js
    .pipe(sourcery_map.transform(mapFile, { flatten: false, sourcePathBase: path.dirname(inputFile) }))]
    .pipe(fse.createWriteStream(bundleFile));
```

you can flatten the map at the same time
```js
    .pipe(sourcery_map.transform(mapFile, {
        flatten: 'existing',
        sourcePathBase: path.dirname(inputFile),
        excludeContent: true
    }))]
    .pipe(fse.createWriteStream(bundleFile));
```

## [Webpack](https://webpack.js.org/) >= 5.x

### Loader
If you are happy with source maps generated by Webpack but would like to have them flattened, this is the good way to do this.  
Can replace [source-map-loader](https://github.com/webpack-contrib/source-map-loader). On our side, this plugin is in trouble when reaching content not present on the machine.

```js
module.exports = {
...
  module: {
            rules: [
                {
                    test: /\.js$/,
                    use: [
                        { loader : 'sourcery-map/webpack-loader',
                          options: { 
                              excludeContent: true
                          }
                        },
                        // { loader : "source-map-loader" },
                    ]
                },
            ]
```

### Plugin
If the Webpack source maps are not properly generated, problem of paths, roots, ... this plugin could help to fix/normalize them.  

Here, webpack will generated map files using absolute paths, our plugin will normalize paths and flattern them.
```js
const SourceryMapperPlugin = require('sourcery-map/webpack-plugin');

module.exports = {
 ...
  module: {
    devtool: "source-map",
    plugins: [new SourceryMapperPlugin( { excludeContent: true } )],

    output: {
        sourceMapFilename: `[file].map`,
        devtoolModuleFilenameTemplate: "[absolute-resource-path]",
        devtoolFallbackModuleFilenameTemplate: `"[absolute-resource-path]?[hash]`
    },

```

## [esbuild](https://esbuild.github.io/)

### Plugin (experimental)
```js
const sourcery_map_esbuild = require('sourcery-map/esbuild-plugin');

 const options = {
        target: 'es2020',
        entryPoints: 'main.js',
        bundle: true,
        external: ['electron'],
        plugins: [ sourcery_map_esbuild({
            sourcePathBase: path.dirname(config.name),
            excludeContent: true,
            flatten: 'existing',
        })],
        sourcemap: true,
        sourcesContent: false,
        loader: { 
            ".node": "file",
            ".json": "file"
        },
        logLevel: 'info'
      }

```

## License

MIT
