import { addTaskHandler } from './utils';
import { queryXmlDocument } from '../shared/http-utils';
import {
  readInfoFromCapabilities,
  readLayersFromCapabilities,
  readVersionFromCapabilities,
} from '../wms/capabilities';

addTaskHandler(
  'parseWmsCapabilities',
  /** @type {DedicatedWorkerGlobalScope} */ self,
  ({ url }) =>
    queryXmlDocument(url.toString()).then((xmlDoc) => ({
      info: readInfoFromCapabilities(xmlDoc),
      layers: readLayersFromCapabilities(xmlDoc),
      version: readVersionFromCapabilities(xmlDoc),
    }))
);
