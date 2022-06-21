import type { Node } from '../Node';
import type { SourceMapProps } from '../SourceMap';

import { getSourceMapFromUrl, getSourceMapFromUrlSync } from './getMapFromUrl.js';
import { getSourceMappingURLInfo } from './sourceMappingURL';

/** @internal */
export interface SourceMapInfo {
    map: SourceMapProps,
    commentBlock: boolean
}

/** @internal */
export function getSourceMapInfo ( node: Node ): Promise<SourceMapInfo | null> {
    // 'undefined' never seen
    // 'null' seen but empty
    const mapData = node.mapInfo;
    if ( mapData === undefined ) {
        const sourceMappingURLInfo = getSourceMappingURLInfo( node.content );
        if ( sourceMappingURLInfo ) {
            return getSourceMapFromUrl( sourceMappingURLInfo.url, node.origin )
                .then( ( sourceMap ) => {
                    return { map: sourceMap, commentBlock: sourceMappingURLInfo.commentBlock };
                })
                .catch( ( err ) => {
                // throw new Error(`Error when reading map ${url}`);
                    return null;
                });
        }
        return Promise.resolve( null );
    }
    return Promise.resolve( mapData );
}

/** @internal */
export function getSourceMapInfoSync ( node: Node ): SourceMapInfo | null {
    // 'undefined' never seen
    // 'null' seen but empty
    const mapData = node.mapInfo;
    if ( mapData === undefined ) {
        const sourceMappingURLInfo = getSourceMappingURLInfo( node.content );
        if ( sourceMappingURLInfo ) {
            try {
                const sourceMap = getSourceMapFromUrlSync( sourceMappingURLInfo.url, node.origin );
                return { map: sourceMap, commentBlock: sourceMappingURLInfo.commentBlock };
            }
            catch ( err ) {
                // throw new Error(`Error when reading map ${url}`);
            }
        }
        return null;
    }
    return mapData;
}
