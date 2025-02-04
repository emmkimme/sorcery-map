import type { LoaderContext } from 'webpack';

import { Context } from '../Context';
import type { SourceMapProps } from '../sourceMap/SourceMap';
import { ChainInternal } from '../ChainInternal';

export function loader ( input: string, inputMap: string ) {
    /* @ts-ignore: error TS2683: 'this' implicitly has type 'any' */
    // eslint-disable-next-line
    const webpack_loader_context: LoaderContext = this as LoaderContext;
    const loader_options = webpack_loader_context.getOptions();
    const callback = webpack_loader_context.async();

    const map: SourceMapProps = inputMap ? JSON.parse( inputMap ): undefined;

    const context = new Context( webpack_loader_context.context, loader_options );
    context.options.sourceMappingURLTemplate = 'none';
    ChainInternal.Load( context, undefined, input, map )
        .then( ( chain ) => {
            if ( chain ) {
                const { content, map } = chain._getContentAndMap( );
                if ( map ) {
                    input = content;
                    inputMap = map.toString();
                }
            }
        })
        .then( () => {
            callback( null, input, inputMap );
        })
        .catch( ( err ) => {
            callback( err );
        });
}

export const raw = false;
