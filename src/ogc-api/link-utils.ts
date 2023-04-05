import { OgcApiDocument } from './model';
import { EndpointError } from '../shared/errors';

export function fetchDocument(url: string): Promise<OgcApiDocument> {
  const urlObj = new URL(url, window.location.toString());
  urlObj.searchParams.set('f', 'json');
  return fetch(urlObj.toString(), {
    headers: { Accept: 'application/json' },
  }).then((resp) => resp.json());
}

export function fetchRoot(url: string) {
  return fetchDocument(url);
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

export function assertHasLinks(
  doc: OgcApiDocument,
  relType: string | string[]
) {
  const url = getLinkUrl(doc, relType);
  if (!url)
    throw new EndpointError(`Could not find link with type: ${relType}`);
}
