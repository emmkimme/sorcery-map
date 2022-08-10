import * as path from 'path';

// import type { InputFileSystem, OutputFileSystem } from 'webpack';

import { Node } from './Node';
import { Options, mergeOptions } from './Options';

/** @internal */
export interface NodeCacheByFile {
    [file: string]: Node;
}

/** @internal */
export class Context {
    private _nodeCacheByFile: NodeCacheByFile;
    private _sourceRoots: string[];
    private _options: Options;
    private _origin: string;

    constructor ( origin: string, context_options: Options ) {
        this._origin = origin;
        this._options = context_options;
        this._nodeCacheByFile = {};
        this._sourceRoots = [];

        const options = mergeOptions( context_options );

        if ( options.sourceRootResolution ) {
            this._sourceRoots.push( path.resolve( options.sourceRootResolution ) );
        }
        const originDirectory = path.resolve( origin );
        if  ( !this._sourceRoots.includes( originDirectory ) ) {
            this._sourceRoots.push( originDirectory );
        }

        if ( options.content ) {
            Object.keys( options.content ).forEach( key => {
                const file = path.resolve( key );
                const content = options.content[key];
                Node.Create( this, file, content );
            });
        }
        if ( options.sourcemaps ) {
            Object.keys( options.sourcemaps ).forEach( key => {
                const file = path.resolve( key );
                const map = options.sourcemaps[key];
                Node.Create( this, file, undefined, map );
            });
        }
    }

    log ( message: string ) {
        // this._options = this._options || {};
        // this._options.verbose = true;
        if ( this._options && this._options.verbose === true ) {
            console.log( message );
        }
    }

    get cache () {
        return this._nodeCacheByFile;
    }

    get origin () {
        return this._origin;
    }

    get sourceRoots () {
        return this._sourceRoots;
    }

    get options () {
        return this._options;
    }
}
