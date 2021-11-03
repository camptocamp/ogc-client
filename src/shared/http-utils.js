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
    .catch((error) => {
      throw new EndpointError(error.message, 0, true);
    })
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
