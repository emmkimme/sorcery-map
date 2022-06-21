import type { Node } from '../Node';
import type { SourceMapProps } from '../SourceMap';

import { getMapFromUrl, getMapFromUrlSync } from './getMapFromUrl.js';
import { getSourceMappingURLData } from './sourceMappingURL';

/** @internal */
export interface SourceMapData {
    sourceMap?: SourceMapProps,
    commentBlock?: boolean
}

/** @internal */
export function getMapData ( node: Node ): Promise<SourceMapData | null> {
    // 'undefined' never seen
    // 'null' seen but empty
    const mapData = node.mapData;
    if ( mapData === undefined ) {
        const sourceMappingURLData = getSourceMappingURLData( node.content );
        if ( sourceMappingURLData ) {
            return getMapFromUrl( sourceMappingURLData.sourceMappingURL, node.origin )
                .then( ( sourceMap ) => {
                    return { sourceMap, commentBlock: sourceMappingURLData.commentBlock };
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
export function getMapDataSync ( node: Node ): SourceMapData | null {
    // 'undefined' never seen
    // 'null' seen but empty
    const mapData = node.mapData;
    if ( mapData === undefined ) {
        const sourceMappingURLData = getSourceMappingURLData( node.content );
        if ( sourceMappingURLData ) {
            try {
                const sourceMap = getMapFromUrlSync( sourceMappingURLData.sourceMappingURL, node.origin );
                return { sourceMap, commentBlock: sourceMappingURLData.commentBlock };
            }
            catch ( err ) {
                // throw new Error(`Error when reading map ${url}`);
            }
        }
        return null;
    }
    return mapData;
}
