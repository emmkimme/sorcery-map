import * as path from 'path';

// this looks ridiculous, but it prevents sourcemap tooling from mistaking
// this for an actual sourceMappingURL
/** @internal */
export let SOURCEMAPPING_URL = 'sourceMa';
SOURCEMAPPING_URL += 'ppingURL';

/** @internal */
// Matches only the last occurrence of sourceMappingURL
const sourceMappingValueRegex = RegExp( `\\s*[#@]\\s*${SOURCEMAPPING_URL}\\s*=\\s*([^'"]*)\\s*` );
export const sourceMappingURLRegex = RegExp(
    '(?:' + '/\\*' + '(?:\\s*\r?\n(?://)?)?' + '(?:' + sourceMappingValueRegex.source + ')' + '\\s*' +
 '\\*/' + '|' + '//(?:' + sourceMappingValueRegex.source + ')' + ')' + '\\s*'
);

/** @internal */
export function getSourceMappingUrl ( str: string ): string | null {
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
    const url = candidats && candidats.length > 1 ? candidats[candidats.length - 1] : null;
    return url;
}

/** @internal */
export function generateSourceMappingURLComment ( url: string, dest: string ) {
    const ext = path.extname( dest );
    url = encodeURI( url );

    if ( ext === '.css' ) {
        return `/*# ${SOURCEMAPPING_URL}=${url} */\n`;
    }

    return `//# ${SOURCEMAPPING_URL}=${url}\n`;
}
