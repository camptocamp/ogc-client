/**
 *
 * @param {ArrayBuffer} buffer Buffer containing the string to decode
 * @param {string} [contentType] Optional content type header, used to determine the response type
 * @returns {string|null} null if decoding failed
 */
export function decodeString(buffer: ArrayBuffer, contentType?: string): string | null;
