import { OgcApiDocument } from './model.js';
import { EndpointError } from '../shared/errors.js';
import { getFetchOptions } from '../shared/http-utils.js';

export function fetchDocument<T extends OgcApiDocument>(
  url: string
): Promise<T> {
  const urlObj = new URL(url, window.location.toString());
  urlObj.searchParams.set('f', 'json');
  const options = getFetchOptions();
  const optionsHeaders = 'headers' in options ? options.headers : {};
  return fetch(urlObj.toString(), {
    ...options,
    headers: { ...optionsHeaders, Accept: 'application/json' },
  }).then((resp) => resp.json() as Promise<T>);
}

export function fetchRoot(url: string): Promise<OgcApiDocument> {
  return fetchDocument(url).then((doc) => {
    // if no data link, attempt to look at the parent
    if (
      !hasLinks(doc, ['data', 'http://www.opengis.net/def/rel/ogc/1.0/data']) &&
      hasLinks(doc, ['self'])
    ) {
      return fetchRoot(getParentPath(url));
    }
    return doc;
  });
}

// This will look for a collection document on the given path
// Will return null if we end up on the endpoint root before finding a collection
export function fetchCollectionRoot(
  url: string
): Promise<OgcApiDocument | null> {
  return fetchDocument(url).then((doc) => {
    // this looks like the root; return null
    if (
      hasLinks(doc, ['data', 'http://www.opengis.net/def/rel/ogc/1.0/data'])
    ) {
      return null;
    }
    // this looks like a collection; return it
    if (hasLinks(doc, ['items'])) {
      return doc;
    }
    return fetchCollectionRoot(getParentPath(url));
  });
}

export function getLinkUrl(
  doc: OgcApiDocument,
  relType: string | string[],
  baseUrl?: string
): string {
  const links = doc.links.filter((link) =>
    Array.isArray(relType)
      ? relType.indexOf(link.rel) > -1
      : link.rel === relType
  );
  if (!links.length) return null;
  return new URL(
    links[0].href,
    baseUrl || window.location.toString()
  ).toString();
}

export function fetchLink(
  doc: OgcApiDocument,
  relType: string | string[],
  baseUrl?: string
): Promise<OgcApiDocument> {
  const url = getLinkUrl(doc, relType, baseUrl);
  console.log(url)
  if (!url)
    return Promise.reject(
      new EndpointError(`Could not find link with type: ${relType}`)
    );
  return fetchDocument(url);
}

export function hasLinks(
  doc: OgcApiDocument,
  relType: string | string[]
): boolean {
  const url = getLinkUrl(doc, relType);
  return !!url;
}

export function assertHasLinks(
  doc: OgcApiDocument,
  relType: string | string[]
) {
  if (!hasLinks(doc, relType))
    throw new EndpointError(`Could not find link with type: ${relType}`);
}

export function getParentPath(url: string): string {
  const urlObj = new URL(url, window.location.toString());
  const pathParts = urlObj.pathname.split('/');
  if (pathParts.length <= 2) {
    throw new EndpointError(
      'Could not find the root document, this might not be a valid OGC API endpoint'
    );
  }
  urlObj.pathname = pathParts.slice(0, -1).join('/');
  return urlObj.toString();
}
