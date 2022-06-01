import { getMapFromUrl, getMapFromUrlSync } from './getMapFromUrl.js';
import { getSourceMappingUrl } from './getSourceMappingUrl';

import type { Node } from '../Node';

export function getMap ( node: Node ) {
    // 'undefined' never seen
    // 'null' seen but empty
    const map = node.map;
    if ( map === undefined ) {
        const url = getSourceMappingUrl( node.content );
        if ( url ) {
            return getMapFromUrl( url, node.file );
        }
        return Promise.resolve(null);
    }
    return Promise.resolve(map);
}

export function getMapSync ( node: Node ) {
    // 'undefined' never seen
    // 'null' seen but empty
    const map = node.map;
    if ( map === undefined ) {
        const url = getSourceMappingUrl( node.content );
        if ( url ) {
            return getMapFromUrlSync( url, node.file );
        }
        return null;
    }
    return map;
}
