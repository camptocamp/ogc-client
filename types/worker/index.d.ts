/**
 * Call once to disable Worker usage completely
 */
export function enableFallbackWithoutWorker(): void;
/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WmsVersion, info: GenericEndpointInfo, layers: WmsLayerFull[]}>}
 */
export function parseWmsCapabilities(capabilitiesUrl: string): Promise<{
    version: WmsVersion;
    info: GenericEndpointInfo;
    layers: WmsLayerFull[];
}>;
/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WfsVersion, info: GenericEndpointInfo, featureTypes: WfsFeatureTypeInternal[]}>}
 */
export function parseWfsCapabilities(capabilitiesUrl: string): Promise<{
    version: WfsVersion;
    info: GenericEndpointInfo;
    featureTypes: WfsFeatureTypeInternal[];
}>;
/**
 * Queries a feature type details
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @param {WfsVersion} serviceVersion
 * @param {WfsFeatureTypeFull} featureTypeFull
 * @return {Promise<{props:WfsFeatureTypePropsDetails}>}
 */
export function queryWfsFeatureTypeDetails(capabilitiesUrl: string, serviceVersion: WfsVersion, featureTypeFull: WfsFeatureTypeFull): Promise<{
    props: WfsFeatureTypePropsDetails;
}>;
