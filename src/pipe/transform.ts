import * as path from 'path';
import { Transform } from 'stream';

import * as fse from 'fs-extra';

import type { Options } from '../Options';
import { Node } from '../Node';
import { Context } from '../Context';

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
        Node.Load( context, transform_options.output, source )
            .then( (chain) => {
                if ( chain ) {
                    const { resolved, content, map, options } = chain.getContentAndMap( transform_options.output );
                    if ( map && options.sourceMappingURL !== 'inline' ) {
                        fse.ensureDirSync( path.dirname( resolved ) );
                        fse.writeFileSync( resolved + '.map', map.toString() );
                    }
                    done( undefined, content );
                }
                else {
                    done( undefined, source );
                }
            })
            .catch ((err) => {
                done(err);
            });
    };

    return liner;
}
