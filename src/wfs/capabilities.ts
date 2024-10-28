import { readProviderFromCapabilities } from '../shared/ows.js';
import {
  findChildElement,
  findChildrenElement,
  getChildrenElement,
  getElementAttribute,
  getElementName,
  getElementText,
  getRootElement,
  stripNamespace,
} from '../shared/xml-utils.js';
import { simplifyEpsgUrn } from '../shared/crs-utils.js';
import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import {
  BoundingBox,
  GenericEndpointInfo,
  MimeType,
  type OperationName,
  type OperationUrl,
} from '../shared/models.js';
import { WfsFeatureTypeInternal, WfsVersion } from './model.js';

/**
 * Will read the operation URLS from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 */
export function readOperationUrlsFromCapabilities(
  capabilitiesDoc: XmlDocument
): Record<OperationName, OperationUrl> {
  const urls: Record<OperationName, OperationUrl> = {};
  const capabilities = getRootElement(capabilitiesDoc);
  const operationsMetadata = findChildElement(
    capabilities,
    'OperationsMetadata'
  );
  if (operationsMetadata) {
    // WFS 1.1.0 or 2.0.0
    findChildrenElement(operationsMetadata, 'Operation').forEach(
      (operation) => {
        const name = getElementAttribute(operation, 'name');
        urls[name] = parseOperation110(operation);
      }
    );
  } else {
    // WFS 1.0.0
    const capability = findChildElement(capabilities, 'Capability');
    const request = findChildElement(capability, 'Request');
    getChildrenElement(request).forEach((operation) => {
      const name = stripNamespace(getElementName(operation));
      urls[name] = parseOperation100(operation);
    });
  }
  return urls;
}

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
  let provider;
  // no provider information defined in capabilities for WFS 1.0.0
  if (version !== '1.0.0') {
    provider = readProviderFromCapabilities(capabilitiesDoc);
  }

  return {
    title: getElementText(findChildElement(service, 'Title')),
    name: getElementText(findChildElement(service, nameTag)),
    abstract: getElementText(findChildElement(service, 'Abstract')),
    fees: getElementText(findChildElement(service, 'Fees')),
    constraints: getElementText(findChildElement(service, 'AccessConstraints')),
    keywords,
    provider,
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
 * Parse an operation definition from a WFS 1.0.0 capabilities (e.g. GetFeature)
 * @param operation Operation element
 */
function parseOperation100(operation: XmlElement): OperationUrl {
  const urls: OperationUrl = {};
  const dcpType = findChildrenElement(operation, 'DCPType');
  const http = dcpType.flatMap((d) => findChildrenElement(d, 'HTTP'));
  const methods = http.flatMap((h) => getChildrenElement(h));
  methods.forEach((method) => {
    const methodName = stripNamespace(getElementName(method));
    urls[methodName] = getElementAttribute(method, 'onlineResource');
  });
  return urls;
}

/**
 * Parse an operation definition from a WFS 1.1+ capabilities (e.g. GetFeature)
 * @param operation Operation element
 */
function parseOperation110(operation: XmlElement): OperationUrl {
  const urls: OperationUrl = {};
  const dcpType = findChildrenElement(operation, 'DCP');
  const http = dcpType.flatMap((d) => findChildElement(d, 'HTTP'));
  const methods = http.flatMap((h) => getChildrenElement(h));
  methods.forEach((method) => {
    const methodName = stripNamespace(getElementName(method));
    urls[methodName] = getElementAttribute(method, 'xlink:href');
  });
  return urls;
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

  const keywords = serviceVersion.startsWith('1.0')
    ? getElementText(findChildElement(featureTypeEl, 'Keywords'))
        .split(',')
        .map((keyword) => keyword.trim())
    : findChildrenElement(
        findChildElement(featureTypeEl, 'Keywords'),
        'Keyword'
      )
        .map(getElementText)
        .filter((v, i, arr) => arr.indexOf(v) === i);

  const metadata =
    serviceVersion === '2.0.0'
      ? findChildrenElement(featureTypeEl, 'MetadataURL').map(
          (metadataUrlEl) => ({
            url: getElementAttribute(metadataUrlEl, 'xlink:href'),
          })
        )
      : findChildrenElement(featureTypeEl, 'MetadataURL').map(
          (metadataUrlEl) => ({
            format: getElementAttribute(metadataUrlEl, 'format'),
            type: getElementAttribute(metadataUrlEl, 'type'),
            url: getElementText(metadataUrlEl).trim(),
          })
        );

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
    keywords: keywords,
    ...(metadata.length && { metadata }),
  };
}
