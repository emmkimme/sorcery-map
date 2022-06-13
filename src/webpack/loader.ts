import { Node } from '../Node';
import { ChainInternal } from '../ChainInternal';
import { Context } from '../Context';
import type { SourceMapProps } from '../SourceMap';
import { SOURCEMAP_COMMENT } from '../utils/sourceMappingURL';

export function loader ( input: string, inputMap: string ) {
    /* @ts-ignore: error TS2683: 'this' implicitly has type 'any' */
    // eslint-disable-next-line
    const webpack_context: any = this;
    const loader_options = webpack_context.getOptions();
    const callback = webpack_context.async();

    const map: SourceMapProps = inputMap ? JSON.parse( inputMap ): undefined;

    const context = new Context( webpack_context.context, loader_options );
    const node = Node.Create( context, undefined, input, map );
    node.loadSync();
    if ( !node.isOriginalSource ) {
        const chain = new ChainInternal( node );
        const map = chain.apply( loader_options );
        if ( map )
            input = input.replace( SOURCEMAP_COMMENT, '' );
        inputMap = map.toString();
    }

    callback( null, input, inputMap );
}

export const raw = false;
