import { parseWmsCapabilities } from '../worker/index.js';
import { useCache } from '../shared/cache.js';
import { setQueryParams } from '../shared/http-utils.js';
import {
  BoundingBox,
  CrsCode,
  GenericEndpointInfo,
  type HttpMethod,
  MimeType,
  type OperationName,
  type OperationUrl,
} from '../shared/models.js';
import { BaseEndpoint } from '../shared/base-endpoint.js';
import type { BaseLayerExtended } from '../shared/base-layer.js';
import { WmsLayerFull, WmsLayerSummary, WmsVersion } from './model.js';
import { generateGetMapUrl } from './url.js';

/**
 * Represents a WMS endpoint advertising several layers arranged in a tree structure.
 */
export default class WmsEndpoint implements BaseEndpoint {
  private _capabilitiesUrl: string;
  private _capabilitiesPromise: Promise<void>;
  private _info: GenericEndpointInfo | null;
  private _layers: WmsLayerFull[] | null;
  private _url: Record<OperationName, OperationUrl>;
  private _version: WmsVersion | null;

  /**
   * @param url WMS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url: string) {
    this._capabilitiesUrl = setQueryParams(url, {
      SERVICE: 'WMS',
      REQUEST: 'GetCapabilities',
    });

    /**
     * This fetches the capabilities doc and parses its contents
     */
    this._capabilitiesPromise = useCache(
      () => parseWmsCapabilities(this._capabilitiesUrl),
      'WMS',
      'CAPABILITIES',
      this._capabilitiesUrl
    ).then(({ info, layers, url, version }) => {
      this._info = info;
      this._layers = layers;
      this._url = url;
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
   * Returns an array of layers in tree structure with summary information.
   * This preserves the WMS hierarchical layer organization.
   * For a flat list, use getLayers() instead.
   */
  getLayersTree() {
    function layerSummaryMapper(layerFull) {
      return {
        title: layerFull.title,
        id: layerFull.id,
        description: layerFull.description,
        ...('children' in layerFull && {
          children: layerFull.children.map(layerSummaryMapper),
        }),
      } as WmsLayerSummary;
    }
    return this._layers.map(layerSummaryMapper);
  }

  /**
   * Returns a flat array of all layers in normalized format.
   * Implements the BaseEndpoint generic interface.
   * @returns Array of layers with extended information
   */
  getLayers(): WmsLayerSummary[] {
    return this.getFlattenedLayers();
  }

  /**
   * Get a specific layer by its identifier in normalized format.
   * Implements the BaseEndpoint generic interface.
   * @param id The layer name (WMS uses 'name' as identifier)
   * @returns Layer with extended information, or null if not found
   */
  getLayerById(id: string): BaseLayerExtended | null {
    return this.getLayerByName(id);
  }

  /**
   * Returns a array of layers in flattened format (WMS-specific summary format).
   * For normalized BaseLayer format, use getLayers() instead.
   */
  getFlattenedLayers() {
    return this.getLayersTree().flatMap(wmsLayerFlatten);
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
      if (layer.id) {
        layers.push(layer);
      }
      if ('children' in layer) {
        layer.children.map(layerLookup);
      }
    }
    this._layers.map(layerLookup);
    if (layers.length === 1) return layers[0].id;
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

  /**
   * Returns a URL that can be used to query an image from one or several layers
   * @param layers List of layers to render
   * @param {Object} options
   * @param {number} options.widthPx
   * @param {number} options.heightPx
   * @param {CrsCode} options.crs Coordinate reference system to use for the image
   * @param {BoundingBox} options.extent Expressed in the requested CRS
   * @param {MimeType} options.outputFormat
   * @param {string} [options.styles] List of styles to use, one for each layer requested; leave out or use empty string for default style
   * @returns Returns null if endpoint is not ready
   */
  getMapUrl(
    layers: string[],
    options: {
      widthPx: number;
      heightPx: number;
      crs: CrsCode;
      extent: BoundingBox;
      outputFormat: MimeType;
      styles?: string[];
    }
  ) {
    if (!this._layers) {
      return null;
    }
    const { widthPx, heightPx, crs, extent, outputFormat, styles } = options;
    // TODO: check supported CRS
    // TODO: check supported output formats
    // TODO: check supported styles
    return generateGetMapUrl(
      this.getOperationUrl('GetMap') || this._capabilitiesUrl,
      this._version,
      layers.join(','),
      widthPx,
      heightPx,
      crs,
      extent,
      outputFormat,
      styles !== undefined ? styles.join(',') : ''
    );
  }

  /**
   * Returns the Capabilities URL of the WMS
   *
   * This is the URL reported by the service if available, otherwise the URL
   * passed to the constructor
   */
  getCapabilitiesUrl() {
    const baseUrl = this.getOperationUrl('GetCapabilities');
    if (!baseUrl) {
      return this._capabilitiesUrl;
    }
    return setQueryParams(baseUrl, {
      SERVICE: 'WMS',
      REQUEST: 'GetCapabilities',
    });
  }

  /**
   * Returns the URL reported by the WMS for the given operation
   * @param operationName e.g. GetMap, GetCapabilities, etc.
   * @param method HTTP method
   */
  getOperationUrl(operationName: OperationName, method: HttpMethod = 'Get') {
    if (!this._url) {
      return null;
    }
    return this._url[operationName]?.[method];
  }
}

function wmsLayerFlatten(layerFull) {
  const layer = {
    title: layerFull.title,
    name: layerFull.name,
    description: layerFull.description,
  };

  return 'children' in layerFull && Array.isArray(layerFull.children)
    ? [layer, ...layerFull.children.flatMap(wmsLayerFlatten)]
    : [layer];
}
