// this looks ridiculous, but it prevents sourcemap tooling from mistaking
// this for an actual sourceMappingURL
/** @internal */
export let SOURCEMAPPING_URL = 'sourceMa';
SOURCEMAPPING_URL += 'ppingURL';

/** @internal */
// Matches only the last occurrence of sourceMappingURL
const sourceMappingValueRegex = RegExp(`\\s*[#@]\\s*${SOURCEMAPPING_URL}\\s*=\\s*([^'"]*)\\s*`);
export const sourceMappingURLRegex = RegExp(
 "(?:" + "/\\*" + "(?:\\s*\r?\n(?://)?)?" + "(?:" + sourceMappingValueRegex.source + ")" + "\\s*" +
 "\\*/" + "|" + "//(?:" + sourceMappingValueRegex.source + ")" + ")" + "\\s*"
 );
