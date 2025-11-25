/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Part 2: Commands Client
 * Implements client-side access for the /commands collection.
 *
 * Traces to:
 *   - /req/command/collection-endpoint  (23-002 §10.17)
 *   - /req/command/items-endpoint       (23-002 §10.18)
 *   - /req/command/canonical-url        (23-002 §7.4)
 *
 * Exports:
 *   - CommandsClient: main API client class
 */

import { CSAPICollection } from './model';
import { maybeFetchOrLoad } from './helpers';
import { getCommandsUrl } from './url_builder';

/**
 * CommandsClient
 * Provides typed access to the /commands collection and its items.
 */
export class CommandsClient {
  readonly apiRoot: string;

  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  /**
   * Retrieves the commands collection.
   * Uses fixture "commands" by default, or fetches live data when CSAPI_LIVE=true.
   */
  async list(): Promise<CSAPICollection> {
    const url = getCommandsUrl(this.apiRoot);
    const data = await maybeFetchOrLoad('commands', url);
    return data as CSAPICollection;
  }

  /**
   * Retrieves a single command by ID.
   * Example canonical path: /commands/{commandId}
   */
  async get(id: string): Promise<any> {
    const url = `${getCommandsUrl(this.apiRoot)}/${id}`;
    const data = await maybeFetchOrLoad(`command_${id}`, url);
    return data;
  }
}
