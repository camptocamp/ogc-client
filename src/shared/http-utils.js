import { parseXmlString } from './xml-utils';
import { EndpointError } from './errors';

/**
 * Runs a GET HTTP request to the provided URL and resolves to the
 * XmlDocument
 * @param {string} url
 * @return {Promise<XmlDocument>}
 */
export function queryXmlDocument(url) {
  return fetch(url)
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
