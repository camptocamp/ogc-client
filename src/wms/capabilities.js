/**
 * Will read a WMS version from the capabilities doc
 * @param {Document} capabilitiesDoc Capabilities document
 * @return {WmsVersion|null} The parsed WMS version, or null if no version could be found
 */
export function readVersionFromCapabilities(capabilitiesDoc) {
  const root130 = capabilitiesDoc
      .getElementsByTagName('WMS_Capabilities')[0]
  const root111 = capabilitiesDoc
      .getElementsByTagName('WMT_MS_Capabilities')[0]

  if (root130) {
    return root130.attributes['version'].value;
  } else if (root111) {
    return root111.attributes['version'].value;
  } else {
    return null;
  }
}

/**
 * Will read all layers present in the capabilities doc
 * @param {Document} capabilitiesDoc Capabilities document
 * @return {WmsLayer[]} Parsed layers
 */
export function readLayersFromCapabilities(capabilitiesDoc) {

}
