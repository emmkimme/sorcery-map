import * as path from 'path';
import { Transform } from 'stream';

import { writeStream } from './ChainInternal';
import type { Options } from './Options';
import { Node } from './Node';
import { Context } from './Context';

export function transform ( transform_options: Options ) {
    let source = '';

    const liner = new Transform();
    // the transform function
    liner._transform = function ( chunk, encoding, done ) {
        source += chunk.toString();
        done();
    };
    // to flush remaining data (if any)
    liner._flush = function ( done ) {
        const context = new Context( path.resolve(), transform_options );
        const node = Node.Create( context, transform_options.output, source );
        node.loadSync( );
        if ( !node.isOriginalSource ) {
            const content = writeStream( node );
            this.push( content );
        }
        else {
            this.push( source );
        }
        done();
    };

    return liner;
}
