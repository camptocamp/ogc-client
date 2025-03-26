// src/tms/parser.ts
import {
  TileMapInfo,
  TileMapService,
  TmsEndpointInfo,
  TileMapReference,
} from './model.js';
import {
  getRootElement,
  findChildElement,
  findChildrenElement,
  getElementText,
  getElementAttribute,
} from '../shared/xml-utils.js';
import { XmlDocument } from '@rgrove/parse-xml';

/**
 * Parses a TMS Service XML string into a TileMapService object.
 */
export function parseTileMapServiceXML(xmlDoc: XmlDocument): TileMapService {
  const root = getRootElement(xmlDoc);

  const title = getElementText(findChildElement(root, 'Title'))?.trim() || '';
  const abstract =
    getElementText(findChildElement(root, 'Abstract'))?.trim() || '';
  const version = getElementAttribute(root, 'version') || '';

  const keywordList = findChildElement(root, 'KeywordList');
  const keywords = keywordList ? [getElementText(keywordList).trim()] : [];

  const tileMapsContainer = findChildElement(root, 'TileMaps');
  const tileMaps = [];

  if (tileMapsContainer) {
    const tileMapEls = findChildrenElement(tileMapsContainer, 'TileMap');

    tileMaps.push(
      ...tileMapEls.map((el) => ({
        title: getElementAttribute(el, 'title') || '',
        srs: getElementAttribute(el, 'srs') || '',
        profile: getElementAttribute(el, 'profile') || '',
        href: getElementAttribute(el, 'href') || '',
      }))
    );
  }

  return { title, abstract, version, keywords, tileMaps };
}

/**
 * Parses an individual TileMap resource XML string into a TileMapInfo object.
 */
export function parseTileMapXML(xmlDoc: XmlDocument): TileMapInfo {
  const root = getRootElement(xmlDoc);

  const title = getElementText(findChildElement(root, 'Title'))?.trim() || '';
  const abstract =
    getElementText(findChildElement(root, 'Abstract'))?.trim() || '';
  const version = getElementAttribute(root, 'version') || '';
  const tileMapService = getElementAttribute(root, 'tilemapservice') || '';
  const srs = getElementText(findChildElement(root, 'SRS'))?.trim() || '';

  const bbEl = findChildElement(root, 'BoundingBox');
  const boundingBox = [
    parseFloat(getElementAttribute(bbEl, 'minx') || '0'),
    parseFloat(getElementAttribute(bbEl, 'miny') || '0'),
    parseFloat(getElementAttribute(bbEl, 'maxx') || '0'),
    parseFloat(getElementAttribute(bbEl, 'maxy') || '0'),
  ] as [number, number, number, number];

  const originEl = findChildElement(root, 'Origin');
  const origin = {
    x: parseFloat(getElementAttribute(originEl, 'x') || '0'),
    y: parseFloat(getElementAttribute(originEl, 'y') || '0'),
  };

  const tfEl = findChildElement(root, 'TileFormat');
  const tileFormat = {
    width: parseInt(getElementAttribute(tfEl, 'width') || '0'),
    height: parseInt(getElementAttribute(tfEl, 'height') || '0'),
    mimeType: getElementAttribute(tfEl, 'mime-type') || '',
    extension: getElementAttribute(tfEl, 'extension') || '',
  };

  const tsEl = findChildElement(root, 'TileSets');
  const tileSets = { profile: '', tileSets: [] as any[] };
  if (tsEl) {
    tileSets.profile = getElementAttribute(tsEl, 'profile') || '';
    const tileSetEls = findChildrenElement(tsEl, 'TileSet');
    tileSets.tileSets = tileSetEls.map((el) => ({
      href: getElementAttribute(el, 'href') || '',
      unitsPerPixel: parseFloat(
        getElementAttribute(el, 'units-per-pixel') || '0'
      ),
      order: parseInt(getElementAttribute(el, 'order') || '0'),
    }));
  }

  const metadataEls = findChildrenElement(root, 'Metadata');
  const metadata = metadataEls.map((el) => ({
    type: getElementAttribute(el, 'type') || '',
    mimeType: getElementAttribute(el, 'mime-type') || '',
    href: getElementAttribute(el, 'href') || '',
  }));

  let attribution = null;
  const attrEl = findChildElement(root, 'Attribution');
  if (attrEl) {
    attribution = {
      title: getElementText(findChildElement(attrEl, 'Title'))?.trim() || '',
      logo: null,
    };
    const logoEl = findChildElement(attrEl, 'Logo');
    if (logoEl) {
      attribution.logo = {
        width: parseInt(getElementAttribute(logoEl, 'width') || '0'),
        height: parseInt(getElementAttribute(logoEl, 'height') || '0'),
        href: getElementAttribute(logoEl, 'href') || '',
        mimeType: getElementAttribute(logoEl, 'mime-type') || '',
      };
    }
  }

  const kwEl = findChildElement(root, 'KeywordList');
  const keywords = kwEl ? [getElementText(kwEl).trim()] : [];

  const wmcEl = findChildElement(root, 'WebMapContext');
  const webMapContext = wmcEl ? getElementAttribute(wmcEl, 'href') || '' : '';

  return {
    title,
    abstract,
    version,
    tileMapService,
    srs,
    boundingBox,
    origin,
    tileFormat,
    tileSets,
    metadata: metadata.length ? metadata : undefined,
    attribution: attribution || undefined,
    webMapContext: webMapContext || undefined,
    keywords: keywords.length ? keywords : undefined,
  };
}

/**
 * Extracts a simplified endpoint info object from the service data.
 */
export function extractEndpointInfo(
  serviceData: TileMapService
): TmsEndpointInfo {
  return {
    title: serviceData.title,
    abstract: serviceData.abstract,
    keywords: serviceData.keywords,
  };
}

/**
 * Extracts an array of TileMap references from the service data.
 */
export function extractTileMapReferences(
  serviceData: TileMapService
): TileMapReference[] {
  return serviceData.tileMaps || [];
}
