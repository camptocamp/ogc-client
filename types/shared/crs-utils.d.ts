/**
 * Inverted coordinates is meant from the POV of a programmer, i.e. Y before X
 * Note: can handle full URNs for EPSG codes
 * @param {string} crsName
 * @return {boolean}
 */
export function hasInvertedCoordinates(crsName: string): boolean;
/**
 * When given a full URN pointing to an EPSG code, will return the simplified
 * name, e.g.: `urn:ogc:def:crs:EPSG::2154` translates to `EPSG:2154`
 * On other kind of URNs (i.e. `urn:ogc:def:crs:OGC:1.3:CRS84`), returns the
 * URN untouched
 * @param {CrsCode} fullCrsName
 * @return {CrsCode}
 */
export function simplifyEpsgUrn(fullCrsName: CrsCode): CrsCode;
