import { OgcApiDocument, OgcApiDocumentLink } from './model.js';
import { EndpointError } from '../shared/errors.js';
import { sharedFetch } from '../shared/http-utils.js';
import { getParentPath } from '../shared/url-utils.js';

export function fetchDocument<T extends OgcApiDocument>(
  url: string
): Promise<T> {
  const urlObj = new URL(url, window.location.toString());
  urlObj.searchParams.set('f', 'json');
  return sharedFetch(urlObj.toString(), 'GET', true).then((resp) => {
    if (!resp.ok) {
      throw new Error(`The document at ${urlObj} could not be fetched.`);
    }
    return resp
      .clone()
      .json()
      .catch((e) => {
        throw new Error(
          `The document at ${urlObj} does not appear to be valid JSON. Error was: ${e.message}`
        );
      }) as Promise<T>;
  });
}

export function fetchRoot(url: string): Promise<OgcApiDocument> {
  return fetchDocument(url).then((doc) => {
    // if no data link, attempt to look at the parent
    if (
      !hasLinks(doc, ['data', 'http://www.opengis.net/def/rel/ogc/1.0/data']) ||
      !hasLinks(doc, [
        'conformance',
        'http://www.opengis.net/def/rel/ogc/1.0/conformance',
      ])
    ) {
      const parentUrl = getParentPath(url);
      if (!parentUrl) {
        throw new Error(
          `Could not find a root JSON document containing both a link with rel='data' and a link with rel='conformance'.`
        );
      }
      return fetchRoot(parentUrl);
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
    let parentUrl = getParentPath(url);
    // this looks like a collection; return it
    if (hasLinks(doc, ['items'])) {
      return doc;
    }
    // if there is a collections array, we expect the parent path to end with slash
    if ('collections' in doc) {
      const urlObj = new URL(parentUrl);
      if (!urlObj.pathname.endsWith('/')) {
        urlObj.pathname = `${urlObj.pathname}/`;
      }
      parentUrl = urlObj.toString();
    }
    return fetchCollectionRoot(parentUrl);
  });
}

export function getLinks(
  doc: OgcApiDocument,
  relType: string | string[],
  mimeType?: string,
  assertPresence?: boolean
): OgcApiDocumentLink[] {
  let links =
    doc.links?.filter((link) =>
      Array.isArray(relType)
        ? relType.indexOf(link.rel) > -1
        : link.rel === relType
    ) || [];
  if (mimeType) {
    links = links.filter((link) => link.type === mimeType);
  }
  if (assertPresence && links.length === 0) {
    if (!mimeType) {
      throw new EndpointError(
        `Was expecting at least one link of type '${relType}' but could not find any`
      );
    }
    throw new EndpointError(
      `Was expecting at least one link of type '${relType}' with mime type '${mimeType}' but could not find any`
    );
  }
  return links;
}

export function getLinkUrl(
  doc: OgcApiDocument,
  relType: string | string[],
  baseUrl?: string,
  mimeType?: string,
  assertPresence?: boolean
): string | null {
  const link = getLinks(doc, relType, mimeType, assertPresence)[0];
  if (!link) return null;
  return new URL(link.href, baseUrl || window.location.toString()).toString();
}

export async function fetchLink(
  doc: OgcApiDocument,
  relType: string | string[],
  baseUrl?: string
): Promise<OgcApiDocument> {
  // this will reject with an error if no valid URL found
  const url = getLinkUrl(doc, relType, baseUrl, undefined, true);
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
