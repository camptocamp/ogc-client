import { EndpointError } from '../shared/errors';
import { parseWmsCapabilities } from '../worker';
import { useCache } from '../shared/cache';
import { setQueryParams } from '../shared/http-utils';
import { BoundingBox, CrsCode, GenericEndpointInfo } from '../shared/models';

export type LayerStyle = {
  name: string;
  title: string;
  /**
   * May not be defined; a GetLegendGraphic operation should work in any case
   */
  legendUrl?: string;
};

export type LayerAttribution = {
  title?: string;
  url?: string;
  logoUrl?: string;
};

export type WmsLayerSummary = {
  /**
   * The layer is renderable if defined
   */
  name?: string;
  title: string;
  abstract?: string;
  /**
   * Not defined if the layer is a leaf in the tree
   */
  children?: WmsLayerSummary[];
};

export type WmsLayerFull = {
  /**
   * The layer is renderable if defined
   */
  name?: string;
  title: string;
  abstract?: string;
  availableCrs: CrsCode[];
  styles: LayerStyle[];
  /**
   * Dict of bounding boxes where keys are CRS codes
   */
  boundingBoxes: Record<CrsCode, BoundingBox>;
  attribution?: LayerAttribution;
  /**
   * Not defined if the layer is a leaf in the tree
   */
  children?: WmsLayerFull[];
};

export type WmsVersion = '1.1.0' | '1.1.1' | '1.3.0';

/**
 * Represents a WMS endpoint advertising several layers arranged in a tree structure.
 */
export default class WmsEndpoint {
  private _capabilitiesUrl: string;
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
   * Returns an array of layers in summary format; use the `path` property
   * to rebuild the tree structure if needed
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
   * Note: the first matching layer will be returned
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
