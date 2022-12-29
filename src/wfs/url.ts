import { setQueryParams } from '../shared/http-utils';

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
export function generateGetFeatureUrl(
  serviceUrl,
  version,
  featureType,
  outputFormat,
  maxFeatures,
  attributes,
  hitsOnly,
  outputCrs,
  extent,
  extentCrs
) {
  const typeParam = version === '2.0.0' ? 'TYPENAMES' : 'TYPENAME';
  const countParam = version === '2.0.0' ? 'COUNT' : 'MAXFEATURES';

  const newParams = {
    SERVICE: 'WFS',
    REQUEST: 'GetFeature',
    VERSION: version,
    [typeParam]: featureType,
  };
  if (outputFormat !== undefined) newParams.OUTPUTFORMAT = outputFormat;
  if (attributes !== undefined) newParams.PROPERTYNAME = attributes.join(',');
  if (hitsOnly) {
    newParams.RESULTTYPE = 'hits';
    newParams[countParam] = '1'; // in case the RESULTTYPE param is not supported
  } else if (maxFeatures !== undefined)
    newParams[countParam] = maxFeatures.toString(10);
  if (outputCrs) {
    newParams.SRSNAME = outputCrs;
  }
  if (extent) {
    const extentJoined = extent.join(',');
    newParams.BBOX = extentCrs ? `${extentJoined},${extentCrs}` : extentJoined;
  }

  return setQueryParams(serviceUrl, newParams);
}

/**
 * Generates an URL for a DescribeFeatureType operation
 * @param {string} serviceUrl
 * @param {WfsVersion} version
 * @param {string} featureType
 * @return {string}
 */
export function generateDescribeFeatureTypeUrl(
  serviceUrl,
  version,
  featureType
) {
  const typeParam = version === '2.0.0' ? 'TYPENAMES' : 'TYPENAME';
  return setQueryParams(serviceUrl, {
    SERVICE: 'WFS',
    REQUEST: 'DescribeFeatureType',
    VERSION: version,
    [typeParam]: featureType,
  });
}
