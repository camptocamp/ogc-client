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
  return findChildrenElement(capability, 'Layer').map(layer => parseLayer(layer, version))
}

/**
 * Parse a layer in a capabilities doc
 * @param {XmlElement} layerEl
 * @param {WmsVersion} version
 * @param {CrsCode[]} [inheritedSrs]
 * @param {Style[]} [inheritedStyles]
 * @return {WmsLayer}
 */
function parseLayer(layerEl, version, inheritedSrs = [], inheritedStyles = []) {
  const srsTag = version === '1.3.0' ? 'CRS' : 'SRS'
  const srsList = findChildrenElement(layerEl, srsTag).map(getElementText)
  const availableCrs = srsList.length > 0 ? srsList : inheritedSrs
  function parseBBox(bboxEl) {
    const srs = getElementAttribute(bboxEl, srsTag)
    const attrs = hasInvertedCoordinates(srs) && version === '1.3.0' ?
      ['miny', 'minx', 'maxy', 'maxx'] :
      ['minx', 'miny', 'maxx', 'maxy'];
    return attrs.map(name => getElementAttribute(bboxEl, name))
  }
  const layerStyles = findChildrenElement(layerEl, 'Style')
    .map(styleEl => findChildElement(styleEl, 'Name'))
    .map(getElementText);
  const styles = layerStyles.length > 0 ? layerStyles : inheritedStyles;
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
    childLayers: findChildrenElement(layerEl, 'Layer').map(layer => parseLayer(layer, version, availableCrs, styles)),
  }
}
