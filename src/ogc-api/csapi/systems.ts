/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API - Connected Systems Part 2: Systems Client
 * Implements client-side access for the /systems collection and related resources.
 *
 * Traces to:
 *   - /req/system/collection-endpoint    (23-002 Section 8.1)
 *   - /req/system/items-endpoint         (23-002 Section 8.2)
 *   - /req/system/canonical-url          (23-002 Section 7.4 Req37)
 *   - /req/system/ref-to-events          (23-002 Section 7.4 Req43)
 *
 * Exports:
 *   - SystemsClient: main API client class
 */

import { CSAPISystem, CSAPISystemCollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getSystemsUrl, getSystemEventsUrl } from './url_builder';

/**
 * SystemsClient
 *
 * Provides typed access to the /systems collection and related resources.
 * Systems represent physical or virtual entities that can observe or control phenomena.
 *
 * @see OGC 23-002 Section 8
 *
 * @example
 * const client = new SystemsClient('https://api.example.com');
 * const systems = await client.list();
 * const system = await client.get('sys-001');
 */
export class SystemsClient {
  /** The base URL of the CSAPI server */
  readonly apiRoot: string;

  /**
   * Creates a new SystemsClient instance.
   * @param {string} apiRoot - The base URL of the CSAPI server
   */
  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the systems collection.
   * Uses fixture "systems" by default, or fetches live data when CSAPI_LIVE=true.
   * @returns {Promise<CSAPISystemCollection>} Promise resolving to a collection of systems
   */
  async list(): Promise<CSAPISystemCollection> {
    const url = getSystemsUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('systems', url);
    return data as CSAPISystemCollection;
  }

  /**
   * Retrieves a single System by ID.
   * @param {string} id - The unique identifier of the system
   * @returns {Promise<CSAPISystem>} Promise resolving to the system resource
   * @example
   * const system = await client.get('sys-001');
   */
  async get(id: string): Promise<CSAPISystem> {
    const url = `${getSystemsUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`system_${id}`, url);
    return data as CSAPISystem;
  }

  /**
   * Lists all System Events for a given System.
   * @param {string} systemId - The unique identifier of the system
   * @returns {Promise<any>} Promise resolving to the system events collection
   */
  async listEvents(systemId: string): Promise<any> {
    const url = getSystemEventsUrl(this.apiRoot, systemId);
    const data = await maybeFetchOrLoad(`systemEvents_${systemId}`, url);
    return data;
  }

  /**
   * Resolves all related link relations from a System's metadata.
   * @param {string} id - The unique identifier of the system
   * @returns {Promise<Record<string, string>>} Promise resolving to a map of rel to href pairs
   */
  async getLinkedResources(id: string): Promise<Record<string, string>> {
    const system = await this.get(id);
    const links: Record<string, string> = {};
    system.links?.forEach((l) => {
      if (l.rel && l.href) links[l.rel] = l.href;
    });
    return links;
  }
}
