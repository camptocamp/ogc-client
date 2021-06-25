import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement,
} from '../shared/xml-utils';
import { simplifyEpsgUrn } from '../shared/crs-utils';

/**
 * Will read a WFS version from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WfsVersion|null} The parsed WFS version, or null if no version could be found
 */
export function readVersionFromCapabilities(capabilitiesDoc) {
  return getRootElement(capabilitiesDoc).attributes['version'];
}

/**
 * Will read service-related info from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WfsInfo} Parsed service info
 */
export function readInfoFromCapabilities(capabilitiesDoc) {
  const version = readVersionFromCapabilities(capabilitiesDoc);
  const serviceTag = version.startsWith('1.0')
    ? 'Service'
    : 'ServiceIdentification';
  const nameTag = version.startsWith('1.0') ? 'Name' : 'ServiceType';
  const service = findChildElement(getRootElement(capabilitiesDoc), serviceTag);

  return {
    title: getElementText(findChildElement(service, 'Title')),
    name: getElementText(findChildElement(service, nameTag)),
    abstract: getElementText(findChildElement(service, 'Abstract')),
    fees: getElementText(findChildElement(service, 'Fees')),
    constraints: getElementText(findChildElement(service, 'AccessConstraints')),
  };
}

/**
 * Will read all feature types present in the capabilities doc
 * @param {XmlDocument} capabilitiesDoc
 * @return {WfsFeatureType[]}
 */
export function readFeatureTypesFromCapabilities(capabilitiesDoc) {
  const version = readVersionFromCapabilities(capabilitiesDoc);
  const capability = findChildElement(
    getRootElement(capabilitiesDoc),
    'FeatureTypeList'
  );
  return findChildrenElement(capability, 'FeatureType').map((featureTypeEl) =>
    parseFeatureType(featureTypeEl, version)
  );
}

/**
 * Parse a feature type in a capabilities doc
 * @param {XmlElement} featureTypeEl
 * @param {WfsVersion} serviceVersion
 * @return {WfsFeatureType}
 */
function parseFeatureType(featureTypeEl, serviceVersion) {
  const srsTag = serviceVersion.startsWith('2.') ? 'CRS' : 'SRS';
  const defaultSrsTag = serviceVersion.startsWith('1.0')
    ? 'SRS'
    : `Default${srsTag}`;
  function parseBBox100() {
    const bboxEl = findChildElement(featureTypeEl, 'LatLongBoundingBox');
    return ['minx', 'miny', 'maxx', 'maxy']
      .map((name) => getElementAttribute(bboxEl, name))
      .map(parseFloat);
  }
  function parseBBox() {
    const bboxEl = findChildElement(featureTypeEl, 'WGS84BoundingBox');
    return ['LowerCorner', 'UpperCorner']
      .map((elName) => findChildElement(bboxEl, elName))
      .map((cornerEl) => getElementText(cornerEl).split(' '))
      .reduce((prev, curr) => [...prev, ...curr])
      .map(parseFloat);
  }
  const otherCrs = serviceVersion.startsWith('1.0')
    ? []
    : findChildrenElement(featureTypeEl, `Other${srsTag}`)
        .map(getElementText)
        .map(simplifyEpsgUrn);
  const outputFormats = serviceVersion.startsWith('1.0')
    ? []
    : findChildrenElement(
        findChildElement(featureTypeEl, 'OutputFormats'),
        'Format'
      ).map(getElementText);

  return {
    name: getElementText(findChildElement(featureTypeEl, 'Name')),
    title: getElementText(findChildElement(featureTypeEl, 'Title')),
    abstract: getElementText(findChildElement(featureTypeEl, 'Abstract')),
    defaultCrs: simplifyEpsgUrn(
      getElementText(findChildElement(featureTypeEl, defaultSrsTag))
    ),
    otherCrs,
    outputFormats,
    latLonBoundingBox: serviceVersion.startsWith('1.0')
      ? parseBBox100()
      : parseBBox(),
  };
}
