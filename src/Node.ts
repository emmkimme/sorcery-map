import type { SourceMap } from './SourceMap';
import type { Chain } from './Chain';

export interface NodeCacheByFile {
    [file: string]: Node;
}

export interface Trace {
    /**
    @property {string} source - the filepath of the source
    @property {number} line - the one-based line index
    @property {number} column - the zero-based column index
    @property {string || null} name - the name corresponding
     */
    source: string;
    line: number;
    column: number;
    name: string | null;
}

export interface Node {
    readonly isOriginalSource: boolean;
    readonly content: string;
    readonly map: SourceMap;
	readonly file: string; 

    isFinalSourceContent ( options: any ): boolean;

    load ( nodeCacheByFile: NodeCacheByFile, options: any ): Promise<Chain | null>;
    loadSync ( nodeCacheByFile: NodeCacheByFile, options: any ): Chain | null;

    trace ( lineIndex: number, columnIndex: number, name?: string, options?: any ): Trace;
}