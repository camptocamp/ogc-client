/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: ControlStreams Client
 * Implements client-side access for the /controlStreams collection.
 *
 * Traces to:
 *   - /req/controlstream/collection-endpoint  (23-002 §10.15)
 *   - /req/controlstream/items-endpoint       (23-002 §10.16)
 *   - /req/controlstream/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - ControlStreamsClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getControlStreamsUrl } from './url_builder';

/**
 * ControlStreamsClient
 * Provides typed access to the /controlStreams collection and its items.
 */
export class ControlStreamsClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the controlStreams collection.
   * Uses fixture "controlStreams" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getControlStreamsUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('controlStreams', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single control stream by ID.
   * Example canonical path: /controlStreams/{controlStreamId}
   */
  async get(id: string): Promise<any> {
    const url = `${getControlStreamsUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`controlStream_${id}`, url);
    return data;
  }
}
