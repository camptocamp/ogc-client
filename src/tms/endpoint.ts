import { TileMapLayer } from './models.js';
import { useCache } from '../shared/cache.js';
import { parseTmsCapabilities } from '../worker/index.js';
import { GenericEndpointInfo } from '../shared/models.js';

/**
 * Represents a TMS endpoint advertising several layers.
 */
export default class TmsEndpoint {
  private _capabilitiesPromise: Promise<void>;
  private _layers: TileMapLayer[];
  private _info: GenericEndpointInfo | null;

  /**
   * Creates a new TMS endpoint.
   * @param url TMS endpoint url;
   */
  constructor(url: string) {
    /**
     * This fetches the root doc and parses its contents
     */
    this._capabilitiesPromise = useCache(
      () => parseTmsCapabilities(url),
      'TMS',
      'METADATA',
      url
    ).then(({ info, layers }) => {
      this._layers = layers;
      this._info = info;
    });
  }

  /**
   * Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.
   * @throws {EndpointError}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  getLayers() {
    return this._layers;
  }

  /**
   * A Promise which resolves to the endpoint information.
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns the full layer information.
   * Layer name is case-sensitive.
   * @param href Layer href property (unique in the TMS service)
   * @return return null if layer was not found
   */
  getLayerByHref(href: string): TileMapLayer {
    return this._layers.find(l => l.href === href);
  }
}
