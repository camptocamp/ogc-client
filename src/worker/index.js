import { sendTaskRequest } from './utils';

/** @type {Worker} */
const workerInstance = new Worker('./worker.js', {
  type: 'module',
});

/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WmsVersion, info: WmsInfo, layers: WmsLayerFull[]}>}
 */
export function parseWmsCapabilities(capabilitiesUrl) {
  return sendTaskRequest('parseWmsCapabilities', workerInstance, {
    url: capabilitiesUrl,
  });
}

/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WfsVersion, info: WfsInfo, featureTypes: WfsFeatureTypeInternal[]}>}
 */
export function parseWfsCapabilities(capabilitiesUrl) {
  return sendTaskRequest('parseWfsCapabilities', workerInstance, {
    url: capabilitiesUrl,
  });
}
