/**
 * Will read a WMS version from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WmsVersion|null} The parsed WMS version, or null if no version could be found
 */
export function readVersionFromCapabilities(capabilitiesDoc: XmlDocument): WmsVersion | null;
/**
 * Will read all layers present in the capabilities doc and return them in a tree structure
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WmsLayerFull[]} Parsed layers
 */
export function readLayersFromCapabilities(capabilitiesDoc: XmlDocument): WmsLayerFull[];
/**
 * Will read service-related info from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {GenericEndpointInfo} Parsed service info
 */
export function readInfoFromCapabilities(capabilitiesDoc: XmlDocument): GenericEndpointInfo;
