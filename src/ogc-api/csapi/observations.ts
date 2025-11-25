/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: Observations Client
 * Implements client-side access for the /observations collection.
 *
 * Traces to:
 *   - /req/observation/collection-endpoint  (23-002 §10.11)
 *   - /req/observation/items-endpoint       (23-002 §10.12)
 *   - /req/observation/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - ObservationsClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getObservationsUrl } from './url_builder';

/**
 * ObservationsClient
 * Provides typed access to the /observations collection and its items.
 */
export class ObservationsClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the observations collection.
   * Uses fixture "observations" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getObservationsUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('observations', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single observation by ID.
   * Example canonical path: /observations/{observationId}
   */
  async get(id: string): Promise<any> {
    const url = `${getObservationsUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`observation_${id}`, url);
    return data;
  }
}
