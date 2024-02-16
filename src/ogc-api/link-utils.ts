import { OgcApiDocument } from './model';
import { EndpointError } from '../shared/errors';
import { getFetchOptions } from '../shared/http-utils';

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

export function fetchRoot(url: string) {
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
) {
  const url = getLinkUrl(doc, relType, baseUrl);
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
  return pathParts.slice(0, -1).join('/');
}
