/**
 * Will read a WFS version from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {WfsVersion|null} The parsed WFS version, or null if no version could be found
 */
export function readVersionFromCapabilities(capabilitiesDoc: XmlDocument): WfsVersion | null;
/**
 * Will read the supported output formats from the capabilities document; note that these might not be valid MIME types
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {string[]|null} Advertised output formats
 */
export function readOutputFormatsFromCapabilities(capabilitiesDoc: XmlDocument): string[] | null;
/**
 * Will read service-related info from the capabilities doc
 * @param {XmlDocument} capabilitiesDoc Capabilities document
 * @return {GenericEndpointInfo} Parsed service info
 */
export function readInfoFromCapabilities(capabilitiesDoc: XmlDocument): GenericEndpointInfo;
/**
 * Will read all feature types present in the capabilities doc
 * @param {XmlDocument} capabilitiesDoc
 * @return {WfsFeatureTypeInternal[]}
 */
export function readFeatureTypesFromCapabilities(capabilitiesDoc: XmlDocument): WfsFeatureTypeInternal[];
