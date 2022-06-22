#!/usr/bin/env node

import * as path from 'path';

import * as minimist from 'minimist';
import * as fse from 'fs-extra';
import * as globby from 'globby';
const findParentDir = require('find-parent-dir');

import { streamHelp } from './showHelp';
import * as sourcery_map from '..';
import { parseSorceryCommandLine } from '../Options';

const command = minimist( process.argv.slice( 2 ), {
    alias: {
        i: 'input',
        o: 'output',
        v: 'version',
        h: 'help',
        d: 'datauri',
        x: 'excludeContent',
        f: 'flatten',
        // b: 'base'
    }
});
command.input = command.input || command._.shift();

if ( command.help ) {
    streamHelp( process.stdout, 'so[u]?rcery-map' );
}

else if ( process.argv.length <= 2 && process.stdin.isTTY ) {
    streamHelp( process.stderr, 'so[u]?rcery-map' );
}

else if ( command.version ) {
    const package_dirname = findParentDir.sync(__dirname, 'package.json');
    const packageJSON = fse.readJSONSync( path.join(package_dirname, 'package.json') );
    console.log( packageJSON.version );
}

else if ( !command.input ) {
    console.error( 'Error: You must supply an --input (-i) argument. Type sourcery --help for more info' );
}

else {
    const options = parseSorceryCommandLine( command );
    fse.stat( command.input )
        .then( function ( stats ) {
            if ( stats.isDirectory() ) {
                const globby_options = {
                    cwd: command.input
                };
                return globby( '**/*.js', globby_options )
                    .then( ( files ) => {
                        return files.reduce( ( promise, file ) => {
                            return promise.then( function () {
                                const input = path.join( command.input, file );
                                const output = path.join( command.output, file );
                                return sourcery_map.load( input, options ).then( ( chain ) => {
                                    return chain.write( output, options );
                                });
                            });
                        }, Promise.resolve() );
                    });
            }
            else {
                return sourcery_map.load( command.input, options ).then( ( chain ) => {
                    return chain.write( command.output, options );
                });
            }
        })
        .catch( ( err: unknown ) => {
            setTimeout( () => {
                throw err;
            });
        });
}
