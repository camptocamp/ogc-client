import { MimeType } from '../shared/models.js';
import { setQueryParams } from '../shared/http-utils.js';
import { useCache } from '../shared/cache.js';
import { parseWmtsCapabilities } from '../worker/index.js';
import {
  WmtsEndpointInfo,
  WmtsLayer,
  WmtsLayerDimensionValue,
  WmtsLayerResourceLink,
  WmtsMatrixSet,
} from './model.js';
import { generateGetTileUrl } from './url.js';
import type WMTSTileGrid from 'ol/tilegrid/WMTS';

/**
 * Represents a WMTS endpoint advertising several layers.
 */
export default class WmtsEndpoint {
  private _capabilitiesPromise: Promise<void>;
  private _info: WmtsEndpointInfo = null;
  private _layers: WmtsLayer[] = null;
  private _matrixSets: WmtsMatrixSet[] = null;

  /**
   * Creates a new WMTS endpoint; wait for the `isReady()` promise before using the endpoint methods.
   * @param url WMTS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url: string) {
    const capabilitiesUrl = setQueryParams(url, {
      SERVICE: 'WMTS',
      REQUEST: 'GetCapabilities',
    });

    /**
     * This fetches the capabilities doc and parses its contents
     */
    this._capabilitiesPromise = useCache(
      () => parseWmtsCapabilities(capabilitiesUrl),
      'WMTS',
      'CAPABILITIES',
      capabilitiesUrl
    ).then(({ info, layers, matrixSets }) => {
      this._info = info;
      this._layers = layers;
      this._matrixSets = matrixSets;
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
   * A Promise which resolves to the endpoint information.
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns the layers advertised in the endpoint.
   */
  getLayers() {
    return this._layers;
  }

  /**
   * Returns the matrix sets available for that endpoint. Each matrix set contains a list of tile matrices as well as a supported CRS.
   */
  getMatrixSets() {
    return this._matrixSets;
  }

  /**
   * Returns a matrix set by identifier
   * @param identifier Matrix set identifier
   * @return return null if matrix set was not found
   */
  getMatrixSetByIdentifier(identifier: string): WmtsMatrixSet {
    if (!this._matrixSets) return null;
    return (
      this._matrixSets.find(
        (matrixSet) => matrixSet.identifier === identifier
      ) ?? null
    );
  }

  /**
   * Returns a complete layer based on its name
   * Note: the first matching layer will be returned
   * @param name Layer name property
   * @return return null if layer was not found
   */
  getLayerByName(name: string): WmtsLayer {
    if (!this._layers) return null;
    return this._layers.find((layer) => layer.name === name) ?? null;
  }

  /**
   * If only one single layer is available, return its name; otherwise, returns null;
   */
  getSingleLayerName(): string | null {
    if (!this._layers) return null;
    if (this._layers.length === 1) return this._layers[0].name;
    return null;
  }

  /**
   * Returns a layer resource link. If no type hint is specified, the first resource will be returned.
   * A resource link contains a URL as well as an image format and a request encoding (KVP or REST).
   * @param layerName
   * @param formatHint
   */
  getLayerResourceLink(
    layerName: string,
    formatHint?: MimeType
  ): WmtsLayerResourceLink {
    if (!this._layers) return null;
    const layer = this.getLayerByName(layerName);
    let resourceLinkIndex = 0;
    if (formatHint) {
      resourceLinkIndex =
        layer.resourceLinks.findIndex(
          (resourceLink) => resourceLink.format === formatHint
        ) || 0;
    }
    const resourceLink = layer.resourceLinks[resourceLinkIndex];
    if (formatHint && resourceLink.format !== formatHint) {
      console.warn(
        `[ogc-client] Requested '${formatHint}' format for the WMTS layer but it is not available in REST encoding, falling back to '${resourceLink.format}'`
      );
    }
    return resourceLink;
  }

  /**
   * Generates a URL for a specific tile of a specific layer
   */
  getTileUrl(
    layerName: string,
    styleName: string,
    matrixSetName: string,
    tileMatrix: string,
    tileRow: number,
    tileCol: number,
    outputFormat?: MimeType
  ): string {
    if (!this._layers) return null;
    const resourceLink = this.getLayerResourceLink(layerName, outputFormat);
    return generateGetTileUrl(
      resourceLink.url,
      resourceLink.encoding,
      layerName,
      styleName,
      matrixSetName,
      tileMatrix,
      tileRow,
      tileCol,
      resourceLink.format
    );
  }

  /**
   * Return an object with all defined dimensions for the layer, as well as their default values.
   * @param layerName
   */
  getDefaultDimensions(
    layerName: string
  ): Record<string, WmtsLayerDimensionValue> {
    if (!this._layers) return null;
    const layer = this.getLayerByName(layerName);
    if (!layer.dimensions) return {};
    return layer.dimensions.reduce(
      (prev, curr) => ({ ...prev, [curr.identifier]: curr.defaultValue }),
      {}
    );
  }

  private tileGridModule: Promise<typeof import('./ol-tilegrid')>;

  /**
   * Creates a WMTSTileGrid instance from the 'ol' package, for a given layer. Optionally, a matrix set
   * can be provided;
   * @param layerName
   * @param matrixSetIdentifier
   */
  getOpenLayersTileGrid(
    layerName: string,
    matrixSetIdentifier?: string
  ): Promise<WMTSTileGrid | null> {
    if (!this._layers) return null;
    if (!this.tileGridModule) {
      this.tileGridModule = import('./ol-tilegrid').catch((e) => {
        console.warn(
          `[ogc-client] Cannot use getOpenLayersTileGrid, the 'ol' package is probably not available.\n`,
          e
        );
        return null;
      });
    }
    const layer = this.getLayerByName(layerName);
    const matrixSetLink =
      layer.matrixSets.find(
        (matrixSet) => matrixSet.identifier === matrixSetIdentifier
      ) ?? layer.matrixSets[0];
    const matrixSet = this.getMatrixSetByIdentifier(matrixSetLink.identifier);
    return this.tileGridModule.then((olTileGridModule) => {
      if (!olTileGridModule) return null;
      return olTileGridModule.buildOpenLayersTileGrid(
        matrixSet,
        matrixSetLink.limits
      );
    });
  }
}
