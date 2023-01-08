import { sendTaskRequest } from './utils';
import {
  WfsFeatureTypeFull,
  WfsFeatureTypeInternal,
  WfsFeatureTypePropsDetails,
  WfsVersion,
} from '../wfs/endpoint';
import { GenericEndpointInfo } from '../shared/models';
import { WmsLayerFull, WmsVersion } from '../wms/endpoint';

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
    workerInstance = new Worker('./worker.ts', {
      type: 'module',
    });
  }
  return workerInstance;
}

/**
 * Parses the capabilities document and return all relevant information
 * @param capabilitiesUrl This url should point to the capabilities document
 */
export function parseWmsCapabilities(
  capabilitiesUrl: string
): Promise<{
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
export function parseWfsCapabilities(
  capabilitiesUrl: string
): Promise<{
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
