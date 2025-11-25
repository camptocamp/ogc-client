/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: SystemHistory Client
 * Implements client-side access for the /systemHistory collection.
 *
 * Traces to:
 *   - /req/system-history/resources-endpoint  (23-002 §7.4 Req41)
 *   - /req/system-history/canonical-url       (23-002 §7.4 Req40)
 *
 * Exports:
 *   - SystemHistoryClient: main API client class
 */

import { CSAPICollection } from './model.js';
import { maybeFetchOrLoad } from './helpers.js';
import { getSystemHistoryUrl } from './url_builder.js';

/**
 * SystemHistoryClient
 * Provides typed access to the /systemHistory collection and its items.
 */
export class SystemHistoryClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the systemHistory collection.
   * Uses fixture "systemHistory" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getSystemHistoryUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('systemHistory', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single system history revision by ID.
   * Example canonical path: /systemHistory/{revisionId}
   */
  async get(id: string): Promise<any> {
    const url = `${getSystemHistoryUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`systemHistory_${id}`, url);
    return data;
  }
}
