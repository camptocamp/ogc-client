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

  constructor(private baseUrl: string) {}

  private async getServiceData(): Promise<TileMapService> {
    if (!this._serviceData) {
      this._serviceData = fetchRoot(this.baseUrl);
    }
    return this._serviceData;
  }

  private async getFilteredData(): Promise<TileMapService> {
    if (!this._filteredData) {
      const serviceData = await this.getServiceData();
      const tileMapResource = await fetchTileMapResourceXML(this.baseUrl);
      if (tileMapResource) {
        this._filteredData = Promise.resolve({
          ...serviceData,
          tileMaps: serviceData.tileMaps?.filter(
            (tileMap) =>
              normalizeUrl(tileMap.href) === normalizeUrl(this.baseUrl)
          ),
        });
      } else {
        this._filteredData = Promise.resolve(serviceData);
      }
    }
    return this._filteredData;
  }

  /**
   * Retrieves basic information about the TMS endpoint, including
   * title, abstract, and keywords.
   *
   * @returns Promise resolving to the TMS endpoint information
   */
  async getTileMapServiceInfo(): Promise<TmsEndpointInfo> {
    const serviceData = await this.getServiceData();
    return extractEndpointInfo(serviceData);
  }

  /**
   * Retrieves all available tile maps from the TMS service.
   * If the endpoint points to a specific tile map, only that
   * tile map will be returned.
   *
   * @returns Promise resolving to an array of tile map references
   */
  async getAllTileMaps(): Promise<TileMapReference[]> {
    const data = await this.getFilteredData();
    return extractTileMapReferences(data);
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
