/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: Procedures Client
 * Implements client-side access for the /procedures collection.
 *
 * Traces to:
 *   - /req/procedure/collection-endpoint  (23-002 §10.4)
 *   - /req/procedure/items-endpoint       (23-002 §10.5)
 *   - /req/procedure/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - ProceduresClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getProceduresUrl } from './url_builder';

/**
 * ProceduresClient
 * Provides typed access to the /procedures collection and its items.
 */
export class ProceduresClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the procedures collection.
   * Uses fixture "procedures" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getProceduresUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('procedures', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single procedure by ID.
   * Example canonical path: /procedures/{procedureId}
   */
  async get(id: string): Promise<any> {
    const url = `${getProceduresUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`procedure_${id}`, url);
    return data;
  }
}
