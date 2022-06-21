// this looks ridiculous, but it prevents sourcemap tooling from mistaking
// this for an actual sourceMappingURL
/** @internal */
export let SOURCEMAPPING_URL = 'sourceMa';
SOURCEMAPPING_URL += 'ppingURL';

// Matches only the last occurrence of sourceMappingURL

const sourceMappingValueRegex = /\s*[@,#]\s*sourceMappingURL\s*=\s*([\S ]*)\s*/;

/** @internal */
export const sourceMappingURLRegex = new RegExp(
    '(?:\\/\\*' + sourceMappingValueRegex.source + '\\s*\\*\\/)' + 
    '|'+ 
    '(?:\\/\\/' + sourceMappingValueRegex.source + '\\s*)'
);

/** @internal */
export interface SourceMappingURLData {
    sourceMappingURL?: string,
    commentBlock?: boolean
}

/** @internal */
export function getSourceMappingURLData ( str: string ): SourceMappingURLData {
    if ( !str ) {
        return null;
    }

    const candidatsRegExp = sourceMappingURLRegex.exec( str );
    if ( !candidatsRegExp ) {
        return null;
    }
    // First index contains the full sourceMappingURL comment
    // Second index contains the sourceMappingURL value if it is a CSS content (could be null)
    // third index contains the sourceMappingURL value if it is a JS content (could be null)
   
    // Clean up ahead and retain the latest non-empty value
    const candidats = candidatsRegExp.map( candidat => candidat && candidat.replace( /\r?\n|\r/g, '' ).trim() ).filter( candidat => candidat && candidat.length );
    const sourceMappingURL = candidats && candidats.length > 1 ? candidats[candidats.length - 1] : null;
    return sourceMappingURL ? { sourceMappingURL : decodeURI( sourceMappingURL ), commentBlock: candidatsRegExp[0][1] === '*' } : {};
}

/** @internal */
export function generateSourceMappingURLComment ( sourceMappingURLData: SourceMappingURLData ) {
    const sourceMappingURL = encodeURI( sourceMappingURLData.sourceMappingURL );
    if (sourceMappingURLData.commentBlock ) {
        return `/*# ${SOURCEMAPPING_URL}=${sourceMappingURL} */`;
    }
    else {
        return `//# ${SOURCEMAPPING_URL}=${sourceMappingURL}\n`;
    }
}
