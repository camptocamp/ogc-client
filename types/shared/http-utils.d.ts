/**
 * Returns a promise equivalent to `fetch(url)` but guarded against
 * identical concurrent requests
 * @param {string} url
 * @return {Promise<Response>}
 */
export function sharedFetch(url: string): Promise<Response>;
/**
 * Runs a GET HTTP request to the provided URL and resolves to the
 * XmlDocument
 * @param {string} url
 * @return {Promise<XmlDocument>}
 */
export function queryXmlDocument(url: string): Promise<XmlDocument>;
/**
 * Add or replace query params in the url; note that params are considered case insensitive,
 * meaning that existing params in different cases will be removed as well.
 * Also, if the url ends with an encoded URL (typically in the case of urls run through a CORS
 * proxy, which is an aberration and should be forbidden btw), then the encoded URL
 * will be modified instead.
 * @param {string} url
 * @param {Object.<string, string>} params
 * @returns {string}
 */
export function setQueryParams(url: string, params: {
    [x: string]: string;
}): string;
