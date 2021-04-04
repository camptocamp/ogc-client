import {findChildElement, findChildrenElement, getElementText, getRootElement} from "../shared/xml-utils";

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
 * @return {WmsLayer}
 */
function parseLayer(layerObj, version) {
  return {
    name: getElementText(findChildElement(layerObj, 'Name')),
    title: getElementText(findChildElement(layerObj, 'Title')),
    abstract: getElementText(findChildElement(layerObj, 'Abstract')),
    availableCrs: [],
    childLayers: findChildrenElement(layerObj, 'Layer').map(layer => parseLayer(layer, version)),
  }
}
