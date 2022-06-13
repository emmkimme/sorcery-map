import * as path from 'path';

import { Node } from './Node';
import { Options, parseOptions } from './Options';

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

    constructor ( origin: string, options: Options ) {
        this._origin = origin;
        this._options = parseOptions( options );
        this._nodeCacheByFile = {};
        this._sourceRoots = [];

        if ( this._options.sourceRootResolution ) {
            this._sourceRoots.push( path.resolve( this._options.sourceRootResolution ) );
        }
        const currentDirectory = path.resolve();
        if  (!this._sourceRoots.includes(currentDirectory)) {
            this._sourceRoots.push( currentDirectory );
        }

        if ( this._options.content ) {
            Object.keys( this._options.content ).forEach( key => {
                const file = path.resolve( key );
                const content = this._options.content[key];
                Node.Create( this, file, content );
            });
        }
        if ( this._options.sourcemaps ) {
            Object.keys( this._options.sourcemaps ).forEach( key => {
                const file = path.resolve( key );
                const map = this._options.sourcemaps[key];
                Node.Create( this, file, undefined, map );
            });
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
