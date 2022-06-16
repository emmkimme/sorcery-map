import { sourceMappingURLRegex } from './sourceMappingURL';

/** @internal */
export function getSourceMappingUrl ( str: string ): string | null {
    if ( !str ) {
        return null;
    }

    const candidatsRegExp = sourceMappingURLRegex.exec(str);
    if (!candidatsRegExp) {
        return null;
    }
    // Clean up ahead !!
    const candidats = candidatsRegExp.map(candidat => candidat && candidat.replace(/\r?\n|\r/g, '').trim()).filter(candidat => candidat && candidat.length);
    const url = candidats && candidats.length > 1 ? candidats[candidats.length - 1] : null;
    return url;
}
