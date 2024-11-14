import { addTaskHandler } from './utils.js';
import { queryXmlDocument, setFetchOptions } from '../shared/http-utils.js';
import { check } from '../shared/errors.js';
import * as wmsCapabilities from '../wms/capabilities.js';
import * as wfsCapabilities from '../wfs/capabilities.js';
import * as wmtsCapabilities from '../wmts/capabilities.js';
import {
  computeFeaturePropsDetails,
  parseFeatureProps,
} from '../wfs/featureprops.js';
import { generateGetFeatureUrl } from '../wfs/url.js';
import { FetchOptions } from '../shared/models.js';
import { WfsFeatureTypeFull, WfsVersion } from '../wfs/model.js';

addTaskHandler('parseWmsCapabilities', globalThis, ({ url }: { url: string }) =>
  queryXmlDocument(url)
    .then((xmlDoc) => check(xmlDoc, url))
    .then((xmlDoc) => ({
      info: wmsCapabilities.readInfoFromCapabilities(xmlDoc),
      layers: wmsCapabilities.readLayersFromCapabilities(xmlDoc),
      url: wmsCapabilities.readOperationUrlsFromCapabilities(xmlDoc),
      version: wmsCapabilities.readVersionFromCapabilities(xmlDoc),
    }))
);

addTaskHandler('parseWfsCapabilities', globalThis, ({ url }: { url: string }) =>
  queryXmlDocument(url)
    .then((xmlDoc) => check(xmlDoc, url))
    .then((xmlDoc) => ({
      info: wfsCapabilities.readInfoFromCapabilities(xmlDoc),
      featureTypes: wfsCapabilities.readFeatureTypesFromCapabilities(xmlDoc),
      url: wfsCapabilities.readOperationUrlsFromCapabilities(xmlDoc),
      version: wfsCapabilities.readVersionFromCapabilities(xmlDoc),
    }))
);

addTaskHandler(
  'queryWfsFeatureTypeDetails',
  globalThis,
  ({
    url,
    serviceVersion,
    featureTypeFull,
  }: {
    url: string;
    serviceVersion: WfsVersion;
    featureTypeFull: WfsFeatureTypeFull;
  }) => {
    const getFeatureUrl = generateGetFeatureUrl(
      url,
      serviceVersion,
      featureTypeFull.name,
      undefined,
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

addTaskHandler(
  'updateFetchOptions',
  globalThis,
  ({ options }: { options: FetchOptions }) => {
    setFetchOptions(options);
    return Promise.resolve({});
  }
);

addTaskHandler(
  'parseWmtsCapabilities',
  globalThis,
  ({ url }: { url: string }) =>
    queryXmlDocument(url)
      .then((xmlDoc) => check(xmlDoc, url))
      .then((xmlDoc) => ({
        info: wmtsCapabilities.readInfoFromCapabilities(xmlDoc),
        layers: wmtsCapabilities.readLayersFromCapabilities(xmlDoc),
        matrixSets: wmtsCapabilities.readMatrixSetsFromCapabilities(xmlDoc),
      }))
);
