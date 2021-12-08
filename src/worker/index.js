import { sendTaskRequest } from './utils';

/** @type {boolean} */
let fallbackWithoutWorker = false;

/**
 * Call once to disable Worker usage completely
 */
export function enableFallbackWithoutWorker() {
  fallbackWithoutWorker = true;
}

/** @type {Worker} */
let workerInstance;

/**
 * @returns {null|Worker} If null, use fallback without worker!
 */
function getWorkerInstance() {
  if (fallbackWithoutWorker) {
    return null;
  }
  if (!workerInstance) {
    workerInstance = new Worker('./worker.js', {
      type: 'module',
    });
  }
  return workerInstance;
}

/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WmsVersion, info: GenericEndpointInfo, layers: WmsLayerFull[]}>}
 */
export function parseWmsCapabilities(capabilitiesUrl) {
  return sendTaskRequest('parseWmsCapabilities', getWorkerInstance(), {
    url: capabilitiesUrl,
  });
}

/**
 * Parses the capabilities document and return all relevant information
 * @param {string} capabilitiesUrl This url should point to the capabilities document
 * @return {Promise<{version: WfsVersion, info: GenericEndpointInfo, featureTypes: WfsFeatureTypeInternal[]}>}
 */
export function parseWfsCapabilities(capabilitiesUrl) {
  return sendTaskRequest('parseWfsCapabilities', getWorkerInstance(), {
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
  return sendTaskRequest('queryWfsFeatureTypeDetails', getWorkerInstance(), {
    url: capabilitiesUrl,
    serviceVersion,
    featureTypeFull,
  });
}
