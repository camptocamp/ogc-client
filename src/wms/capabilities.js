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
 * @param {XmlElement} layerObj
 * @param {WmsVersion} version
 * @param {CrsCode[]} [inheritedSrs]
 * @return {WmsLayer}
 */
function parseLayer(layerObj, version, inheritedSrs = []) {
  const srsTag = version === '1.3.0' ? 'CRS' : 'SRS'
  const srsList = findChildrenElement(layerObj, srsTag).map(getElementText)
  const availableCrs = srsList.length > 0 ? srsList : inheritedSrs
  function parseBBox(bboxEl) {
    const srs = getElementAttribute(bboxEl, srsTag)
    const attrs = hasInvertedCoordinates(srs) && version === '1.3.0' ?
      ['miny', 'minx', 'maxy', 'maxx'] :
      ['minx', 'miny', 'maxx', 'maxy'];
    return attrs.map(name => getElementAttribute(bboxEl, name))
  }
  return {
    name: getElementText(findChildElement(layerObj, 'Name')),
    title: getElementText(findChildElement(layerObj, 'Title')),
    abstract: getElementText(findChildElement(layerObj, 'Abstract')),
    availableCrs,
    boundingBoxes: findChildrenElement(layerObj, 'BoundingBox').reduce((prev, bboxEl) =>
      ({
        ...prev,
        [getElementAttribute(bboxEl, srsTag)]: parseBBox(bboxEl)
      }), {}),
    childLayers: findChildrenElement(layerObj, 'Layer').map(layer => parseLayer(layer, version, availableCrs)),
  }
}
