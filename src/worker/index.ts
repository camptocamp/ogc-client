import { sendTaskRequest } from './utils.js';
import {
  GenericEndpointInfo,
  OperationName,
  OperationUrl,
} from '../shared/models.js';
import { setFetchOptionsUpdateCallback } from '../shared/http-utils.js';
import { WmtsEndpointInfo, WmtsLayer, WmtsMatrixSet } from '../wmts/model.js';
import {
  WfsFeatureTypeFull,
  WfsFeatureTypeInternal,
  WfsFeatureTypePropsDetails,
  WfsVersion,
} from '../wfs/model.js';
import { WmsLayerFull, WmsVersion } from '../wms/model.js';
// @ts-expect-error TS2307
// eslint-disable-next-line require-extensions/require-extensions
import OgcClientWorker from './worker?worker&inline';
import { TileMapLayer } from '../tms/models.js';

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
  url: Record<OperationName, OperationUrl>;
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
  url: Record<OperationName, OperationUrl>;
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

/**
 * Parses the tms service metadata document and return all relevant information
 * @param rootUrl This url should point to the TMS metadata document
 */
export function parseTmsCapabilities(url: string): Promise<{
  info: GenericEndpointInfo;
  layers: TileMapLayer[];
}> {
  return sendTaskRequest('parseTmsCapabilities', getWorkerInstance(), { url });
}

setFetchOptionsUpdateCallback((options) => {
  const worker = getWorkerInstance();
  if (!worker) return;
  sendTaskRequest('updateFetchOptions', getWorkerInstance(), { options });
});
