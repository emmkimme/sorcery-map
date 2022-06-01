import type { Trace } from './Node';
import type { SourceMap } from './SourceMap';

export interface Stat {
    selfDecodingTime: number;
    totalDecodingTime: number;

    encodingTime: number;
    tracingTime: number;

    untraceable: number;
}

export interface Chain {
    stat (): Stat;

    apply ( apply_options: any ): SourceMap | null;

    trace ( oneBasedLineIndex: number, zeroBasedColumnIndex: number, trace_options: any ): Trace;

    write ( dest: string, write_options: any ): Promise<void>;
    writeSync ( dest: string, write_options: any ): void;
};

