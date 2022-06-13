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

function getMapFromBase64 ( url: string ): SourceMapProps | null {
    if ( /^data:/.test( url ) ) { // TODO beef this up
        const match = /base64,(.+)$/.exec( url );
        if ( !match ) {
            throw new Error( `${SOURCEMAPPING_URL} is not base64-encoded` );
        }
        const json = atob( match[1]);
        const map = parseJSON( json );
        return map;
    }
    return null;
}

/** @internal */
export function getMapFromUrl ( url: string, base: string ): Promise<SourceMapProps | null> {
    const map = getMapFromBase64( url );
    if ( map ) {
        return Promise.resolve( map );
    }

    url = path.resolve( base, decodeURI( url ) );
    return fse.readFile( url, { encoding: 'utf-8' })
        .catch( () => null )
        .then( ( json ) => {
            return json ? parseJSON( json ): null;
        });
}

/** @internal */
export function getMapFromUrlSync ( url: string, base: string ): SourceMapProps | null {
    const map = getMapFromBase64( url );
    if ( map ) {
        return map;
    }

    url = path.resolve( base, decodeURI( url ) );
    let json: string;
    try {
        json = fse.readFileSync( url, { encoding: 'utf-8' });
    }
    catch ( e ) {
        json = null;
    }
    return json ? parseJSON( json ): null;
}