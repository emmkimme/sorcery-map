/** @internal */
export const sourceMappingURLProp = 'sourceMappingURL';

const sourceMappingValueRegex = /\s*[@,#]\s*sourceMappingURL\s*=\s*([\S ]*)\s*/;

const sourceMappingURLEx =
    '(?:\\/\\*' + sourceMappingValueRegex.source + '\\s*\\*\\/)' + 
    '|'+ 
    '(?:\\/\\/' + sourceMappingValueRegex.source + '\\s*)';

/** @internal */
export const sourceMappingURLRegex = new RegExp( sourceMappingURLEx );

/** @internal */
export interface SourceMappingURLInfo {
    url: string;
    comment?: string;
}

function findSourceMappingURLExecArray ( str: string ): RegExpExecArray | null {
    if ( !str ) {
        return null;
    }

    // Find the *last* sourceMappingURL skipping intermediate noises (comments, strings, ..)
    let currentMatch: RegExpExecArray;
    let lastMatch: RegExpExecArray;
    const sourceMappingURLRegex = new RegExp( sourceMappingURLEx , 'gm' );
    while ( currentMatch = sourceMappingURLRegex.exec( str ) ) {
        lastMatch = currentMatch;
    }
    return lastMatch;
}

/** @internal */
export function getSourceMappingURLInfo ( str: string ): SourceMappingURLInfo | null {
    const match = findSourceMappingURLExecArray( str );
    if ( !match ) {
        return null;
    }

    // [0] index the full sourceMappingURL comment
    // [1] index the sourceMappingURL value if it is a CSS content (could be null)
    // [2] index the sourceMappingURL value if it is a JS content (could be null)
   
    // Clean up ahead and retain the non-empty value CSS or JS
    const candidats = match.map( candidat => candidat && candidat.replace( /\r?\n|\r/g, '' ).trim() ).filter( candidat => candidat && candidat.length );
    const sourceMappingURL = candidats.length > 1 ? candidats[candidats.length - 1] : null;
    if ( !sourceMappingURL ) {
        return null;
    }

    return {
        url : decodeURI( sourceMappingURL ),
        comment: match[0]
    };
}

/** @internal */
export function replaceSourceMappingURLComment ( content: string, sourceMappingURLInfo?: SourceMappingURLInfo ) {
    sourceMappingURLInfo = sourceMappingURLInfo || { url: '' };
    const newComment = generateSourceMappingURLComment( sourceMappingURLInfo );
    if ( sourceMappingURLInfo.comment ) {
        return content.replace( sourceMappingURLInfo.comment, newComment );
    }
    const info = getSourceMappingURLInfo( content );
    if ( info ) {
        return content.replace( info.comment, newComment );
    }
    if ( newComment ) {
        return content + '\n' + newComment;
    }
    return content;
}


/** @internal */
export function generateSourceMappingURLComment ( sourceMappingURLInfo: SourceMappingURLInfo ) {
    if ( !sourceMappingURLInfo.url ) {
        return '';
    }
    const sourceMappingURL = encodeURI( sourceMappingURLInfo.url );
    if ( sourceMappingURLInfo.comment == null || ( sourceMappingURLInfo.comment[1] === '*' ) ) {
        return `/*# ${sourceMappingURLProp}=${sourceMappingURL} */`;
    }
    else {
        return `//# ${sourceMappingURLProp}=${sourceMappingURL}\n`;
    }
}
