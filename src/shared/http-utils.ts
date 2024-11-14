import { parseXmlString } from './xml-utils.js';
import { EndpointError } from './errors.js';
import { decodeString } from './encoding.js';
import { FetchOptions } from './models.js';

const fetchPromises: Map<string, Promise<Response>> = new Map();

let fetchOptions: FetchOptions = {};
let fetchOptionsUpdateCallback: (options: FetchOptions) => void = null;

/**
 * Set advanced options to be used by all fetch() calls
 * @param options
 */
export function setFetchOptions(options: FetchOptions) {
  fetchOptions = options;
  if (fetchOptionsUpdateCallback) fetchOptionsUpdateCallback(options);
}

/**
 * Returns current fetch() options
 */
export function getFetchOptions() {
  return fetchOptions;
}

/**
 * Resets advanced fetch() options to their defaults
 */
export function resetFetchOptions() {
  fetchOptions = {};
  if (fetchOptionsUpdateCallback) fetchOptionsUpdateCallback({});
}

export function setFetchOptionsUpdateCallback(
  callback: (options: FetchOptions) => void
) {
  fetchOptionsUpdateCallback = callback;
}

/**
 * Returns a promise equivalent to `fetch(url)` but guarded against
 * identical concurrent requests
 * Note: this should only be used for GET requests!
 */
export function sharedFetch(
  url: string,
  method: 'GET' | 'HEAD' = 'GET',
  asJson?: boolean
) {
  let fetchKey = `${method}#${url}`;
  if (asJson) {
    fetchKey = `${method}#asJson#${url}`;
  }
  if (fetchPromises.has(fetchKey)) {
    return fetchPromises.get(fetchKey);
  }
  const options: RequestInit = { ...getFetchOptions() };
  options.method = method;
  if (asJson) {
    options.headers = 'headers' in options ? options.headers : {};
    options.headers['Accept'] = 'application/json';
  }
  // to avoid unhandled promise rejections this promise will never reject,
  // but only return errors as a normal value
  const promise = fetch(url, options)
    .catch((e) => e)
    .then((resp) => {
      fetchPromises.delete(fetchKey);
      return resp;
    });
  fetchPromises.set(fetchKey, promise);
  // if an error is received then the promise will reject with it
  return promise.then((resp) => {
    if (resp instanceof Error) throw resp;
    return resp;
  });
}

/**
 * Runs a GET HTTP request to the provided URL and resolves to the
 * XmlDocument
 */
export function queryXmlDocument(url: string) {
  return sharedFetch(url)
    .catch(() =>
      // attempt a HEAD to see if the failure comes from CORS or the service is generally unreachable
      fetch(url, { ...getFetchOptions(), method: 'HEAD', mode: 'no-cors' })
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
    .then(async (resp: Response) => {
      if (!resp.ok) {
        const text = await resp.text();
        throw new EndpointError(
          `Received an error with code ${resp.status}: ${text}`,
          resp.status,
          false
        );
      }
      const buffer = await resp.arrayBuffer();
      const contentTypeHeader = resp.headers.get('Content-Type');
      return decodeString(buffer, contentTypeHeader);
    })
    .then((xml) => parseXmlString(xml));
}

/**
 * Add or replace query params in the url; note that params are considered case-insensitive,
 * meaning that existing params in different cases will be removed as well.
 * Also, if the url ends with an encoded URL (typically in the case of urls run through a CORS
 * proxy, which is an aberration and should be forbidden btw), then the encoded URL
 * will be modified instead.
 */
export function setQueryParams(
  url: string,
  params: Record<string, string | boolean>
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
  keys.forEach((key) =>
    urlObj.searchParams.set(
      key,
      params[key] === true ? '' : (params[key] as string)
    )
  );
  return urlObj.toString();
}
