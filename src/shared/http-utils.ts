import { parseXmlString } from './xml-utils.js';
import { EndpointError } from './errors.js';
import { decodeString } from './encoding.js';
import { FetchOptions } from './models.js';
import { XmlDocument } from '@rgrove/parse-xml';

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
  callback: (options: FetchOptions) => void,
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
  asJson?: boolean,
  customAcceptHeader?: string,
) {
  let fetchKey = `${method}#${url}`;
  if (asJson || customAcceptHeader) {
    fetchKey = `${method}#asJson#${url}`;
  }
  if (fetchPromises.has(fetchKey)) {
    return fetchPromises.get(fetchKey);
  }
  const options: RequestInit = { ...getFetchOptions() };
  options.method = method;
  if (customAcceptHeader) {
    options.headers = 'headers' in options ? options.headers : {};
    options.headers['Accept'] = customAcceptHeader;
  } else if (asJson) {
    options.headers = 'headers' in options ? options.headers : {};
    options.headers['Accept'] = 'application/json,application/schema+json';
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
    return resp.clone(); // clone response so that it can be used many times
  });
}

/**
 * Runs a GET HTTP request to the provided URL and resolves to the
 * XmlDocument
 */
export function queryXmlDocument(url: string): Promise<XmlDocument> {
  return sharedFetch(url)
    .catch(() =>
      // attempt a HEAD to see if the failure comes from CORS or the service is generally unreachable
      fetch(url, { ...getFetchOptions(), method: 'HEAD', mode: 'no-cors' })
        .catch((error) => {
          throw new EndpointError(
            `Fetching the document at ${url} failed either due to network errors or unreachable host, error is: ${error.message}`,
            0,
            false,
          );
        })
        .then(() => {
          throw new EndpointError(
            `The document at ${url} could not be fetched due to CORS limitations`,
            0,
            true,
          );
        }),
    )
    .then(async (resp: Response) => {
      if (!resp.ok) {
        const text = await resp.text();
        throw new EndpointError(
          `The document at ${url} could not be fetched, received an error with code ${resp.status}: ${text}`,
          resp.status,
          false,
        );
      }
      const buffer = await resp.arrayBuffer();
      const contentTypeHeader = resp.headers.get('Content-Type');
      return decodeString(buffer, contentTypeHeader);
    })
    .then((xml) => parseXmlString(xml));
}

/**
 * Runs a POST HTTP request with an XML body to the provided URL and resolves
 * to the XmlDocument. Unlike `queryXmlDocument`, this is not guarded against
 * concurrent identical requests (POST is not idempotent) and does not go
 * through `sharedFetch`.
 */
export function postXmlDocument(url: string, body: string) {
  const options: RequestInit = { ...getFetchOptions() };
  options.method = 'POST';
  options.body = body;
  options.headers = {
    ...(options.headers ?? {}),
    'Content-Type': 'application/xml',
  };
  return fetch(url, options)
    .catch(() =>
      // attempt a HEAD to see if the failure comes from CORS or the service is generally unreachable
      fetch(url, { ...getFetchOptions(), method: 'HEAD', mode: 'no-cors' })
        .catch((error) => {
          throw new EndpointError(
            `Fetching the document failed either due to network errors or unreachable host, error is: ${error.message}`,
            0,
            false,
          );
        })
        .then(() => {
          throw new EndpointError(
            `The document could not be fetched due to CORS limitations`,
            0,
            true,
          );
        }),
    )
    .then(async (resp: Response) => {
      if (!resp.ok) {
        const text = await resp.text();
        throw new EndpointError(
          `Received an error with code ${resp.status}: ${text}`,
          resp.status,
          false,
        );
      }
      const buffer = await resp.arrayBuffer();
      const contentTypeHeader = resp.headers.get('Content-Type');
      return decodeString(buffer, contentTypeHeader);
    })
    .then((xml) => parseXmlString(xml));
}

/**
 * Runs a GET HTTP request to the provided URL and resolves to a JSON object
 */
export function queryJsonDocument<T>(url: string): Promise<T> {
  return sharedFetch(url, 'GET', true)
    .catch(() =>
      // attempt a HEAD to see if the failure comes from CORS or the service is generally unreachable
      fetch(url, { ...getFetchOptions(), method: 'HEAD', mode: 'no-cors' })
        .catch((error) => {
          throw new EndpointError(
            `Fetching the document at ${url} failed either due to network errors or unreachable host, error is: ${error.message}`,
            0,
            false,
          );
        })
        .then(() => {
          throw new EndpointError(
            `The document at ${url} could not be fetched due to CORS limitations`,
            0,
            true,
          );
        }),
    )
    .then(async (resp: Response) => {
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `The document at ${url} could not be fetched, received an error with code ${resp.status}: ${text}`,
        );
      }
      return resp
        .clone()
        .json()
        .catch((e) => {
          throw new Error(
            `The document at ${url} does not appear to be valid JSON. Error was: ${e.message}`,
          );
        }) as Promise<T>;
    });
}
