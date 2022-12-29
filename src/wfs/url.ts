import { setQueryParams } from '../shared/http-utils';
import { WfsVersion } from './endpoint';
import { BoundingBox, CrsCode, MimeType } from '../shared/models';

/**
 * Generates an URL for a GetFeature operation
 * @param serviceUrl
 * @param version
 * @param featureType
 * @param [outputFormat]
 * @param [maxFeatures] if not defined, all features will be returned
 * @param [attributes] if not defined, all attributes will be included
 * @param [hitsOnly] if true, will not return feature data, only hit count
 *   note: this might not work for WFS version < 2
 * @param [outputCrs] if unspecified, this will be the data native projection
 * @param [extent] an extent to restrict returned objects
 * @param [extentCrs] if unspecified, `extent` should be in the data native projection
 */
export function generateGetFeatureUrl(
  serviceUrl: string,
  version: WfsVersion,
  featureType: string,
  outputFormat?: MimeType,
  maxFeatures?: number,
  attributes?: string[],
  hitsOnly?: boolean,
  outputCrs?: CrsCode,
  extent?: BoundingBox,
  extentCrs?: CrsCode
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
 */
export function generateDescribeFeatureTypeUrl(
  serviceUrl: string,
  version: WfsVersion,
  featureType: string
) {
  const typeParam = version === '2.0.0' ? 'TYPENAMES' : 'TYPENAME';
  return setQueryParams(serviceUrl, {
    SERVICE: 'WFS',
    REQUEST: 'DescribeFeatureType',
    VERSION: version,
    [typeParam]: featureType,
  });
}
