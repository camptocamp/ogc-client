/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: Feasibility Client
 * Implements client-side access for the /feasibility collection.
 *
 * Traces to:
 *   - /req/feasibility/collection-endpoint  (23-002 §10.19)
 *   - /req/feasibility/items-endpoint       (23-002 §10.19)
 *   - /req/feasibility/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - FeasibilityClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getFeasibilityUrl } from './url_builder';

/**
 * FeasibilityClient
 * Provides typed access to the /feasibility collection and its items.
 */
export class FeasibilityClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the feasibility collection.
   * Uses fixture "feasibility" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getFeasibilityUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('feasibility', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single feasibility item by ID.
   * Example canonical path: /feasibility/{feasibilityId}
   */
  async get(id: string): Promise<any> {
    const url = `${getFeasibilityUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`feasibility_${id}`, url);
    return data;
  }
}
