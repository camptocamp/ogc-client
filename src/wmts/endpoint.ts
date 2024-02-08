import { MimeType } from '../shared/models';
import { setQueryParams } from '../shared/http-utils';
import { useCache } from '../shared/cache';
import { parseWmtsCapabilities } from '../worker';
import {
  WmtsLayerDimensionValue,
  WmtsLayerResourceLink,
  WmtsEndpointInfo,
  WmtsLayer,
  WmtsMatrixSet,
} from './model';
import { generateGetTileUrl } from './url';
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
   * @throws {EndpointError}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  getServiceInfo() {
    return this._info;
  }

  getLayers() {
    return this._layers;
  }

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

  getLayerResourceUrl(
    layerName: string,
    formatHint?: MimeType
  ): WmtsLayerResourceLink {
    if (!this._layers) return null;
    const layer = this.getLayerByName(layerName);
    let resourceUrlIndex = 0;
    if (formatHint) {
      resourceUrlIndex =
        layer.resourceUrls.findIndex(
          (resourceUrl) => resourceUrl.format === formatHint
        ) || 0;
    }
    const resourceUrl = layer.resourceUrls[resourceUrlIndex];
    if (formatHint && resourceUrl.format !== formatHint) {
      console.warn(
        `[ogc-client] Requested '${formatHint}' format for the WMTS layer but it is not available in REST encoding, falling back to '${resourceUrl.format}'`
      );
    }
    return resourceUrl;
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
    const resourceUrl = this.getLayerResourceUrl(layerName, outputFormat);
    return generateGetTileUrl(
      resourceUrl.url,
      resourceUrl.encoding,
      layerName,
      styleName,
      matrixSetName,
      tileMatrix,
      tileRow,
      tileCol,
      resourceUrl.format
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

  tileGridModule: Promise<typeof import('./ol-tilegrid')>;

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
    return this.tileGridModule.then(({ buildOpenLayersTileGrid }) =>
      buildOpenLayersTileGrid(matrixSet, matrixSetLink.limits)
    );
  }
}
