import { OgcApiDocument } from './model';

function fetchDocument(url: string): Promise<OgcApiDocument> {
  const urlObj = new URL(url, window.location.toString());
  urlObj.searchParams.set('f', 'json');
  return fetch(urlObj.toString(), {
    headers: { Accept: 'application/json' },
  }).then((resp) => resp.json());
}

// look for root document?
export function fetchRoot(url: string) {
  return fetchDocument(url);
}

export function fetchLink(doc: OgcApiDocument, relType: string | string[]) {
  const links = doc.links.filter((link) =>
    Array.isArray(relType)
      ? relType.indexOf(link.rel) > -1
      : link.rel === relType
  );
  if (!links.length) return null;
  return fetchDocument(links[0].href);
}

// navigate through links
