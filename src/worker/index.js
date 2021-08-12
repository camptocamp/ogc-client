import { sendTaskRequest } from './utils';

/** @type {Worker} */
const workerInstance = new Worker('./worker.js', {
  type: 'module',
});

/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WmsVersion, info: GenericEndpointInfo, layers: WmsLayerFull[]}>}
 */
export function parseWmsCapabilities(capabilitiesUrl) {
  return sendTaskRequest('parseWmsCapabilities', workerInstance, {
    url: capabilitiesUrl,
  });
}

/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WfsVersion, info: GenericEndpointInfo, featureTypes: WfsFeatureTypeInternal[]}>}
 */
export function parseWfsCapabilities(capabilitiesUrl) {
  return sendTaskRequest('parseWfsCapabilities', workerInstance, {
    url: capabilitiesUrl,
  });
}

/**
 * Queries a feature type details
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @param {WfsVersion} serviceVersion
 * @param {WfsFeatureTypeFull} featureTypeFull
 * @return {Promise<{props:WfsFeatureTypePropsDetails}>}
 */
export function queryWfsFeatureTypeDetails(
  capabilitiesUrl,
  serviceVersion,
  featureTypeFull
) {
  return sendTaskRequest('queryWfsFeatureTypeDetails', workerInstance, {
    url: capabilitiesUrl,
    serviceVersion,
    featureTypeFull,
  });
}
