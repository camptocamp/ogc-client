/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: SystemEvents Client
 * Implements client-side access for the /systemEvents collection.
 *
 * Traces to:
 *   - /req/systemevent/collection-endpoint  (23-002 §10.15)
 *   - /req/systemevent/items-endpoint       (23-002 §10.16)
 *   - /req/systemevent/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - SystemEventsClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getSystemEventsUrl } from './url_builder';

/**
 * SystemEventsClient
 * Provides typed access to the /systemEvents collection and its items.
 */
export class SystemEventsClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the systemEvents collection.
   * Uses fixture "systemEvents" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getSystemEventsUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('systemEvents', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single system event by ID.
   * Example canonical path: /systemEvents/{systemEventId}
   */
  async get(id: string): Promise<any> {
    const url = `${getSystemEventsUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`systemEvent_${id}`, url);
    return data;
  }
}
