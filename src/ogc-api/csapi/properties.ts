/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: Properties Client
 * Implements client-side access for the /properties collection.
 *
 * Traces to:
 *   - /req/property/collection-endpoint  (23-002 §10.7)
 *   - /req/property/items-endpoint       (23-002 §10.8)
 *   - /req/property/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - PropertiesClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getPropertiesUrl } from './url_builder';

/**
 * PropertiesClient
 * Provides typed access to the /properties collection and its items.
 */
export class PropertiesClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the properties collection.
   * Uses fixture "properties" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getPropertiesUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('properties', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single property by ID.
   * Example canonical path: /properties/{propertyId}
   */
  async get(id: string): Promise<any> {
    const url = `${getPropertiesUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`property_${id}`, url);
    return data;
  }
}
