import { sourceMappingURLRegex } from './sourceMappingURL';

/** @internal */
export function getSourceMappingUrl ( str: string ): string | null {
    if ( !str ) return null;

    const candidatsRegExp = sourceMappingURLRegex.exec(str);
    const candidats = candidatsRegExp ? candidatsRegExp.filter(candidat => candidat).map(candidat => candidat.replace(/\r?\n|\r/g, '')).filter(candidat => candidat.length) : null;
    const url = candidats && candidats.length > 1 ? candidats[candidats.length - 1].trim() : null;
    return url;
}
