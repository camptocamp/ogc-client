/**
 * Will read a WMS version from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WmsVersion|null} The parsed WMS version, or null if no version could be found
 */
export function readVersionFromCapabilities(capabilitiesDoc) {
  const root = capabilitiesDoc.children[0]
  return root.attributes['version'];
}

/**
 * Will read all layers present in the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WmsLayer[]} Parsed layers
 */
export function readLayersFromCapabilities(capabilitiesDoc) {

}
