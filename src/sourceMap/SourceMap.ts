import btoa from '../utils/btoa';

export interface SourceMapProps {
    version: 3;

    file: string;
    sources: string[];
    sourcesContent: string[]; 
    names: string[];
    mappings: string;
    sourceRoot?: string;
}

export class SourceMap implements SourceMapProps {
    version: 3;

    file: string;
    sources: string[];
    sourcesContent: string[]; 
    names: string[];
    mappings: string;
    sourceRoot: string;
    
    constructor ( sourceMapProps: SourceMapProps ) {
        Object.assign( this, sourceMapProps );
    }

    toString () {
        return JSON.stringify( this );
    }

    toUrl () {
        return 'data:application/json;charset=utf-8;base64,' + btoa( this.toString() );
    }
}
