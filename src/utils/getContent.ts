import * as fse from 'fs-extra';

import type { Node } from '../Node';

/** @internal */
export function getContent ( node: Node ): Promise<string | null> {
    // 'undefined' never seen
    // 'null' seen but empty
    const content = node.content;
    if ( content === undefined ) {
        return fse.readFile( node.file, { encoding: 'utf-8' }).catch( () => null );
    }
    return Promise.resolve( content );
}

/** @internal */
export function getContentSync ( node: Node ): string | null {
    // 'undefined' never seen
    // 'null' seen but empty
    const content = node.content;
    if ( content === undefined ) {
        try {
            return fse.readFileSync( node.file, { encoding: 'utf-8' });
        }
        catch ( e ) {
            return null;
        }
    }
    return content;
}
