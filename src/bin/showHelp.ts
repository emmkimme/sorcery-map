import * as path from 'path';

import * as fse from 'fs-extra';

import type { Writable } from 'stream';

export function injectVersion ( stream: Writable ) {
    fse.readFile( path.join( __dirname, 'help.md' ), ( err, result ) => {
        if ( err ) throw err;
        const packageJSON = fse.readJSONSync( '../../package.json' );
        const help = result.toString().replace( '<%= version %>', packageJSON.version );
        ( stream || process.stderr ).write( '\n' + help + '\n' );
    });
}