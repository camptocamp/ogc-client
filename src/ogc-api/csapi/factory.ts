import CSAPIQueryBuilder from './url_builder.js';
import type { CSAPICollectionRef } from './model.js';

/**
 * Constructs a {@link CSAPIQueryBuilder} from pre-resolved collection
 * metadata and resource URLs.
 *
 * Pure factory: no I/O, no `await`, no error wrapping. Network-aware
 * composition lives in {@link OgcApiEndpoint.csapi} (the discoverable
 * entry point); this standalone factory is the value-shaped form for
 * tests and advanced consumers who already hold the inputs.
 *
 * **URL builder, not HTTP client.** The returned builder produces URL
 * strings via its `get*()` methods — the consumer is responsible for the
 * `fetch()` call (auth headers, timeouts, retries, `AbortSignal`, error
 * handling) and for handing the parsed JSON body to the matching parser
 * function. See the {@link module:csapi | csapi module docblock} for the
 * full 5-step request pattern.
 *
 * @param collection - Collection descriptor with `id`, optional `title`,
 *   and the `links` array discovered from the collection document.
 * @param resourceUrls - Map of `CSAPIResourceType` → URL produced by
 *   `scanCsapiLinks(rootDoc.links)`.
 * @returns A configured {@link CSAPIQueryBuilder}.
 *
 * @example
 * ```ts
 * import { OgcApiEndpoint } from '@camptocamp/ogc-client';
 * import { parseDatastream } from '@camptocamp/ogc-client/csapi';
 *
 * const endpoint = new OgcApiEndpoint('https://api.example.com');
 * // Preferred: use the discoverable entry point on the endpoint.
 * const builder = await endpoint.csapi('weather-stations');
 *
 * // 1. Builder → URL string (no network call here)
 * const url = builder.getDatastreams({ limit: 50 });
 *
 * // 2. Consumer owns the fetch — auth, timeouts, retries, etc.
 * const response = await fetch(url, {
 *   headers: { Authorization: 'Bearer ...' },
 * });
 *
 * // 3. Parse the body with the matching parser
 * const body = (await response.json()) as { items: unknown[] };
 * const datastreams = body.items.map(parseDatastream);
 * ```
 *
 * @see {@link CSAPIQueryBuilder} for all available query methods
 * @see {@link module:csapi | csapi module docblock} for the request pattern
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @see https://docs.ogc.org/is/23-002/23-002.html
 *
 * @public
 */
export function createCSAPIBuilder(
  collection: CSAPICollectionRef,
  resourceUrls: ReadonlyMap<string, string>
): CSAPIQueryBuilder {
  return new CSAPIQueryBuilder(collection, new Map(resourceUrls));
}
