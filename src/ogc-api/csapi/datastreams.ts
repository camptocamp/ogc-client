/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: Datastreams Client
 * Implements client-side access for the /datastreams collection.
 *
 * Traces to:
 *   - /req/datastream/collection-endpoint  (23-002 §10.9)
 *   - /req/datastream/items-endpoint       (23-002 §10.10)
 *   - /req/datastream/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - DatastreamsClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getDatastreamsUrl } from './url_builder';

/**
 * DatastreamsClient
 * Provides typed access to the /datastreams collection and its items.
 */
export class DatastreamsClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the datastreams collection.
   * Uses fixture "datastreams" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getDatastreamsUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('datastreams', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single datastream by ID.
   * Example canonical path: /datastreams/{datastreamId}
   */
  async get(id: string): Promise<any> {
    const url = `${getDatastreamsUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`datastream_${id}`, url);
    return data;
  }
}
