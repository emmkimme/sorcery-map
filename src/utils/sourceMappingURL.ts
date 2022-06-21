// this looks ridiculous, but it prevents sourcemap tooling from mistaking
// this for an actual sourceMappingURL
/** @internal */
export let SOURCEMAPPING_URL = 'sourceMa';
SOURCEMAPPING_URL += 'ppingURL';

const sourceMappingValueRegex = /\s*[@,#]\s*sourceMappingURL\s*=\s*([\S ]*)\s*/;

/** @internal */
export const sourceMappingURLRegex = new RegExp(
    '(?:\\/\\*' + sourceMappingValueRegex.source + '\\s*\\*\\/)' + 
    '|'+ 
    '(?:\\/\\/' + sourceMappingValueRegex.source + '\\s*)'
);

/** @internal */
export interface SourceMappingURLInfo {
    url: string,
    commentBlock: boolean
}

/** @internal */
export function getSourceMappingURLInfo ( str: string ): SourceMappingURLInfo | null {
    if ( !str ) {
        return null;
    }

    const candidatsRegExp = sourceMappingURLRegex.exec( str );
    if ( !candidatsRegExp ) {
        return null;
    }

    // First index contains the full sourceMappingURL comment
    // Second index contains the sourceMappingURL value if it is a CSS content, commentBlock is true (could be null)
    // third index contains the sourceMappingURL value if it is a JS content, commentBlock is false (could be null)
   
    // Clean up ahead and retain the latest non-empty value
    const candidats = candidatsRegExp.map( candidat => candidat && candidat.replace( /\r?\n|\r/g, '' ).trim() ).filter( candidat => candidat && candidat.length );
    const sourceMappingURL = candidats.length > 1 ? candidats[candidats.length - 1] : null;
    if ( !sourceMappingURL ) {
        return null;
    }

    return {
        url : decodeURI( sourceMappingURL ),
        commentBlock: candidatsRegExp[0][1] === '*'
    };
}

/** @internal */
export function generateSourceMappingURLComment ( sourceMappingURLInfo: SourceMappingURLInfo ) {
    const sourceMappingURL = encodeURI( sourceMappingURLInfo.url );
    if ( sourceMappingURLInfo.commentBlock ) {
        return `/*# ${SOURCEMAPPING_URL}=${sourceMappingURL} */`;
    }
    else {
        return `//# ${SOURCEMAPPING_URL}=${sourceMappingURL}\n`;
    }
}
