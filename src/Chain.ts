import type { Trace } from './Trace';
import type { SourceMap } from './SourceMap';
import type { Stats } from './Stats';
import type { Options } from './Options';

export interface Chain {
    stats (): Stats;

    apply ( apply_options: Options ): SourceMap | null;

        /**
     * Traces a segment back to its origin
     * @param {number} lineIndex - the zero-based line index of the
       segment as found in `this`
     * @param {number} columnIndex - the zero-based column index of the
       segment as found in `this`
     * @param {string || null} - if specified, the name that should be
       (eventually) returned, as it is closest to the generated code
     * @returns {object}
         @property {string} source - the filepath of the source
         @property {number} line - the one-based line index
         @property {number} column - the zero-based column index
         @property {string || null} name - the name corresponding
         to the segment being traced
     */
    trace ( oneBasedLineIndex: number, zeroBasedColumnIndex: number, trace_options: Options ): Trace;

    write ( dest: string, write_options: Options ): Promise<void>;
    writeSync ( dest: string, write_options: Options ): void;
}

