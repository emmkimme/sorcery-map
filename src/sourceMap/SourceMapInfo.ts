import * as path from 'path';

import * as fse from 'fs-extra';

import atob from '../utils/atob.js';

import { getSourceMappingURLInfo, SourceMappingURLInfo } from './sourceMappingURL';
import type { SourceMapProps } from './SourceMap.js';
import { sourceMappingURLProp } from './sourceMappingURL';

/** @internal */
export interface SourceMapInfoProps extends SourceMappingURLInfo {
    file?: string;
}

/** @internal */
export class SourceMapInfo implements SourceMapInfoProps {
    url: string;
    comment?: string;
    file?: string;

    constructor () {
    }

    readContent ( content: string ): SourceMappingURLInfo | null {
        const sourceMappingURLInfo = getSourceMappingURLInfo( content );
        if ( sourceMappingURLInfo ) {
            Object.assign( this, sourceMappingURLInfo );
        }
        else {
            this.url = this.comment = null;
        }
        return sourceMappingURLInfo;
    }

    readMap ( base: string ): Promise<SourceMapProps> {
        const base64_str = getRawMapFromBase64( this.url );
        if ( base64_str ) {
            return Promise.resolve()
                .then( () => {
                    return parseJSON( base64_str );
                });
        }
        this.file = path.resolve( base, this.url );
        return fse.readFile( this.file, { encoding: 'utf-8' })
            .then( ( file_str ) => {
                return parseJSON( file_str );
            });
    }

    readMapSync ( base: string ): SourceMapProps {
        const base64_str = getRawMapFromBase64( this.url );
        if ( base64_str ) {
            return parseJSON( base64_str );
        }
        this.file = path.resolve( base, this.url );
        const file_str = fse.readFileSync( this.file, { encoding: 'utf-8' });
        return parseJSON( file_str );
    }
}

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 * see chromium:\src\third_party\devtools-frontend\src\front_end\core\sdk\SourceMap.ts
 * see \webpack\source-map-loader\dist\index.js
 */
function parseJSON ( json: string ): SourceMapProps | null {
    try {
        return JSON.parse( json.replace( /^\)]}'[^\n]*\n/, '' ) );
    }
    catch ( err ) {
        throw new Error( `JSON.parse error ${err} - ${json}` );
    }
}

function getRawMapFromBase64 ( url: string ): string | null {
    if ( /^data:/.test( url ) ) { // TODO beef this up
        const match = /base64,(.+)$/.exec( url );
        if ( !match ) {
            throw new Error( `${sourceMappingURLProp} is not base64-encoded` );
        }
        return atob( match[1]);
    }
    return null;
}

