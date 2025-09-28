import { sharedFetch } from '../shared/http-utils.js';
import { parseTileMapServiceXML, parseTileMapXML } from './parser.js';
import { TileMapInfo, TileMapService } from './model.js';
import { XmlDocument } from '@rgrove/parse-xml';
import { getRootElement, parseXmlString } from '../shared/xml-utils.js';
import { getParentPath, getBaseUrl } from '../shared/url-utils.js';

const MAX_DEPTH = 3;

/**
 * Fetches the XML string from a URL.
 */
export async function fetchXml(url: string): Promise<XmlDocument> {
  const urlObj = new URL(url, getBaseUrl());
  const resp = await sharedFetch(urlObj.toString(), 'GET', true);
  if (!resp.ok) {
    throw new Error(`The document at ${urlObj} could not be fetched.`);
  }
  const text = await resp.clone().text();
  return parseXmlString(text);
}

/**
 * Recursively fetch the TMS root document.
 */
export async function fetchRoot(
  url: string,
  currentDepth = 0
): Promise<TileMapService> {
  if (currentDepth > MAX_DEPTH) {
    throw new Error(
      'Maximum recursion depth reached while searching for TMS root document.'
    );
  }
  const xmlDoc = await fetchXml(url);
  const root = getRootElement(xmlDoc);
  if (root.name === 'TileMapService') {
    return parseTileMapServiceXML(xmlDoc);
  }

  const parentUrl = getParentPath(url);
  if (!parentUrl || parentUrl === url) {
    throw new Error(
      'Could not find a valid TMS root document with a <TileMapService> element.'
    );
  }
  return fetchRoot(parentUrl, currentDepth + 1);
}

/**
 * Recursively fetch a TileMap resource XML.
 */
export async function fetchTileMapResourceXML(
  url: string,
  currentDepth = 0
): Promise<TileMapInfo | null> {
  if (currentDepth > MAX_DEPTH) {
    throw new Error(
      'Maximum recursion depth reached while searching for TMS TileMap document.'
    );
  }
  const xmlDoc = await fetchXml(url);
  const root = getRootElement(xmlDoc);
  if (root.name === 'TileMapService') {
    return null;
  }
  if (root.name === 'TileMap') {
    return parseTileMapXML(xmlDoc);
  }
  const parentUrl = getParentPath(url);
  if (!parentUrl) {
    throw new Error('Could not find a valid TileMap document.');
  }
  return fetchTileMapResourceXML(parentUrl, currentDepth + 1);
}

/**
 * Normalizes a URL by ensuring trailing slashes and converting the hostname to lowercase.
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, getBaseUrl());
    if (!urlObj.pathname.endsWith('/')) {
      urlObj.pathname += '/';
    }
    urlObj.hostname = urlObj.hostname.toLowerCase();
    return urlObj.toString();
  } catch (err) {
    return url;
  }
}
