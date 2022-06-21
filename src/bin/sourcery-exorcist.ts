// import * as path from 'path';

import * as minimist from 'minimist';

import { transform } from '../pipe/transform';
import { parseCommandLine } from '../Options';

const command = minimist( process.argv.slice( 2 ), {
    boolean: [ 'h', 'help', 'e', 'error-on-missing' ],
    string: [ 'url', 'u', 'root', 'r', 'base', 'b' ]
});

// function onerror(err) {
//   console.error(err.toString());
//   process.exit(err.errno || 1);
// }

// function usage() {
//   var usageFile = path.join(__dirname, 'usage.txt');
//   fs.createReadStream(usageFile).pipe(process.stdout);
//   return;
// }

// if (command.h || command.help) return usage();


const mapfile = command._.shift();
if ( !mapfile ) {
    console.error( 'Missing map file' );
//   return usage();
}

// var url            = command.url            || command.u
//   , root           = command.root           || command.r
//   , base           = command.base           || command.b
//   , errorOnMissing = command.errorOnMissing || command.e || command['error-on-missing'];

// mapfile = path.resolve(mapfile);

const options = parseCommandLine( command );

process.stdin
    .pipe( transform( mapfile, options ) )
    .on( 'error', onerror )
    .on( 'missing-map', console.error.bind( console ) )
    .pipe( process.stdout );