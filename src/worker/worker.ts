import { addTaskHandler } from './utils';
import { queryXmlDocument, setFetchOptions } from '../shared/http-utils';
import * as wmsCapabilities from '../wms/capabilities';
import * as wfsCapabilities from '../wfs/capabilities';
import {
  computeFeaturePropsDetails,
  parseFeatureProps,
} from '../wfs/featureprops';
import { generateGetFeatureUrl } from '../wfs/url';
import { WfsFeatureTypeFull, WfsVersion } from '../wfs/endpoint';
import { FetchOptions } from '../shared/models';

addTaskHandler('parseWmsCapabilities', globalThis, ({ url }: { url: string }) =>
  queryXmlDocument(url).then((xmlDoc) => ({
    info: wmsCapabilities.readInfoFromCapabilities(xmlDoc),
    layers: wmsCapabilities.readLayersFromCapabilities(xmlDoc),
    version: wmsCapabilities.readVersionFromCapabilities(xmlDoc),
  }))
);

addTaskHandler('parseWfsCapabilities', globalThis, ({ url }: { url: string }) =>
  queryXmlDocument(url).then((xmlDoc) => ({
    info: wfsCapabilities.readInfoFromCapabilities(xmlDoc),
    featureTypes: wfsCapabilities.readFeatureTypesFromCapabilities(xmlDoc),
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
