import * as path from 'path';

import * as fse from 'fs-extra';

import type { SourceMapProps } from '../SourceMap.js';

import atob from './atob.js';
import { SOURCEMAPPING_URL } from './sourceMappingURL';

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 * see chromium:\src\third_party\devtools-frontend\src\front_end\core\sdk\SourceMap.ts
 * see \webpack\source-map-loader\dist\index.js
 */
function parseJSON ( json: string ) {
    return JSON.parse( json.replace( /^\)]}'[^\n]*\n/, '' ) );
}

function getRawMapFromBase64 ( url: string ): string | null {
    if ( /^data:/.test( url ) ) { // TODO beef this up
        const match = /base64,(.+)$/.exec( url );
        if ( !match ) {
            throw new Error( `${SOURCEMAPPING_URL} is not base64-encoded` );
        }
        return atob( match[1]);
    }
    return null;
}

/** @internal */
function getRawMapFromFile ( url: string, base: string ): Promise<string | null> {
    url = path.resolve( base, url );
    return fse.readFile( url, { encoding: 'utf-8' })
        .catch( () => null );
}

/** @internal */
export function getSourceMapFromUrl ( url: string, base: string ): Promise<SourceMapProps | null> {
    const raw_map = getRawMapFromBase64( url );
    const promise = raw_map ? Promise.resolve( raw_map ) : getRawMapFromFile( url, base );
    return promise
        .then( ( raw_map ) => {
            return raw_map ? parseJSON( raw_map ): null;
        })
        .catch ( ( err ) => null );
}

/** @internal */
function getRawMapFromFileSync ( url: string, base: string ): string | null {
    url = path.resolve( base, url );
    try {
        return fse.readFileSync( url, { encoding: 'utf-8' });
    }
    catch ( err ) {
        return null;
    }
}

/** @internal */
export function getSourceMapFromUrlSync ( url: string, base: string ): SourceMapProps | null {
    const raw_map = getRawMapFromBase64( url ) || getRawMapFromFileSync( url, base );
    try {
        return raw_map ? parseJSON( raw_map ): null;
    }
    catch ( err ) {
        return null;
    }
}