/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: Deployments Client
 * Implements client-side access for the /deployments collection.
 *
 * Traces to:
 *   - /req/deployment/collection-endpoint  (23-002 §10.1)
 *   - /req/deployment/items-endpoint       (23-002 §10.2)
 *   - /req/deployment/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - DeploymentsClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getDeploymentsUrl } from './url_builder';

/**
 * DeploymentsClient
 * Provides typed access to the /deployments collection and its items.
 */
export class DeploymentsClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the deployments collection.
   * Uses fixture "deployments" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getDeploymentsUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('deployments', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single deployment by ID.
   * Example canonical path: /deployments/{deploymentId}
   */
  async get(id: string): Promise<any> {
    const url = `${getDeploymentsUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`deployment_${id}`, url);
    return data;
  }
}
