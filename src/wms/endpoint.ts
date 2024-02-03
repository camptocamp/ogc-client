import { parseWmsCapabilities } from '../worker';
import { useCache } from '../shared/cache';
import { setQueryParams } from '../shared/http-utils';
import { GenericEndpointInfo } from '../shared/models';
import { WmsLayerFull, WmsLayerSummary, WmsVersion } from './model';

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
   * @throws {EndpointError}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns an array of layers in summary format; layers are organized in a tree
   * structure with each aving an optional `children` property
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
   * Returns a complete layer based on its name
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

  getVersion() {
    return this._version;
  }
}
