import { TileMapLayer, TileMapLayerDetails, TileMapMetadata } from './models.js';
import { useCache } from '../shared/cache.js';
import { parseTmsCapabilities } from '../worker/index.js';
import { GenericEndpointInfo } from '../shared/models.js';
import { queryXmlDocument } from '../shared/http-utils.js';
import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement
} from '../shared/xml-utils.js';
import { XmlDocument } from '@rgrove/parse-xml';

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

  /**
   * Fetches and parses detailed layer information including metadata from the TMS layer XML.
   * @param href Layer href property (unique in the TMS service)
   * @return A Promise that resolves to the detailed layer information, or null if the layer was not found
   */
  async getLayerDetails(href: string): Promise<TileMapLayerDetails | null> {
    const baseLayer = this.getLayerByHref(href);
    if (!baseLayer) {
      return null;
    }

    try {
      // Fetch the TileMap XML document
      const tileMapDoc = await queryXmlDocument(href);
      getRootElement(tileMapDoc);
// Extract the metadata
      const layerDetails: TileMapLayerDetails = {
        ...baseLayer,
        metadata: parseMetadata(tileMapDoc),
        bounds: parseBoundingBox(tileMapDoc),
        tileFormat: parseTileFormat(tileMapDoc),
        tileSets: parseTileSets(tileMapDoc)
      };

      return layerDetails;
    } catch (error) {
      console.error('Error fetching TileMap details:', error);
      return baseLayer;
    }
  }
}

/**
 * Parses metadata elements from a TileMap XML document
 */
function parseMetadata(tileMapDoc: XmlDocument): TileMapMetadata[] {
  const metadata: TileMapMetadata[] = [];
  const metadataElements = findChildrenElement(getRootElement(tileMapDoc), 'Metadata');

  for (const mdElement of metadataElements) {
    metadata.push({
      type: getElementAttribute(mdElement, 'type'),
      mimeType: getElementAttribute(mdElement, 'mime-type'),
      href: getElementAttribute(mdElement, 'href')
    });
  }

  return metadata;
}

/**
 * Parses the bounding box information from a TileMap XML document
 */
function parseBoundingBox(tileMapDoc: XmlDocument) {
  const bboxElement = findChildElement(getRootElement(tileMapDoc), 'BoundingBox');
  if (!bboxElement) {
    return undefined;
  }

  return {
    crs: getElementAttribute(bboxElement, 'CRS'),
    minx: parseFloat(getElementAttribute(bboxElement, 'minx')),
    miny: parseFloat(getElementAttribute(bboxElement, 'miny')),
    maxx: parseFloat(getElementAttribute(bboxElement, 'maxx')),
    maxy: parseFloat(getElementAttribute(bboxElement, 'maxy'))
  };
}

/**
 * Parses the tile format information from a TileMap XML document
 */
function parseTileFormat(tileMapDoc: XmlDocument) {
  const formatElement = findChildElement(getRootElement(tileMapDoc), 'TileFormat');
  if (!formatElement) {
    return undefined;
  }

  return {
    width: parseInt(getElementAttribute(formatElement, 'width')),
    height: parseInt(getElementAttribute(formatElement, 'height')),
    mimeType: getElementAttribute(formatElement, 'mime-type'),
    extension: getElementAttribute(formatElement, 'extension')
  };
}

/**
 * Parses the tile sets information from a TileMap XML document
 */
function parseTileSets(tileMapDoc: XmlDocument) {
  const tileSetsElements = findChildrenElement(getRootElement(tileMapDoc), 'TileSet');
  if (tileSetsElements.length === 0) {
    // Try to find TileSets inside a nested TileMap element
    const tileMapElement = findChildElement(getRootElement(tileMapDoc), 'TileMap');
    if (tileMapElement) {
      tileSetsElements.push(...findChildrenElement(tileMapElement, 'TileSet'));
    }
  }

  return tileSetsElements.map(tileSetElement => ({
    href: getElementAttribute(tileSetElement, 'href'),
    order: parseInt(getElementAttribute(tileSetElement, 'order')),
    unitsPerPixel: parseFloat(getElementAttribute(tileSetElement, 'units-per-pixel')),
    minRow: getElementAttribute(tileSetElement, 'minrow') ?
      parseInt(getElementAttribute(tileSetElement, 'minrow')) : undefined,
    maxRow: getElementAttribute(tileSetElement, 'maxrow') ?
      parseInt(getElementAttribute(tileSetElement, 'maxrow')) : undefined,
    minCol: getElementAttribute(tileSetElement, 'mincol') ?
      parseInt(getElementAttribute(tileSetElement, 'mincol')) : undefined,
    maxCol: getElementAttribute(tileSetElement, 'maxcol') ?
      parseInt(getElementAttribute(tileSetElement, 'maxcol')) : undefined
  }));
}
