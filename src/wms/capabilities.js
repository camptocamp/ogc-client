import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement
} from "../shared/xml-utils";
import {hasInvertedCoordinates} from "../shared/crs-utils";

/**
 * Will read a WMS version from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WmsVersion|null} The parsed WMS version, or null if no version could be found
 */
export function readVersionFromCapabilities(capabilitiesDoc) {
  return getRootElement(capabilitiesDoc).attributes['version'];
}

/**
 * Will read all layers present in the capabilities doc and return them in a tree structure
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WmsLayer[]} Parsed layers
 */
export function readLayersFromCapabilities(capabilitiesDoc) {
  const version = readVersionFromCapabilities(capabilitiesDoc)
  const capability = findChildElement(getRootElement(capabilitiesDoc), 'Capability');

  /**
   * @param {string[]} path
   * @param {CrsCode[]} [inheritedCrs]
   * @param {LayerStyle[]} [inheritedStyles]
   * @return {function(WmsLayer[], XmlElement): WmsLayer[]} A reducer which parses all layers recursively
   */
  const recursiveParseLayer = (path, inheritedCrs, inheritedStyles) => (prev, layerEl) => {
    const parsedLayer = parseLayer(path, layerEl, version, inheritedCrs, inheritedStyles);
    const children = findChildrenElement(layerEl, 'Layer');
    const childrenPath = [...path, parsedLayer.name];
    return [
      ...prev,
      parsedLayer,
      ...children.reduce(recursiveParseLayer(childrenPath, parsedLayer.availableCrs, parsedLayer.styles), [])
    ];
  }

  return findChildrenElement(capability, 'Layer')
    .reduce(recursiveParseLayer([]), [])
}

/**
 * Parse a layer in a capabilities doc
 * @param {string[]} path Path of the layer to be parsed (empty array of root layer)
 * @param {XmlElement} layerEl
 * @param {WmsVersion} version
 * @param {CrsCode[]} [inheritedSrs]
 * @param {LayerStyle[]} [inheritedStyles]
 * @return {WmsLayer}
 */
function parseLayer(path, layerEl, version, inheritedSrs = [], inheritedStyles = []) {
  const srsTag = version === '1.3.0' ? 'CRS' : 'SRS'
  const srsList = findChildrenElement(layerEl, srsTag).map(getElementText)
  const availableCrs = srsList.length > 0 ? srsList : inheritedSrs
  const layerStyles = findChildrenElement(layerEl, 'Style')
    .map(parseLayerStyle);
  const styles = layerStyles.length > 0 ? layerStyles : inheritedStyles;
  function parseBBox(bboxEl) {
    const srs = getElementAttribute(bboxEl, srsTag)
    const attrs = hasInvertedCoordinates(srs) && version === '1.3.0' ?
      ['miny', 'minx', 'maxy', 'maxx'] :
      ['minx', 'miny', 'maxx', 'maxy'];
    return attrs.map(name => getElementAttribute(bboxEl, name))
  }
  return {
    name: getElementText(findChildElement(layerEl, 'Name')),
    title: getElementText(findChildElement(layerEl, 'Title')),
    abstract: getElementText(findChildElement(layerEl, 'Abstract')),
    availableCrs,
    styles,
    boundingBoxes: findChildrenElement(layerEl, 'BoundingBox').reduce((prev, bboxEl) =>
      ({
        ...prev,
        [getElementAttribute(bboxEl, srsTag)]: parseBBox(bboxEl)
      }), {}),
    path
  }
}

/**
 * @param {XmlElement} styleEl
 * @return {LayerStyle}
 */
function parseLayerStyle(styleEl) {
  const legendUrl = getElementAttribute(
    findChildElement(
      findChildElement(styleEl, 'LegendURL'),
      'OnlineResource'
    ),
  'xlink:href'
  );
  return {
    name: getElementText(findChildElement(styleEl, 'Name')),
    title: getElementText(findChildElement(styleEl, 'Title')),
    ...legendUrl && { legendUrl }
  };
}
