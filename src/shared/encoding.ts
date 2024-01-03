import { parseXmlString, XmlParseError } from './xml-utils';

/**
 * A list of encodings that will be used in order when decoding a string
 * Note: a string might be successfully decoded with e.g. utf-8 but still
 * contain invalid chars; the correct encoding cannot be guessed and has to
 * be indicated with a header
 */
const ENCODINGS = ['utf-8', 'utf-16', 'iso-8859-1'];

const FALLBACK_ENCODING = 'utf-8';

function extractEncoding(contentType: string) {
  const matches = /charset=([^;]+)/.exec(contentType);
  return matches ? matches[1] : null;
}

/**
 * @param buffer Buffer containing the string to decode
 * @param [contentType] Optional content type header, used to determine the response type
 * @returns null if decoding failed
 */
export function decodeString(
  buffer: ArrayBuffer,
  contentType?: string
): string | null {
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
    `[ogc-client] XML document encoding could not be determined, falling back to ${FALLBACK_ENCODING}.`
  );
  return new TextDecoder(FALLBACK_ENCODING).decode(buffer);
}
