export function isMimeTypeJson(mimeType: string): boolean {
  return mimeType.toLowerCase().indexOf('json') > -1;
}

export function isMimeTypeGeoJson(mimeType: string): boolean {
  return /geo.?json/.test(mimeType);
}

export function isMimeTypeJsonFg(mimeType: string): boolean {
  return /json.?fg|fg.?json/.test(mimeType);
}

/**
 * Detects the `application/sml+json` media type (SensorML JSON encoding).
 *
 * Used by CSAPI endpoints that serve SensorML-encoded procedure descriptions.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html — OGC API - Connected Systems Part 1
 * @see https://tools.ietf.org/html/rfc6838 — Media Type Specifications
 */
export function isMimeTypeSmlJson(mimeType: string): boolean {
  return /sml\+json/i.test(mimeType);
}

/**
 * Detects the `application/swe+json` media type (SWE Common JSON encoding).
 *
 * Used by CSAPI endpoints that serve observation/command results in
 * SWE Common Data Model JSON encoding.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API - Connected Systems Part 2
 * @see https://tools.ietf.org/html/rfc6838 — Media Type Specifications
 */
export function isMimeTypeSweJson(mimeType: string): boolean {
  return /swe\+json/i.test(mimeType);
}

/**
 * Detects the `application/swe+text` media type (SWE Common Text encoding).
 *
 * Used by CSAPI endpoints that serve observation/command results in
 * SWE Common Data Model text-delimited encoding.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API - Connected Systems Part 2
 * @see https://tools.ietf.org/html/rfc6838 — Media Type Specifications
 */
export function isMimeTypeSweText(mimeType: string): boolean {
  return /swe\+text/i.test(mimeType);
}

/**
 * Detects the `application/swe+csv` media type (SWE Common CSV encoding).
 *
 * A constrained variant of SWE Text with `tokenSeparator=","` and
 * `blockSeparator="\n"`. Distinct from `application/swe+text`.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API - Connected Systems Part 2
 * @see https://tools.ietf.org/html/rfc6838 — Media Type Specifications
 */
export function isMimeTypeSweCsv(mimeType: string): boolean {
  return /swe\+csv/i.test(mimeType);
}

/**
 * Detects the `application/swe+binary` media type (SWE Common Binary encoding).
 *
 * Used by CSAPI endpoints that serve observation/command results in
 * SWE Common Data Model binary encoding.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API - Connected Systems Part 2
 * @see https://tools.ietf.org/html/rfc6838 — Media Type Specifications
 */
export function isMimeTypeSweBinary(mimeType: string): boolean {
  return /swe\+binary/i.test(mimeType);
}
