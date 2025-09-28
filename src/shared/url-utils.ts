/**
 * Returns the base url of the given url
 *
 * @param url - the url to get the base url from
 * @returns the base url
 */
export function getBaseUrl(url?: string): string | URL {
  if (url && typeof url === 'string') {
    return new URL(url);
  }

  if ('location' in globalThis && typeof globalThis.location === 'object') {
    return globalThis.location.toString();
  }

  return new URL('http://localhost');
}

/**
 * Returns the parent path from a URL based on a version pattern (x.y.z).
 */
export function getParentPath(url: string): string | null {
  const urlObj = new URL(url, getBaseUrl());
  let pathParts = urlObj.pathname.split('/');
  if (pathParts.length <= 2) {
    // cannot go further up
    return null;
  }
  if (pathParts[pathParts.length - 1] === '') {
    pathParts = pathParts.slice(0, -1); // remove trailing slash if present
  }
  pathParts = pathParts.slice(0, -1); // remove last part to go one level up
  if (pathParts.length === 2 && pathParts[1] !== '') {
    // push a trailing slash if we're on the "app context" part of the url
    pathParts.push('');
  }
  urlObj.pathname = pathParts.join('/');
  return urlObj.toString();
}

/**
 * Appends a new fragment to the URL's path
 */
export function getChildPath(url: string, childFragment: string): string {
  const urlObj = new URL(url, getBaseUrl());
  if (urlObj.pathname.endsWith('/')) {
    urlObj.pathname += childFragment;
  } else {
    urlObj.pathname += `/${childFragment}`;
  }
  return urlObj.toString();
}
