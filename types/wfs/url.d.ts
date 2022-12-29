/**
 * Generates an URL for a GetFeature operation
 * @param {string} serviceUrl
 * @param {WfsVersion} version
 * @param {string} featureType
 * @param {MimeType} [outputFormat]
 * @param {number} [maxFeatures] if not defined, all features will be returned
 * @param {string[]} [attributes] if not defined, all attributes will be included
 * @param {boolean} [hitsOnly] if true, will not return feature data, only hit count
 *   note: this might not work for WFS version < 2
 * @param {CrsCode} [outputCrs] if unspecified, this will be the data native projection
 * @param {BoundingBox} [extent] an extent to restrict returned objects
 * @param {CrsCode} [extentCrs] if unspecified, `extent` should be in the data native projection
 * @return {string}
 */
export function generateGetFeatureUrl(serviceUrl: string, version: WfsVersion, featureType: string, outputFormat?: MimeType, maxFeatures?: number, attributes?: string[], hitsOnly?: boolean, outputCrs?: CrsCode, extent?: BoundingBox, extentCrs?: CrsCode): string;
/**
 * Generates an URL for a DescribeFeatureType operation
 * @param {string} serviceUrl
 * @param {WfsVersion} version
 * @param {string} featureType
 * @return {string}
 */
export function generateDescribeFeatureTypeUrl(serviceUrl: string, version: WfsVersion, featureType: string): string;
