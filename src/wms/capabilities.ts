import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import { hasInvertedCoordinates } from '../shared/crs-utils.js';
import {
  BoundingBox,
  CrsCode,
  GenericEndpointInfo,
  LayerStyle,
  type Provider,
  type OperationName,
  type OperationUrl,
} from '../shared/models.js';
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
import { WmsLayerAttribution, WmsLayerFull, WmsVersion } from './model.js';

/**
 * Will read all operation URLs from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return The parsed operations URLs
 */
export function readOperationUrlsFromCapabilities(
  capabilitiesDoc: XmlDocument
) {
  const urls: Record<OperationName, OperationUrl> = {};
  const capability = findChildElement(
    getRootElement(capabilitiesDoc),
    'Capability'
  );
  const request = findChildElement(capability, 'Request');
  getChildrenElement(request).forEach((operation) => {
    const operationName = stripNamespace(getElementName(operation));
    urls[operationName] = parseOperation(operation);
  });
  return urls;
}

/**
 * Will read a WMS version from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return The parsed WMS version, or null if no version could be found
 */
export function readVersionFromCapabilities(capabilitiesDoc: XmlDocument) {
  return getRootElement(capabilitiesDoc).attributes['version'] as WmsVersion;
}

/**
 * Will read all layers present in the capabilities doc and return them in a tree structure
 * @param capabilitiesDoc Capabilities document
 * @return Parsed layers
 */
export function readLayersFromCapabilities(capabilitiesDoc: XmlDocument) {
  const version = readVersionFromCapabilities(capabilitiesDoc);
  const capability = findChildElement(
    getRootElement(capabilitiesDoc),
    'Capability'
  );
  return findChildrenElement(capability, 'Layer').map((layerEl) =>
    parseLayer(layerEl, version)
  );
}

export function readOutputFormatsFromCapabilities(
  capabilitiesDoc: XmlDocument
) {
  const capability = findChildElement(
    getRootElement(capabilitiesDoc),
    'Capability'
  );
  const getMap = findChildElement(
    findChildElement(capability, 'Request'),
    'GetMap'
  );
  const outputFormats = findChildrenElement(getMap, 'Format').map(
    getElementText
  );
  return outputFormats;
}

export function readInfoFormatsFromCapabilities(capabilitiesDoc: XmlDocument) {
  const capability = findChildElement(
    getRootElement(capabilitiesDoc),
    'Capability'
  );
  const getFeatureInfo = findChildElement(
    findChildElement(capability, 'Request'),
    'GetFeatureInfo'
  );
  const outputFormats = findChildrenElement(getFeatureInfo, 'Format').map(
    getElementText
  );
  return outputFormats;
}

/**
 * Will return all available exception formats
 * @param capabilitiesDoc Capabiliites document
 * @return Available exception formats
 */
export function readExceptionFormatsFromCapabilities(
  capabilitiesDoc: XmlDocument
) {
  const capability = findChildElement(
    getRootElement(capabilitiesDoc),
    'Capability'
  );
  const exception = findChildElement(capability, 'Exception');
  const exceptionFormats = findChildrenElement(exception, 'Format').map(
    getElementText
  );
  return exceptionFormats;
}

/**
 * Will read service-related info from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return Parsed service info
 */
export function readInfoFromCapabilities(
  capabilitiesDoc: XmlDocument
): GenericEndpointInfo {
  const service = findChildElement(getRootElement(capabilitiesDoc), 'Service');
  const outputFormats = readOutputFormatsFromCapabilities(capabilitiesDoc);
  const infoFormats = readInfoFormatsFromCapabilities(capabilitiesDoc);
  const exceptionFormats =
    readExceptionFormatsFromCapabilities(capabilitiesDoc);
  const keywords = findChildrenElement(
    findChildElement(service, 'KeywordList'),
    'Keyword'
  )
    .map(getElementText)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const provider = readProviderFromCapabilities(capabilitiesDoc);

  return {
    title: getElementText(findChildElement(service, 'Title')),
    name: getElementText(findChildElement(service, 'Name')),
    abstract: getElementText(findChildElement(service, 'Abstract')),
    outputFormats: outputFormats,
    infoFormats: infoFormats,
    exceptionFormats: exceptionFormats,
    fees: getElementText(findChildElement(service, 'Fees')),
    constraints: getElementText(findChildElement(service, 'AccessConstraints')),
    provider,
    keywords,
  };
}

/**
 * Parse an operation definition from a WMS capabilities (e.g. GetMap)
 * @param operation Operation element
 */
function parseOperation(operation: XmlElement): OperationUrl {
  const urls: OperationUrl = {};
  const dcpType = findChildrenElement(operation, 'DCPType');
  const http = dcpType.flatMap((d) => findChildElement(d, 'HTTP'));
  const methods = http.flatMap((h) => getChildrenElement(h));
  methods.forEach((method) => {
    const onlineResource = findChildElement(method, 'OnlineResource');
    const methodName = stripNamespace(getElementName(method));
    urls[methodName] = getElementAttribute(onlineResource, 'xlink:href');
  });
  return urls;
}

/**
 * Parse a layer in a capabilities doc
 */
function parseLayer(
  layerEl: XmlElement,
  version: WmsVersion,
  inheritedSrs: CrsCode[] = [],
  inheritedStyles: LayerStyle[] = [],
  inheritedAttribution: WmsLayerAttribution = null,
  inheritedBoundingBoxes: Record<CrsCode, BoundingBox> = null,
  inheritedMaxScaleDenom: number = null,
  inheritedMinScaleDenom: number = null
): WmsLayerFull {
  const srsTag = version === '1.3.0' ? 'CRS' : 'SRS';
  const srsList = findChildrenElement(layerEl, srsTag).map(getElementText);
  const availableCrs = srsList.length > 0 ? srsList : inheritedSrs;
  const layerStyles = findChildrenElement(layerEl, 'Style').map(
    parseLayerStyle
  );
  const styles = layerStyles.length > 0 ? layerStyles : inheritedStyles;
  function parseBBox(bboxEl) {
    const srs = getElementAttribute(bboxEl, srsTag);
    const attrs =
      hasInvertedCoordinates(srs) && version === '1.3.0'
        ? ['miny', 'minx', 'maxy', 'maxx']
        : ['minx', 'miny', 'maxx', 'maxy'];
    return attrs.map((name) => parseFloat(getElementAttribute(bboxEl, name)));
  }
  function parseExGeographicBoundingBox(bboxEl) {
    return [
      'westBoundLongitude',
      'southBoundLatitude',
      'eastBoundLongitude',
      'northBoundLatitude',
    ].map((name) => parseFloat(getElementText(findChildElement(bboxEl, name))));
  }
  function parseLatLonBoundingBox(bboxEl) {
    return ['minx', 'miny', 'maxx', 'maxy'].map((name) =>
      parseFloat(getElementAttribute(bboxEl, name))
    );
  }
  function parseScaleHintValue(textValue, defaultValue) {
    if (textValue === '') {
      return defaultValue;
    }
    // convert resolution to scale denominator using the common pixel size of
    // 0.28×0.28 mm as defined in WMS 1.3.0 specification section 7.2.4.6.9
    return Math.sqrt(0.5 * parseFloat(textValue) ** 2) / 0.00028;
  }
  function parseScaleHint() {
    const scaleHint = findChildElement(layerEl, 'ScaleHint');
    if (!scaleHint) {
      return [inheritedMinScaleDenom, inheritedMaxScaleDenom];
    }
    const min = getElementAttribute(scaleHint, 'min');
    const max = getElementAttribute(scaleHint, 'max');
    return [
      parseScaleHintValue(min, inheritedMinScaleDenom),
      parseScaleHintValue(max, inheritedMaxScaleDenom),
    ];
  }
  function parseScaleDenominator(name, inheritedValue) {
    const textValue = getElementText(findChildElement(layerEl, name));
    return textValue === '' ? inheritedValue : parseFloat(textValue);
  }
  const attributionEl = findChildElement(layerEl, 'Attribution');
  const attribution =
    attributionEl !== null
      ? parseLayerAttribution(attributionEl)
      : inheritedAttribution;
  const latLonBboxEl =
    version === '1.3.0'
      ? findChildElement(layerEl, 'EX_GeographicBoundingBox')
      : findChildElement(layerEl, 'LatLonBoundingBox');
  const baseBoundingBox = {};
  if (latLonBboxEl) {
    baseBoundingBox['EPSG:4326'] =
      version === '1.3.0'
        ? parseExGeographicBoundingBox(latLonBboxEl)
        : parseLatLonBoundingBox(latLonBboxEl);
  }
  let boundingBoxes = findChildrenElement(layerEl, 'BoundingBox').reduce(
    (prev, bboxEl) => ({
      ...prev,
      [getElementAttribute(bboxEl, srsTag)]: parseBBox(bboxEl),
    }),
    baseBoundingBox
  );
  boundingBoxes =
    Object.keys(boundingBoxes).length > 0 || inheritedBoundingBoxes === null
      ? boundingBoxes
      : inheritedBoundingBoxes;

  const queryable =
    layerEl.attributes.queryable === '1' ||
    layerEl.attributes.queryable === 'true'
      ? true
      : false;

  const opaque =
    layerEl.attributes.opaque === '1' || layerEl.attributes.opaque === 'true'
      ? true
      : false;
  const keywords = findChildrenElement(
    findChildElement(layerEl, 'KeywordList'),
    'Keyword'
  )
    .map(getElementText)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  let minScaleDenominator, maxScaleDenominator;
  if (version === '1.3.0') {
    minScaleDenominator = parseScaleDenominator(
      'MinScaleDenominator',
      inheritedMinScaleDenom
    );
    maxScaleDenominator = parseScaleDenominator(
      'MaxScaleDenominator',
      inheritedMaxScaleDenom
    );
  } else {
    [minScaleDenominator, maxScaleDenominator] = parseScaleHint();
  }

  const metadata = findChildrenElement(layerEl, 'MetadataURL').map(
    (metadataUrlEl) => ({
      type: getElementAttribute(metadataUrlEl, 'type'),
      format: getElementText(findChildElement(metadataUrlEl, 'Format')),
      url: getElementAttribute(
        findChildElement(metadataUrlEl, 'OnlineResource'),
        'xlink:href'
      ),
    })
  );

  const children = findChildrenElement(layerEl, 'Layer').map((layer) =>
    parseLayer(
      layer,
      version,
      availableCrs,
      styles,
      attribution,
      boundingBoxes,
      maxScaleDenominator,
      minScaleDenominator
    )
  );
  return {
    name: getElementText(findChildElement(layerEl, 'Name')),
    title: getElementText(findChildElement(layerEl, 'Title')),
    abstract: getElementText(findChildElement(layerEl, 'Abstract')),
    availableCrs,
    styles,
    attribution,
    boundingBoxes,
    keywords,
    queryable,
    opaque,
    ...(minScaleDenominator !== null ? { minScaleDenominator } : {}),
    ...(maxScaleDenominator !== null ? { maxScaleDenominator } : {}),
    ...(metadata.length && { metadata }),
    ...(children.length && { children }),
  };
}

function parseLayerStyle(styleEl: XmlElement): LayerStyle {
  const legendUrl = getElementAttribute(
    findChildElement(findChildElement(styleEl, 'LegendURL'), 'OnlineResource'),
    'xlink:href'
  );
  const abstract = getElementText(findChildElement(styleEl, 'Abstract'));
  return {
    name: getElementText(findChildElement(styleEl, 'Name')),
    title: getElementText(findChildElement(styleEl, 'Title')),
    ...(abstract && { abstract }),
    ...(legendUrl && { legendUrl }),
  };
}

function parseLayerAttribution(attributionEl: XmlElement): WmsLayerAttribution {
  const logoUrl = getElementAttribute(
    findChildElement(
      findChildElement(attributionEl, 'LogoURL'),
      'OnlineResource'
    ),
    'xlink:href'
  );
  const url = getElementAttribute(
    findChildElement(attributionEl, 'OnlineResource'),
    'xlink:href'
  );
  const title = getElementText(findChildElement(attributionEl, 'Title'));
  return {
    ...(title && { title }),
    ...(url && { url }),
    ...(logoUrl && { logoUrl }),
  };
}

/**
 * Read provider information from capabilities
 * @param capabilitiesDoc
 */
function readProviderFromCapabilities(capabilitiesDoc: XmlDocument): Provider {
  const service = findChildElement(getRootElement(capabilitiesDoc), 'Service');
  const contactInformation = findChildElement(service, 'ContactInformation');
  const contactPersonPrimary = findChildElement(
    contactInformation,
    'ContactPersonPrimary'
  );
  const address = findChildElement(contactInformation, 'ContactAddress');
  return {
    contact: {
      name: getElementText(
        findChildElement(contactPersonPrimary, 'ContactPerson')
      ),
      organization: getElementText(
        findChildElement(contactPersonPrimary, 'ContactOrganization')
      ),
      position: getElementText(
        findChildElement(contactInformation, 'ContactPosition')
      ),
      phone: getElementText(
        findChildElement(contactInformation, 'ContactVoiceTelephone')
      ),
      fax: getElementText(
        findChildElement(contactInformation, 'ContactFacsimileTelephone')
      ),
      address: {
        deliveryPoint: getElementText(findChildElement(address, 'Address')),
        city: getElementText(findChildElement(address, 'City')),
        administrativeArea: getElementText(
          findChildElement(address, 'StateOrProvince')
        ),
        postalCode: getElementText(findChildElement(address, 'PostCode')),
        country: getElementText(findChildElement(address, 'Country')),
      },
      email: getElementText(
        findChildElement(contactInformation, 'ContactElectronicMailAddress')
      ),
    },
  };
}
