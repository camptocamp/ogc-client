import { sharedFetch } from '../shared/http-utils.js';
import { parseTileMapServiceXML, parseTileMapXML } from './parser.js';
import { TileMapInfo, TileMapService } from './model.js';

const MAX_DEPTH = 3;

/**
 * Fetches the XML string from a URL.
 */
export async function fetchXml(url: string): Promise<string> {
  const urlObj = new URL(url, window.location.toString());
  const resp = await sharedFetch(urlObj.toString(), 'GET', true);
  if (!resp.ok) {
    throw new Error(`The document at ${urlObj} could not be fetched.`);
  }
  const text = await resp.clone().text();
  if (!text.trim().startsWith('<?xml') && !text.trim().startsWith('<')) {
    throw new Error(
      `The document at ${urlObj} does not appear to be valid XML.`
    );
  }
  return text;
}

/**
 * Returns the parent path from a URL based on a version pattern (x.y.z).
 */
export function getParentPath(url: string): string | null {
  const urlObj = new URL(url, window.location.toString());
  const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
  const versionIndex = pathParts.findIndex((part) =>
    /^\d+\.\d+\.\d+$/.test(part)
  );
  if (versionIndex === -1) return null;
  if (versionIndex === pathParts.length - 1) return urlObj.toString();
  urlObj.pathname = pathParts.slice(0, versionIndex + 1).join('/') + '/';
  return urlObj.toString();
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
  const xmlString = await fetchXml(url);
  if (xmlString.includes('<TileMapService')) {
    return parseTileMapServiceXML(xmlString);
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
  const xmlString = await fetchXml(url);
  if (xmlString.includes('<TileMapService')) {
    return null;
  }
  if (xmlString.includes('<TileMap')) {
    return parseTileMapXML(xmlString);
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
    const urlObj = new URL(url, window.location.toString());
    if (!urlObj.pathname.endsWith('/')) {
      urlObj.pathname += '/';
    }
    urlObj.hostname = urlObj.hostname.toLowerCase();
    return urlObj.toString();
  } catch (err) {
    return url;
  }
}
