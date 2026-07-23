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

/**
 * Add, replace or remove query params in the url; note that params are considered case-insensitive,
 * meaning that existing params in different cases will be impacted as well.
 * Also, if the url ends with an encoded URL (typically in the case of urls run through a CORS
 * proxy, which is an aberration and should be forbidden btw), then the encoded URL
 * will be modified instead.
 * Params set to `null` will be removed.
 */
export function setQueryParams(
  url: string,
  params: Record<string, string | boolean | null>
): string {
  const encodedUrlMatch = url.match(/(https?%3A%2F%2F[^/]+)$/);
  if (encodedUrlMatch) {
    const encodedUrl = encodedUrlMatch[1];
    const modifiedUrl = setQueryParams(decodeURIComponent(encodedUrl), params);
    return url.replace(encodedUrl, encodeURIComponent(modifiedUrl));
  }

  const urlObj = new URL(url);
  const keys = Object.keys(params);
  const keysLower = keys.map((key) => key.toLowerCase());
  const toDelete = [];
  for (const param of urlObj.searchParams.keys()) {
    if (keysLower.indexOf(param.toLowerCase()) > -1) {
      toDelete.push(param);
    }
  }
  toDelete.map((param) => urlObj.searchParams.delete(param));
  keys.forEach((key) => {
    if (params[key] === null) return;
    urlObj.searchParams.set(
      key,
      params[key] === true ? '' : (params[key] as string)
    );
  });
  // this makes sure that the request will work on GeoServer (some versions fail if there is a "+" in the encoded query params)
  urlObj.search = urlObj.search.replace(/\+/g, '%20');
  return urlObj.toString();
}
