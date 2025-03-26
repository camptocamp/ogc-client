import {
  TileMapInfo,
  TileMapService,
  TmsEndpointInfo,
  TileMapReference,
} from './model.js';
import {
  fetchRoot,
  fetchTileMapResourceXML,
  normalizeUrl,
} from './link-utils.js';
import { extractEndpointInfo, extractTileMapReferences } from './parser.js';

/**
 * Represents a TMS (Tile Map Service) endpoint for accessing tile map services.
 * Handles fetching and processing TMS data from a given URL.
 */
export default class TmsEndpoint {
  private _serviceData?: Promise<TileMapService>;
  private _filteredData?: Promise<TileMapService>;
  private _tileMapServiceInfo?: Promise<TmsEndpointInfo>;
  private _tileMaps?: Promise<TileMapReference[]>;

  constructor(private baseUrl: string) {}

  private get serviceData(): Promise<TileMapService> {
    if (!this._serviceData) {
      this._serviceData = fetchRoot(this.baseUrl);
    }
    return this._serviceData;
  }

  private get filteredData(): Promise<TileMapService> {
    if (!this._filteredData) {
      this._filteredData = this.serviceData.then(async (serviceData) => {
        const tileMapResource = await fetchTileMapResourceXML(this.baseUrl);
        if (tileMapResource) {
          return {
            ...serviceData,
            tileMaps: serviceData.tileMaps?.filter(
              (tileMap) =>
                normalizeUrl(tileMap.href) === normalizeUrl(this.baseUrl)
            ),
          };
        } else {
          return serviceData;
        }
      });
    }
    return this._filteredData;
  }

  /**
   * Retrieves basic information about the TMS endpoint, including
   * title, abstract, and keywords.
   *
   * @returns Promise resolving to the TMS endpoint information
   */
  get tileMapServiceInfo(): Promise<TmsEndpointInfo> {
    if (!this._tileMapServiceInfo) {
      this._tileMapServiceInfo = this.serviceData.then(extractEndpointInfo);
    }
    return this._tileMapServiceInfo;
  }

  /**
   * Retrieves all available tile maps from the TMS service.
   * If the endpoint points to a specific tile map, only that
   * tile map will be returned.
   *
   * @returns Promise resolving to an array of tile map references
   */
  get tileMaps(): Promise<TileMapReference[]> {
    if (!this._tileMaps) {
      this._tileMaps = this.filteredData.then(extractTileMapReferences);
    }
    return this._tileMaps;
  }

  /**
   * Retrieves detailed information about a specific tile map.
   *
   * @param href The URL of the tile map resource to retrieve
   * @returns Promise resolving to the detailed tile map information
   * @throws Error if the tile map resource cannot be found
   */
  async getTileMapInfo(href: string): Promise<TileMapInfo> {
    const tileMapInfo = await fetchTileMapResourceXML(href);
    if (!tileMapInfo) {
      throw new Error(`TileMap resource not found for URL: ${href}`);
    }
    return tileMapInfo;
  }
}
