export { default as WfsEndpoint } from './wfs/endpoint';
export type {
  WfsVersion,
  WfsFeatureWithProps,
  WfsFeatureTypeSummary,
  WfsFeatureTypeBrief,
  FeatureGeometryType,
  FeaturePropertyType,
  WfsFeatureTypeFull,
  WfsFeatureTypePropDetails,
  WfsFeatureTypePropsDetails,
  WfsFeatureTypeUniqueValue,
} from './wfs/model';
export { default as WmsEndpoint } from './wms/endpoint';
export type {
  WmsLayerFull,
  WmsVersion,
  WmsLayerSummary,
  WmtsLayerAttribution,
} from './wms/model';
export { default as WmtsEndpoint } from './wmts/endpoint';
export type {
  WmtsLayerDimensionValue,
  WmtsLayerResourceLink,
  WmtsEndpointInfo,
  WmtsLayer,
  WmtsMatrixSet,
} from './wmts/model';
export type { LayerStyle, BoundingBox, FetchOptions } from './shared/models';
export { default as OgcApiEndpoint } from './ogc-api/endpoint';
export { useCache } from './shared/cache';
export {
  sharedFetch,
  setFetchOptions,
  resetFetchOptions,
} from './shared/http-utils';

export { enableFallbackWithoutWorker } from './worker/index';
import './worker-fallback';
