import { parseXmlString } from './xml-utils';
import { EndpointError } from './errors';

/**
 * @type {Map<string, Promise<Response>>}
 */
const fetchPromises = new Map();

/**
 * Returns a promise equivalent to `fetch(url)` but guarded against
 * identical concurrent requests
 * @param {string} url
 * @return {Promise<Response>}
 */
export function sharedFetch(url) {
  if (fetchPromises.has(url)) {
    return fetchPromises.get(url);
  }
  const promise = fetch(url);
  promise.finally(() => fetchPromises.delete(url));
  fetchPromises.set(url, promise);
  return promise;
}

/**
 * Runs a GET HTTP request to the provided URL and resolves to the
 * XmlDocument
 * @param {string} url
 * @return {Promise<XmlDocument>}
 */
export function queryXmlDocument(url) {
  return sharedFetch(url)
    .catch(() =>
      // attempt a HEAD to see if the failure comes from CORS or the service is generally unreachable
      fetch(url, { method: 'HEAD', mode: 'no-cors' })
        .catch((error) => {
          throw new EndpointError(
            `Fetching the document failed either due to network errors or unreachable host, error is: ${error.message}`,
            0,
            false
          );
        })
        .then(() => {
          throw new EndpointError(
            `The document could not be fetched due to CORS limitations`,
            0,
            true
          );
        })
    )
    .then(async (resp) => {
      const text = await resp.text();
      if (!resp.ok) {
        throw new EndpointError(
          `Received an error with code ${resp.status}: ${text}`,
          resp.status,
          false
        );
      }
      return text;
    })
    .then((xml) => parseXmlString(xml));
}
