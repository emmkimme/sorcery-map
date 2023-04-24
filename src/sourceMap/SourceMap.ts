// https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.djovrt4kdvga
// https://sourcemaps.info/spec.html#h.lmz475t4mvbx

import btoa from '../utils/btoa';

export interface SourceMapProps {
    version: 3;

    file?: string;
    sources: string[];
    sourcesContent?: ( string | null )[]; 
    names: ( string | null  )[];
    mappings: string;
    sourceRoot?: string;
}

export class SourceMap implements SourceMapProps {
    version: 3;

    file?: string;
    sources: string[];
    sourcesContent?: ( string | null )[]; 
    names: ( string | null )[]; 
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
