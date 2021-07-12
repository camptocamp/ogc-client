import { addTaskHandler } from './utils';
import { queryXmlDocument } from '../shared/http-utils';
import * as wmsCapabilities from '../wms/capabilities';
import * as wfsCapabilities from '../wfs/capabilities';

addTaskHandler(
  'parseWmsCapabilities',
  /** @type {DedicatedWorkerGlobalScope} */ self,
  ({ url }) =>
    queryXmlDocument(url.toString()).then((xmlDoc) => ({
      info: wmsCapabilities.readInfoFromCapabilities(xmlDoc),
      layers: wmsCapabilities.readLayersFromCapabilities(xmlDoc),
      version: wmsCapabilities.readVersionFromCapabilities(xmlDoc),
    }))
);

addTaskHandler(
  'parseWfsCapabilities',
  /** @type {DedicatedWorkerGlobalScope} */ self,
  ({ url }) =>
    queryXmlDocument(url.toString()).then((xmlDoc) => ({
      info: wfsCapabilities.readInfoFromCapabilities(xmlDoc),
      featureTypes: wfsCapabilities.readFeatureTypesFromCapabilities(xmlDoc),
      version: wfsCapabilities.readVersionFromCapabilities(xmlDoc),
    }))
);
