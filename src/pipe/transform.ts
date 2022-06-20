import * as path from 'path';
import { Transform } from 'stream';

import * as fse from 'fs-extra';

import type { Options } from '../Options';
import { Context } from '../Context';
import { ChainInternal } from '../ChainInternal';

export function transform ( transform_options: Options ) {
    let source = '';

    const liner = new Transform();
    // the transform function
    liner._transform = ( chunk, encoding, done ) => {
        source += chunk.toString();
        done();
    };
    // to flush remaining data (if any)
    liner._flush = ( done ) => {
        const context = new Context( path.resolve(), transform_options );
        ChainInternal.Load( context, undefined, source )
            .then( ( chain ) => {
                if ( chain ) {
                    // inline file not found ! to manage
                    const { resolved, content, map, options } = chain.getContentAndMap( transform_options.output );
                    if ( map && options.sourceMappingURLTemplate !== 'inline' ) {
                        // fse.ensureDirSync( path.dirname( resolved ) );
                        fse.writeFileSync( resolved + '.map', map.toString() );
                    }
                    done( undefined, content );
                }
                else {
                    done( undefined, source );
                }
            })
            .catch ( ( err ) => {
                done( err );
            });
    };

    return liner;
}
