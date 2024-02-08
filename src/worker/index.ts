import { sendTaskRequest } from './utils';
import { GenericEndpointInfo } from '../shared/models';
import { setFetchOptionsUpdateCallback } from '../shared/http-utils';
import { WmtsEndpointInfo, WmtsLayer, WmtsMatrixSet } from '../wmts/model';
import {
  WfsFeatureTypeFull,
  WfsFeatureTypeInternal,
  WfsFeatureTypePropsDetails,
  WfsVersion,
} from '../wfs/model';
import { WmsLayerFull, WmsVersion } from '../wms/model';
// @ts-ignore
import OgcClientWorker from './worker?worker&inline';

let fallbackWithoutWorker = false;

/**
 * Call once to disable Worker usage completely
 */
export function enableFallbackWithoutWorker() {
  fallbackWithoutWorker = true;
}

let workerInstance: Worker;

/**
 * @returns {null|Worker} If null, use fallback without worker!
 */
function getWorkerInstance() {
  if (fallbackWithoutWorker) {
    return null;
  }
  if (!workerInstance) {
    workerInstance = new OgcClientWorker();
  }
  return workerInstance;
}

/**
 * Parses the capabilities document and return all relevant information
 * @param capabilitiesUrl This url should point to the capabilities document
 */
export function parseWmsCapabilities(capabilitiesUrl: string): Promise<{
  version: WmsVersion;
  info: GenericEndpointInfo;
  layers: WmsLayerFull[];
}> {
  return sendTaskRequest('parseWmsCapabilities', getWorkerInstance(), {
    url: capabilitiesUrl,
  });
}

/**
 * Parses the capabilities document and return all relevant information
 * @param capabilitiesUrl This url should point to the capabilities document
 */
export function parseWfsCapabilities(capabilitiesUrl: string): Promise<{
  version: WfsVersion;
  info: GenericEndpointInfo;
  featureTypes: WfsFeatureTypeInternal[];
}> {
  return sendTaskRequest('parseWfsCapabilities', getWorkerInstance(), {
    url: capabilitiesUrl,
  });
}

/**
 * Queries a feature type details
 * @param capabilitiesUrl This url should point to the capabilities document
 * @param serviceVersion
 * @param featureTypeFull
 */
export function queryWfsFeatureTypeDetails(
  capabilitiesUrl: string,
  serviceVersion: WfsVersion,
  featureTypeFull: WfsFeatureTypeFull
): Promise<{ props: WfsFeatureTypePropsDetails }> {
  return sendTaskRequest('queryWfsFeatureTypeDetails', getWorkerInstance(), {
    url: capabilitiesUrl,
    serviceVersion,
    featureTypeFull,
  });
}

/**
 * Parses the capabilities document and return all relevant information
 * @param capabilitiesUrl This url should point to the capabilities document
 */
export function parseWmtsCapabilities(capabilitiesUrl: string): Promise<{
  info: WmtsEndpointInfo;
  layers: WmtsLayer[];
  matrixSets: WmtsMatrixSet[];
}> {
  return sendTaskRequest('parseWmtsCapabilities', getWorkerInstance(), {
    url: capabilitiesUrl,
  });
}

setFetchOptionsUpdateCallback((options) => {
  const worker = getWorkerInstance();
  if (!worker) return;
  sendTaskRequest('updateFetchOptions', getWorkerInstance(), { options });
});
