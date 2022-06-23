import * as fse from 'fs-extra';
import * as path from 'path';

import type { Writable } from 'stream';

import findParentDir from 'find-parent-dir';

export function readPackageJSON () {
    const package_dirname = findParentDir.sync( __dirname, 'package.json' );
    return fse.readJSONSync( path.join( package_dirname, 'package.json' ) );
}

export function streamHelp ( stream: Writable, tool: string ) {
    const stream_output = ( stream || process.stderr );
    const package_dirname = findParentDir.sync( __dirname, 'package.json' );
    const packageJSON = fse.readJSONSync( path.join( package_dirname, 'package.json' ) );
    stream_output.write( `\n${packageJSON.name} ${packageJSON.version}\n` );
    
    const readme = fse.readFileSync( path.join( package_dirname, 'README.md' ) ).toString();
    const usageRegExp = new RegExp( `${tool}[^\`]*command line[^\`]*\`\`\`bash([^\`]*)`, 'i' );
    const usageRegExpArray = usageRegExp.exec( readme );
    if ( usageRegExpArray ) {
        const usage = usageRegExpArray[1];
        stream_output.write( usage + '\n' );
    }
}