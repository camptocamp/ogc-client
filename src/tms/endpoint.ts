import { TileMapLayer } from './models';
import { useCache } from '../shared/cache.js';
import { parseTmsService } from '../worker/index.js';
import { GenericEndpointInfo } from '../shared/models';

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
      () => parseTmsService(url),
      'TMS',
      'METADATA',
      url
    ).then(({ layers }) => {
      this._layers = layers;
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
}
