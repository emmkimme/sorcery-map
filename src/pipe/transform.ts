import * as path from 'path';
import { Transform, Writable } from 'stream';

import * as fse from 'fs-extra';

import { normalizeOuputOptions, Options } from '../Options';
import { Context } from '../Context';
import { ChainInternal } from '../ChainInternal';

export function transform ( dest?: string | Writable | Options, transform_raw_options?: Options ) {
    let source = '';

    const liner = new Transform();
    // the transform function
    liner._transform = ( chunk, encoding, done ) => {
        source += chunk.toString();
        done();
    };
    // to flush remaining data (if any)
    liner._flush = ( done ) => {
        const { options: transform_options } = normalizeOuputOptions(dest, transform_raw_options);
        const context = new Context( path.resolve(), transform_options );
        ChainInternal.Load( context, undefined, source )
            .then( ( chain ) => {
                if ( chain ) {
                    // inline file not found ! to manage
                    const { content, map_file, map_stream, map } = chain.getContentAndMap( dest );
                    if ( map_stream ) {
                        map_stream.end( map.toString(), 'utf-8' );
                    }
                    else if ( map_file ) {
                        // fse.ensureDirSync( path.dirname( resolved ) );
                        fse.writeFileSync( map_file, map.toString() );
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
