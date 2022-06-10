import { SOURCEMAPPING_URL } from './sourceMappingURL';

/** @internal */
export function getSourceMappingUrl ( str: string ): string | null {
    if ( !str ) return null;

    // assume we want the last occurence
    const index = str.lastIndexOf( `${SOURCEMAPPING_URL}=` );

    if ( index === -1 ) {
        return null;
    }

    const substring = str.substring( index + 17 );
    const match = /^[^\r\n]+/.exec( substring );

    let url = match ? match[0] : null;

    // possibly a better way to do this, but we don't want to exclude whitespace
    // from the sourceMappingURL because it might not have been correctly encoded
    if ( url && url.slice( -2 ) === '*/' ) {
        url = url.slice( 0, -2 ).trim();
    }

    return url;
}
