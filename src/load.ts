import * as path from 'path';

import type { Options } from './Options';
import { Context } from './Context';
import type { Chain } from './Chain';
import { ChainInternal } from './ChainInternal';

export function load ( file: string, load_options: Options ): Promise<Chain | null> {
    const context = new Context( path.resolve(), load_options );
    return ChainInternal.Load( context, file );
}

export function loadSync ( file: string, load_options: Options ): Chain | null {
    const context = new Context( path.resolve(), load_options );
    return ChainInternal.LoadSync( context, file );
}

