import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement,
} from '../shared/xml-utils.js';
import { hasInvertedCoordinates } from '../shared/crs-utils.js';
import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import {
  BoundingBox,
  CrsCode,
  GenericEndpointInfo,
  LayerStyle,
} from '../shared/models.js';
import { WmsLayerAttribution, WmsLayerFull, WmsVersion } from './model.js';

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

/**
 * Will read service-related info from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return Parsed service info
 */
export function readInfoFromCapabilities(
  capabilitiesDoc: XmlDocument
): GenericEndpointInfo {
  const service = findChildElement(getRootElement(capabilitiesDoc), 'Service');
  const keywords = findChildrenElement(
    findChildElement(service, 'KeywordList'),
    'Keyword'
  )
    .map(getElementText)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return {
    title: getElementText(findChildElement(service, 'Title')),
    name: getElementText(findChildElement(service, 'Name')),
    abstract: getElementText(findChildElement(service, 'Abstract')),
    fees: getElementText(findChildElement(service, 'Fees')),
    constraints: getElementText(findChildElement(service, 'AccessConstraints')),
    keywords,
  };
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
  inheritedBoundingBoxes: Record<CrsCode, BoundingBox> = null
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
    return attrs.map((name) => getElementAttribute(bboxEl, name));
  }
  function parseExGeographicBoundingBox(bboxEl) {
    return [
      'westBoundLongitude',
      'southBoundLatitude',
      'eastBoundLongitude',
      'northBoundLatitude',
    ].map((name) => getElementText(findChildElement(bboxEl, name)));
  }
  function parseLatLonBoundingBox(bboxEl) {
    return ['minx', 'miny', 'maxx', 'maxy'].map((name) =>
      getElementAttribute(bboxEl, name)
    );
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

  const children = findChildrenElement(layerEl, 'Layer').map((layer) =>
    parseLayer(layer, version, availableCrs, styles, attribution, boundingBoxes)
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
    ...(children.length && { children }),
  };
}

function parseLayerStyle(styleEl: XmlElement): LayerStyle {
  const legendUrl = getElementAttribute(
    findChildElement(findChildElement(styleEl, 'LegendURL'), 'OnlineResource'),
    'xlink:href'
  );
  return {
    name: getElementText(findChildElement(styleEl, 'Name')),
    title: getElementText(findChildElement(styleEl, 'Title')),
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
