  Sourcery-map version <%= version %>
  =====================================

  Usage:
    sourcery-map [options]

  Options:
    -h, --help                      Show help message
    -v, --version                   Show version
    -i, --input <file|folder>       Input file
    -o, --output <file|folder>      Output file (if absent, will overwrite input)
    -d, --datauri                   Append map as a data URI, rather than separate file
    -x, --excludeContent            Don't populate the sourcesContent array


  Example:

    sourcery-map --input some/generated/code.min.js
    sourcery-map --input tmp --output dist


  For more information visit https://github.com/emmkimme/sourcery-map


usage: exorcist map_file [options]

  Externalizes the source map of the file streamed in.

  The source map is written as JSON to map_file, and the original file is streamed out with its
  sourceMappingURL set to the path of map_file (or to the value of the --url option).

OPTIONS:

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

EXAMPLE:

  Bundle main.js with browserify into bundle.js and externalize the map to bundle.js.map.

    browserify main.js --debug | exorcist bundle.js.map > bundle.js