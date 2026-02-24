import type OgcApiEndpoint from '../endpoint.js';
import type { OgcApiCollectionInfo } from '../model.js';
import { EndpointError } from '../../shared/errors.js';
import CSAPIQueryBuilder from './url_builder.js';
import { scanCsapiLinks } from './helpers.js';

/**
 * Creates a {@link CSAPIQueryBuilder} for constructing Connected Systems
 * query URLs against the given collection.
 *
 * The builder discovers available resource types by inspecting the
 * collection's link relations and the root API document.
 *
 * @param endpoint - An initialized OGC API endpoint instance.
 * @param collectionId - The collection identifier to create a builder for.
 * @returns A CSAPIQueryBuilder scoped to the specified collection.
 * @throws {EndpointError} If the endpoint does not support Connected Systems.
 *
 * @example
 * ```ts
 * import { createCSAPIBuilder } from '@camptocamp/ogc-client/csapi';
 * import OgcApiEndpoint from '@camptocamp/ogc-client';
 *
 * const endpoint = await new OgcApiEndpoint('https://api.example.com');
 * const builder = await createCSAPIBuilder(endpoint, 'weather-stations');
 *
 * // List systems with a spatial filter
 * const url = builder.getSystems({ bbox: [-180, -90, 180, 90], limit: 50 });
 * ```
 *
 * @see {@link CSAPIQueryBuilder} for all available query methods
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */
export async function createCSAPIBuilder(
  endpoint: OgcApiEndpoint,
  collectionId: string
): Promise<CSAPIQueryBuilder> {
  if (!(await endpoint.hasConnectedSystems)) {
    throw new EndpointError('Endpoint does not support Connected Systems');
  }

  // Access root and getCollectionDocument via `any` because they are
  // currently `private`. Task 6 (Issue #122) changes them to `public`;
  // these casts will be removed then.
  const ep = endpoint as any;

  const collectionDoc = await ep.getCollectionDocument(collectionId);
  const rootDoc = await ep.root;
  const links = rootDoc?.links;
  const resourceUrls = Array.isArray(links)
    ? scanCsapiLinks(links)
    : new Map<string, string>();

  return new CSAPIQueryBuilder(
    collectionDoc as unknown as OgcApiCollectionInfo,
    resourceUrls
  );
}
