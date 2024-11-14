export { default as WfsEndpoint } from './wfs/endpoint.js';
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
  WfsGetFeatureOptions,
} from './wfs/model.js';
export { default as WmsEndpoint } from './wms/endpoint.js';
export type {
  WmsLayerFull,
  WmsVersion,
  WmsLayerSummary,
  WmsLayerAttribution,
} from './wms/model.js';
export { default as WmtsEndpoint } from './wmts/endpoint.js';
export type {
  WmtsLayerDimensionValue,
  WmtsLayerResourceLink,
  WmtsEndpointInfo,
  WmtsLayer,
  WmtsMatrixSet,
} from './wmts/model.js';
export type {
  Address,
  Contact,
  Provider,
  LayerStyle,
  BoundingBox,
  MetadataURL,
  FetchOptions,
  GenericEndpointInfo,
  MimeType,
  CrsCode,
} from './shared/models.js';
export { default as OgcApiEndpoint } from './ogc-api/endpoint.js';
export * from './ogc-api/model.js';
export { useCache, clearCache } from './shared/cache.js';
export {
  sharedFetch,
  setFetchOptions,
  resetFetchOptions,
} from './shared/http-utils.js';
export {
  check,
  ServiceExceptionError,
  EndpointError,
} from './shared/errors.js';

export { enableFallbackWithoutWorker } from './worker/index.js';
import './worker-fallback/index.js';
