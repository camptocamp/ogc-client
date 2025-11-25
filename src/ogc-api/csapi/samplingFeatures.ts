/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: SamplingFeatures Client
 * Implements client-side access for the /samplingFeatures collection.
 *
 * Traces to:
 *   - /req/samplingfeature/collection-endpoint  (23-002 §10.5)
 *   - /req/samplingfeature/items-endpoint       (23-002 §10.6)
 *   - /req/samplingfeature/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - SamplingFeaturesClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getSamplingFeaturesUrl } from './url_builder';

/**
 * SamplingFeaturesClient
 * Provides typed access to the /samplingFeatures collection and its items.
 */
export class SamplingFeaturesClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the samplingFeatures collection.
   * Uses fixture "samplingFeatures" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getSamplingFeaturesUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('samplingFeatures', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single sampling feature by ID.
   * Example canonical path: /samplingFeatures/{samplingFeatureId}
   */
  async get(id: string): Promise<any> {
    const url = `${getSamplingFeaturesUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`samplingFeature_${id}`, url);
    return data;
  }
}
