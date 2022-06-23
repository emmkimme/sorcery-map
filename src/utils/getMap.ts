import type { Node } from '../Node';
import type { SourceMapProps } from '../SourceMap';

import { getSourceMapFromUrl, getSourceMapFromUrlSync } from './getMapFromUrl.js';
import { getSourceMappingURLInfo, SourceMappingURLInfo } from './sourceMappingURL';

/** @internal */
export interface SourceMapInfo {
    map: SourceMapProps;
    info?: SourceMappingURLInfo;
}

/** @internal */
export function getSourceMapInfo ( node: Node ): Promise<SourceMapInfo | null> {
    // 'undefined' never seen
    // 'null' seen but empty
    const mapInfo = node.mapInfo;
    if ( mapInfo === undefined ) {
        const info = getSourceMappingURLInfo( node.content );
        if ( info ) {
            return getSourceMapFromUrl( info.url, node.origin )
                .then( ( map ) => {
                    return { map, info };
                })
                .catch( ( err ) => {
                // throw new Error(`Error when reading map ${url}`);
                    return null;
                });
        }
        return Promise.resolve( null );
    }
    return Promise.resolve( mapInfo );
}

/** @internal */
export function getSourceMapInfoSync ( node: Node ): SourceMapInfo | null {
    // 'undefined' never seen
    // 'null' seen but empty
    const mapInfo = node.mapInfo;
    if ( mapInfo === undefined ) {
        const info = getSourceMappingURLInfo( node.content );
        if ( info ) {
            try {
                const map = getSourceMapFromUrlSync( info.url, node.origin );
                return { map, info };
            }
            catch ( err ) {
                // throw new Error(`Error when reading map ${url}`);
            }
        }
        return null;
    }
    return mapInfo;
}
