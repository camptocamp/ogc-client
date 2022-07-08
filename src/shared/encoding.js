import { parseXmlString, XmlParseError } from './xml-utils';

/**
 * A list of encodings that will be used in order when decoding a string
 * Note: a string might be successfully decoded with e.g. utf-8 but still
 * contain invalid chars; the correct encoding cannot be guessed and has to
 * be indicated with a header
 * @type {string[]}
 */
const ENCODINGS = ['utf-8', 'utf-16', 'iso-8859-1'];

const FALLBACK_ENCODING = 'utf-8';

/**
 * @param {string} contentType
 * @return {string} encoding label or null if not found
 */
function extractEncoding(contentType) {
  const matches = /charset=([^;]+)/.exec(contentType);
  return matches ? matches[1] : null;
}

/**
 *
 * @param {ArrayBuffer} buffer Buffer containing the string to decode
 * @param {string} [contentType] Optional content type header, used to determine the response type
 * @returns {string|null} null if decoding failed
 */
export function decodeString(buffer, contentType) {
  const encodingHint = contentType ? extractEncoding(contentType) : null;
  const encodingAttempts = encodingHint
    ? [encodingHint, ...ENCODINGS]
    : ENCODINGS;
  for (const encoding of encodingAttempts) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: true });
      return decoder.decode(buffer);
    } catch (e) {
      // an error means either decoding failed or the provided encoding was not recognized; skip to the next one
    }
  }
  // if all else fails, decode using fallback and hope for the best
  console.warn(
    `XML document encoding could not be determined, falling back to ${FALLBACK_ENCODING}.`
  );
  return new TextDecoder(FALLBACK_ENCODING).decode(buffer);
}
