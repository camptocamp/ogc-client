import { parseWmsCapabilities } from '../worker/index.js';
import { useCache } from '../shared/cache.js';
import { setQueryParams } from '../shared/http-utils.js';
import { GenericEndpointInfo } from '../shared/models.js';
import { WmsLayerFull, WmsLayerSummary, WmsVersion } from './model.js';

/**
 * Represents a WMS endpoint advertising several layers arranged in a tree structure.
 */
export default class WmsEndpoint {
  private _capabilitiesPromise: Promise<void>;
  private _info: GenericEndpointInfo | null;
  private _layers: WmsLayerFull[] | null;
  private _version: WmsVersion | null;

  /**
   * @param url WMS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url: string) {
    const capabilitiesUrl = setQueryParams(url, {
      SERVICE: 'WMS',
      REQUEST: 'GetCapabilities',
    });

    /**
     * This fetches the capabilities doc and parses its contents
     */
    this._capabilitiesPromise = useCache(
      () => parseWmsCapabilities(capabilitiesUrl),
      'WMS',
      'CAPABILITIES',
      capabilitiesUrl
    ).then(({ info, layers, version }) => {
      this._info = info;
      this._layers = layers;
      this._version = version;
    });
  }

  /**
   * Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.
   * @throws {EndpointError}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  /**
   * Returns the service information.
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns an array of layers in summary format; layers are organized in a tree
   * structure with each having an optional `children` property
   */
  getLayers() {
    function layerSummaryMapper(layerFull) {
      return {
        title: layerFull.title,
        name: layerFull.name,
        abstract: layerFull.abstract,
        ...('children' in layerFull && {
          children: layerFull.children.map(layerSummaryMapper),
        }),
      } as WmsLayerSummary;
    }
    return this._layers.map(layerSummaryMapper);
  }

  /**
   * Returns the full layer information, including supported coordinate systems, available layers, bounding boxes etc.
   * Layer name is case-sensitive.
   * @param name Layer name property (unique in the WMS service)
   * @return return null if layer was not found
   */
  getLayerByName(name: string) {
    let result: WmsLayerFull = null;
    function layerLookup(layer) {
      if (result !== null) return;
      if (layer.name === name) {
        result = layer;
        return;
      }
      if ('children' in layer) {
        layer.children.map(layerLookup);
      }
    }
    this._layers.map(layerLookup);
    return result;
  }

  /**
   * If only one single renderable layer is available, return its name; otherwise, returns null;
   */
  getSingleLayerName(): string | null {
    if (!this._layers) return null;
    const layers: WmsLayerFull[] = [];
    function layerLookup(layer: WmsLayerFull) {
      if (layer.name) {
        layers.push(layer);
      }
      if ('children' in layer) {
        layer.children.map(layerLookup);
      }
    }
    this._layers.map(layerLookup);
    if (layers.length === 1) return layers[0].name;
    return null;
  }

  /**
   * Returns the highest protocol version that this WMS endpoint supports.
   * Note that if the url used for initialization does specify a version (e.g. 1.1.0),
   * this version will most likely be used instead of the highest supported one.
   */
  getVersion() {
    return this._version;
  }
}
