import {
  findChildElement,
  findChildrenElement,
  getChildrenElement,
  getElementAttribute,
  getElementName,
  getElementText,
  getRootElement,
} from '../shared/xml-utils.js';
import { simplifyEpsgUrn } from '../shared/crs-utils.js';
import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import {
  BoundingBox,
  GenericEndpointInfo,
  MimeType,
} from '../shared/models.js';
import { WfsFeatureTypeInternal, WfsVersion } from './model.js';

/**
 * Will read a WFS version from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return The parsed WFS version, or null if no version could be found
 */
export function readVersionFromCapabilities(
  capabilitiesDoc: XmlDocument
): WfsVersion {
  return getRootElement(capabilitiesDoc).attributes['version'] as WfsVersion;
}

/**
 * Will read the supported output formats from the capabilities document; note that these might not be valid MIME types
 * @param capabilitiesDoc Capabilities document
 * @return Advertised output formats
 */
export function readOutputFormatsFromCapabilities(
  capabilitiesDoc: XmlDocument
): MimeType[] {
  const version = readVersionFromCapabilities(capabilitiesDoc);
  let outputFormats: string[];
  if (version.startsWith('1.0')) {
    const getFeature = findChildElement(
      findChildElement(
        findChildElement(getRootElement(capabilitiesDoc), 'Capability'),
        'Request'
      ),
      'GetFeature'
    );
    outputFormats = getChildrenElement(
      findChildElement(getFeature, 'ResultFormat')
    ).map(getElementName);
  } else {
    const operations = findChildElement(
      getRootElement(capabilitiesDoc),
      'OperationsMetadata'
    );
    const getFeature = findChildrenElement(operations, 'Operation').find(
      (el) => getElementAttribute(el, 'name') === 'GetFeature'
    );
    const parameter = findChildrenElement(getFeature, 'Parameter').find(
      (el) => getElementAttribute(el, 'name') === 'outputFormat'
    );
    outputFormats = findChildrenElement(parameter, 'Value', true).map(
      getElementText
    );
  }
  return outputFormats;
}

/**
 * Will read service-related info from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return Parsed service info
 */
export function readInfoFromCapabilities(
  capabilitiesDoc: XmlDocument
): GenericEndpointInfo {
  const version = readVersionFromCapabilities(capabilitiesDoc);
  const serviceTag = version.startsWith('1.0')
    ? 'Service'
    : 'ServiceIdentification';
  const nameTag = version.startsWith('1.0') ? 'Name' : 'ServiceType';
  const service = findChildElement(getRootElement(capabilitiesDoc), serviceTag);
  let keywords;
  if (version.startsWith('1.0')) {
    keywords = getElementText(findChildElement(service, 'Keywords'))
      .split(',')
      .map((keyword) => keyword.trim());
  } else {
    keywords = findChildrenElement(
      findChildElement(service, 'Keywords'),
      'Keyword'
    ).map(getElementText);
  }

  return {
    title: getElementText(findChildElement(service, 'Title')),
    name: getElementText(findChildElement(service, nameTag)),
    abstract: getElementText(findChildElement(service, 'Abstract')),
    fees: getElementText(findChildElement(service, 'Fees')),
    constraints: getElementText(findChildElement(service, 'AccessConstraints')),
    keywords,
    outputFormats: readOutputFormatsFromCapabilities(capabilitiesDoc),
  };
}

/**
 * Will read all feature types present in the capabilities doc
 */
export function readFeatureTypesFromCapabilities(
  capabilitiesDoc: XmlDocument
): WfsFeatureTypeInternal[] {
  const version = readVersionFromCapabilities(capabilitiesDoc);
  const outputFormats = readOutputFormatsFromCapabilities(capabilitiesDoc);
  const capability = findChildElement(
    getRootElement(capabilitiesDoc),
    'FeatureTypeList'
  );
  return findChildrenElement(capability, 'FeatureType').map((featureTypeEl) =>
    parseFeatureType(featureTypeEl, version, outputFormats)
  );
}

/**
 * Parse a feature type in a capabilities doc
 */
function parseFeatureType(
  featureTypeEl: XmlElement,
  serviceVersion: WfsVersion,
  defaultOutputFormats: MimeType[]
): WfsFeatureTypeInternal {
  const srsTag = serviceVersion.startsWith('2.') ? 'CRS' : 'SRS';
  const defaultSrsTag = serviceVersion.startsWith('1.0')
    ? 'SRS'
    : `Default${srsTag}`;
  function parseBBox100() {
    const bboxEl = findChildElement(featureTypeEl, 'LatLongBoundingBox');
    return ['minx', 'miny', 'maxx', 'maxy']
      .map((name) => getElementAttribute(bboxEl, name))
      .map(parseFloat) as BoundingBox;
  }
  function parseBBox() {
    const bboxEl = findChildElement(featureTypeEl, 'WGS84BoundingBox');
    return ['LowerCorner', 'UpperCorner']
      .map((elName) => findChildElement(bboxEl, elName))
      .map((cornerEl) => getElementText(cornerEl).split(' '))
      .reduce((prev, curr) => [...prev, ...curr])
      .map(parseFloat) as BoundingBox;
  }
  const otherCrs = serviceVersion.startsWith('1.0')
    ? []
    : findChildrenElement(featureTypeEl, `Other${srsTag}`)
        .map(getElementText)
        .map(simplifyEpsgUrn);
  const outputFormats: MimeType[] = serviceVersion.startsWith('1.0')
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
    outputFormats:
      outputFormats.length > 0 ? outputFormats : defaultOutputFormats,
    latLonBoundingBox: serviceVersion.startsWith('1.0')
      ? parseBBox100()
      : parseBBox(),
  };
}
