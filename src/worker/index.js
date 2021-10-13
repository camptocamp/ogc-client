import { sendTaskRequest } from './utils';

/** @type {Worker} */
let workerInstance;

function getWorkerInstance() {
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
