/**
 * Command fallback routing for CSAPI servers that reject top-level `/commands`.
 *
 * OpenSensorHub (and potentially other servers) does not implement `/commands`
 * as a top-level resource — all command requests must go through the parent
 * control stream: `/controlstreams/{csId}/commands`. This module provides:
 *
 * 1. **Detection** — {@link isCommandRouteRejection} identifies the 400
 *    "Invalid resource name" pattern that signals a server rejects top-level
 *    command routes.
 * 2. **Caching** — Per-server routing preference cache so the top-level
 *    attempt is skipped on subsequent requests once the server's behavior
 *    is known.
 * 3. **Nested URL construction** — {@link buildNestedCommandUrl} constructs
 *    the fallback URL through the parent control stream, reusing the
 *    existing {@link CSAPIQueryBuilder} without modifying it.
 *
 * The Phase 2 QueryBuilder is NOT modified — URLs it generates are
 * spec-correct. This module adds a response-layer routing concern.
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/47
 * @see https://docs.ogc.org/is/23-002/23-002.html#_command_resources
 * @module
 */

import type CSAPIQueryBuilder from './url_builder.js';
import type { CommandQueryOptions } from './model.js';
import { encodeResourceId } from './helpers.js';

// ── Types ──

/**
 * Server routing preference for top-level command endpoints.
 * - `'top-level'` — Server supports `/commands` (spec-compliant).
 * - `'nested-only'` — Server rejects `/commands`; use
 *   `/controlstreams/{csId}/commands` instead.
 */
export type CommandRoutingPreference = 'top-level' | 'nested-only';

// ── Routing Preference Cache ──

/** Per-server routing preference cache keyed by server base URL. */
const routingCache_ = new Map<string, CommandRoutingPreference>();

/**
 * Returns the cached routing preference for a server, or `undefined`
 * if the server has not been probed yet.
 *
 * @param serverBaseUrl - The server's base URL (e.g., `https://osh.example.com/api`).
 */
export function getCommandRoutingPreference(
  serverBaseUrl: string
): CommandRoutingPreference | undefined {
  return routingCache_.get(serverBaseUrl);
}

/**
 * Caches the routing preference for a server after probing.
 *
 * @param serverBaseUrl - The server's base URL.
 * @param preference - The discovered routing preference.
 */
export function setCommandRoutingPreference(
  serverBaseUrl: string,
  preference: CommandRoutingPreference
): void {
  routingCache_.set(serverBaseUrl, preference);
}

/**
 * Clears all cached routing preferences. Intended for testing.
 */
export function clearCommandRoutingCache(): void {
  routingCache_.clear();
}

// ── Route Rejection Detection ──

/**
 * Determines whether a server response indicates rejection of a
 * top-level `/commands` route.
 *
 * OSH returns HTTP 400 with body containing "Invalid resource name"
 * when `/commands` or `/commands/{id}` is requested at the top level.
 *
 * @param status - The HTTP response status code.
 * @param bodyText - Optional response body text to inspect.
 * @returns `true` if the response matches the command route rejection pattern.
 */
export function isCommandRouteRejection(
  status: number,
  bodyText?: string
): boolean {
  return status === 400 && (bodyText?.includes('Invalid resource name') ?? false);
}

// ── Nested URL Construction ──

/**
 * Builds a nested command URL routed through a parent control stream.
 *
 * Uses the builder's existing `getControlStreamCommands()` method to
 * construct the base path, then appends the optional command ID and
 * sub-path (status, result, cancel). Query parameters from `options`
 * are applied via the builder's own query string serialization.
 *
 * **Usage for `getCommands()` fallback:** The caller MUST provide a
 * `controlStreamId`. If no control stream ID is known, discover
 * available control streams first via `builder.getControlStreams()`.
 *
 * @param builder - The CSAPIQueryBuilder instance.
 * @param controlStreamId - The parent control stream ID.
 * @param commandId - Optional command ID for single-resource methods.
 * @param subPath - Optional sub-path (`'status'`, `'result'`, `'cancel'`).
 * @param options - Optional query parameters forwarded to the builder.
 * @returns The nested command URL string.
 *
 * @example
 * ```ts
 * // Fallback for getCommand('cmd-001'):
 * const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001');
 * // => ".../controlstreams/cs-001/commands/cmd-001"
 *
 * // Fallback for getCommandStatus('cmd-001'):
 * const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001', 'status');
 * // => ".../controlstreams/cs-001/commands/cmd-001/status"
 *
 * // Fallback for getCommands({ limit: 50 }):
 * const url = buildNestedCommandUrl(builder, 'cs-001', undefined, undefined, { limit: 50 });
 * // => ".../controlstreams/cs-001/commands?limit=50"
 * ```
 */
export function buildNestedCommandUrl(
  builder: CSAPIQueryBuilder,
  controlStreamId: string,
  commandId?: string,
  subPath?: string,
  options?: CommandQueryOptions
): string {
  // Delegate query-string serialization to the builder.
  const baseWithOptions = builder.getControlStreamCommands(
    controlStreamId,
    options
  );

  // When no extra path segments are needed, the base URL is the answer.
  if (!commandId && !subPath) return baseWithOptions;

  // Split the URL at the query string boundary so we can insert path
  // segments between the base path and the query parameters.
  const qIndex = baseWithOptions.indexOf('?');
  const basePath = qIndex >= 0 ? baseWithOptions.substring(0, qIndex) : baseWithOptions;
  const queryPart = qIndex >= 0 ? baseWithOptions.substring(qIndex) : '';

  let url = basePath;
  if (commandId) url += `/${encodeResourceId(commandId)}`;
  if (subPath) url += `/${subPath}`;
  return url + queryPart;
}
