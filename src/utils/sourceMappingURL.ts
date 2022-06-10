// this looks ridiculous, but it prevents sourcemap tooling from mistaking
// this for an actual sourceMappingURL
/** @internal */
export let SOURCEMAPPING_URL = 'sourceMa';
SOURCEMAPPING_URL += 'ppingURL';

/** @internal */
export const SOURCEMAP_COMMENT = new RegExp( '\n*(?:' +
    `\\/\\/[@#]\\s*${SOURCEMAPPING_URL}=([^\n]+)|` + // js
    `\\/\\*#?\\s*${SOURCEMAPPING_URL}=([^'"]+)\\s\\*\\/)` + // css
'\\s*$', 'g' );
