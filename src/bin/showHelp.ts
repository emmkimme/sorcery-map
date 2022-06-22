import * as fse from 'fs-extra';
import * as path from 'path';

import type { Writable } from 'stream';

const findParentDir = require('find-parent-dir');

export function readPackageJSON() {
    const package_dirname = findParentDir.sync(__dirname, 'package.json');
    return fse.readJSONSync( path.join(package_dirname, 'package.json') );
}

export function streamHelp ( stream: Writable, tool: string ) {
    const stdout = ( stream || process.stderr );
    const package_dirname = findParentDir.sync(__dirname, 'package.json');
    const packageJSON = fse.readJSONSync( path.join(package_dirname, 'package.json') );
    stdout.write(`\n${packageJSON.name} ${packageJSON.version}\n`);
    
    const readme = fse.readFileSync( path.join(package_dirname, 'README.md') ).toString();
    const usageRegExp = new RegExp(`${tool}[^\`]*command line[^\`]*\`\`\`bash([^\`]*)`, 'i');
    const usageRegExpArray = usageRegExp.exec(readme);
    if (usageRegExpArray) {
        // do not why my regexp do not stop at first ``` !!
        const usage = usageRegExpArray[1];
        stdout.write( usage + '\n' );
    }
}