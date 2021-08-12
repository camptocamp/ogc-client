import { addTaskHandler } from './utils';
import { queryXmlDocument } from '../shared/http-utils';
import * as wmsCapabilities from '../wms/capabilities';
import * as wfsCapabilities from '../wfs/capabilities';
import {
  computeFeaturePropsDetails,
  parseFeatureProps,
} from '../wfs/featureprops';
import { generateGetFeatureUrl } from '../wfs/url';

addTaskHandler(
  'parseWmsCapabilities',
  /** @type {DedicatedWorkerGlobalScope} */ self,
  /**
   * @param {string} url
   * @return {Promise<{info:GenericEndpointInfo,layers:WmsLayerFull[],version:WmsVersion}>}
   */
  ({ url }) =>
    queryXmlDocument(url).then((xmlDoc) => ({
      info: wmsCapabilities.readInfoFromCapabilities(xmlDoc),
      layers: wmsCapabilities.readLayersFromCapabilities(xmlDoc),
      version: wmsCapabilities.readVersionFromCapabilities(xmlDoc),
    }))
);

addTaskHandler(
  'parseWfsCapabilities',
  /** @type {DedicatedWorkerGlobalScope} */ self,
  /**
   * @param {string} url
   * @return {Promise<{info:GenericEndpointInfo,featureTypes:WfsFeatureTypeInternal[],version:WfsVersion}>}
   */
  ({ url }) =>
    queryXmlDocument(url).then((xmlDoc) => ({
      info: wfsCapabilities.readInfoFromCapabilities(xmlDoc),
      featureTypes: wfsCapabilities.readFeatureTypesFromCapabilities(xmlDoc),
      version: wfsCapabilities.readVersionFromCapabilities(xmlDoc),
    }))
);

addTaskHandler(
  'queryWfsFeatureTypeDetails',
  /** @type {DedicatedWorkerGlobalScope} */ self,
  /**
   * @param {string} url
   * @param {WfsVersion} serviceVersion
   * @param {WfsFeatureTypeFull} featureTypeFull
   * @return {Promise<{props:WfsFeatureTypePropsDetails}>}
   */
  ({ url, serviceVersion, featureTypeFull }) => {
    const getFeatureUrl = generateGetFeatureUrl(
      url,
      serviceVersion,
      featureTypeFull.name,
      undefined,
      Object.keys(featureTypeFull.properties)
    );
    return queryXmlDocument(getFeatureUrl).then((getFeatureDoc) => ({
      props: computeFeaturePropsDetails(
        parseFeatureProps(getFeatureDoc, featureTypeFull, serviceVersion)
      ),
    }));
  }
);
