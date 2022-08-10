import type { SourceMapInfo } from './SourceMapInfo';

/** @internal */
export const sourceMappingURLProp = 'sourceMappingURL';

const sourceMappingValueRegex = /\s*[@,#]\s*sourceMappingURL\s*=\s*([\S ]*)/;

const sourceMappingURLEx =
    '(?:\\/\\*' + sourceMappingValueRegex.source + '\\s*\\*\\/)' + 
    '|'+ 
    '(?:\\/\\/' + sourceMappingValueRegex.source + ')';

/** @internal */
export const sourceMappingURLRegex = new RegExp( sourceMappingURLEx );

function findSourceMappingURLExecArray ( str: string ): RegExpExecArray | null {
    if ( !str ) {
        return null;
    }

    // Find the ultimate sourceMappingURL skipping intermediate noises (comments, strings, ..)
    let currentMatch: RegExpExecArray;
    let lastMatch: RegExpExecArray;
    const sourceMappingURLRegex = new RegExp( sourceMappingURLEx , 'gm' );
    while ( currentMatch = sourceMappingURLRegex.exec( str ) ) {
        lastMatch = currentMatch;
    }
    return lastMatch;
}

/** @internal */
export function getSourceMappingURLInfo ( str: string, sourceMapInfo?: SourceMapInfo ): SourceMapInfo | null {
    const match = findSourceMappingURLExecArray( str );
    if ( !match ) {
        return null;
    }
    // [0] the full sourceMappingURL comment
    // [1] the sourceMappingURL value if it is a CSS content (could be null)
    // [2] the sourceMappingURL value if it is a JS content (could be null)
   
    // Clean up ahead and retain the non-empty value CSS or JS
    const info = match.filter( info => info );
    if ( info.length !== 2 ) {
        return null;
    }
    // [0] the full sourceMappingURL comment
    // [1] the sourceMappingURL value

    // Clean up again
    info[1] = info[1].trim();

    sourceMapInfo = sourceMapInfo || {};
    sourceMapInfo.url = decodeURI( info[1]);
    sourceMapInfo.comment = info[0];
    return sourceMapInfo;
}

/** @internal */
export function replaceSourceMappingURLComment ( content: string, sourceMapInfo?: SourceMapInfo ) {
    sourceMapInfo = sourceMapInfo || { url: '' };
    const newComment = generateSourceMappingURLComment( sourceMapInfo );
    if ( sourceMapInfo.comment ) {
        return content.replace( sourceMapInfo.comment, newComment );
    }
    const info = getSourceMappingURLInfo( content );
    if ( info ) {
        return content.replace( info.comment, newComment );
    }
    if ( newComment ) {
        return content + '\n' + newComment + '\n';
    }
    return content;
}

/** @internal */
export function generateSourceMappingURLComment ( sourceMapInfo: SourceMapInfo ) {
    if ( !sourceMapInfo.url ) {
        return '';
    }
    const sourceMappingURL = encodeURI( sourceMapInfo.url );
    if ( sourceMapInfo.comment == null || ( sourceMapInfo.comment[1] === '*' ) ) {
        return `/*# ${sourceMappingURLProp}=${sourceMappingURL} */`;
    }
    else {
        return `//# ${sourceMappingURLProp}=${sourceMappingURL}`;
    }
}
