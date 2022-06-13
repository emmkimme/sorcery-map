import * as path from 'path';

import { ChainInternal } from './ChainInternal';
import type { Options } from './Options';
import { Node } from './Node';
import { Context } from './Context';
import type { Chain } from './Chain';

export function load ( file: string, load_options: Options ): Promise<Chain | null> {
    const context = new Context( path.resolve(), load_options );
    const node = Node.Create( context, file );
    return node.load()
        .then( () => node.isOriginalSource ? null : new ChainInternal( node ) );
}

export function loadSync ( file: string, load_options: Options ): Chain | null {
    const context = new Context( path.resolve(), load_options );
    const node = Node.Create( context, file );
    node.loadSync();
    return node.isOriginalSource ? null : new ChainInternal( node );
}

