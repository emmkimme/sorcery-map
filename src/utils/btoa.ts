/**
 * Encodes a string as base64
 * @param {string} str - the string to encode
 * @returns {string}
 */
/** @internal */
export default function btoa ( str: string ) {
    return Buffer.from( str ).toString( 'base64' );
}