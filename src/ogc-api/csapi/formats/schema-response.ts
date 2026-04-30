/**
 * Schema response parsers for OGC API - Connected Systems.
 *
 * This file houses the parse functions for schema responses:
 * - `parseDatastreamSchemaResponse()` — Task 7a
 * - `parseControlStreamSchemaResponse()` — Task 7b
 *
 * The parser wraps the `/datastreams/{id}/schema` endpoint response,
 * delegating `resultSchema`/`recordSchema` to the existing
 * `parseSWEComponent()` and `encoding` to `parseEncoding()`.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API - Connected Systems Part 2
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/17 — Demo app finding F-14
 * @module
 */

import type {
  DatastreamSchemaResponse,
  ControlStreamSchemaResponse,
} from '../model.js';
import { parseSWEComponent } from './swecommon/parser.js';
import { parseEncoding } from './swecommon/data-array.js';
import { EndpointError } from '../../../shared/errors.js';

/**
 * Transforms a raw JSON object from the `/datastreams/{id}/schema` endpoint
 * into a typed {@link DatastreamSchemaResponse} object using tolerant
 * extraction (Postel's Law).
 *
 * The schema response format varies by observation format:
 * - **JSON format** (`application/om+json`): contains `resultSchema` — a
 *   SWE Common component describing the observation result structure.
 * - **SWE Common format** (`application/swe+json`): contains `recordSchema`
 *   (a SWE Common component) and `encoding` (a DataEncoding descriptor).
 *
 * Schema fields are delegated to the existing SWE Common parser layer:
 * - `resultSchema` and `recordSchema` → {@link parseSWEComponent}
 * - `encoding` → {@link parseEncoding}
 *
 * Fields are only delegated when present and are non-null objects. If absent
 * or not an object, the field is omitted from the result (`undefined`).
 *
 * @param json - Raw JSON object from the `/datastreams/{id}/schema` endpoint.
 * @returns A typed {@link DatastreamSchemaResponse} object with up to 4 fields.
 * @throws {EndpointError} When `json` is not a non-null object.
 *
 * @example
 * ```ts
 * const raw = {
 *   obsFormat: 'application/om+json',
 *   resultSchema: {
 *     type: 'DataRecord',
 *     name: 'TemperatureOutput',
 *     fields: [
 *       { type: 'Quantity', name: 'Temperature', uom: { code: 'Cel' } },
 *     ],
 *   },
 * };
 * const schema = parseDatastreamSchemaResponse(raw);
 * // schema.obsFormat === 'application/om+json'
 * // schema.resultSchema is a parsed DataRecord (not raw JSON)
 * ```
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — Datastream schema endpoint
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/17 — Demo app finding F-14
 */
export function parseDatastreamSchemaResponse(
  json: unknown
): DatastreamSchemaResponse {
  if (typeof json !== 'object' || json === null) {
    throw new EndpointError(
      'parseDatastreamSchemaResponse: input must be a non-null object'
    );
  }

  const obj = json as Record<string, unknown>;

  // resultSchema: delegate to parseSWEComponent() if present and non-null object
  const rawResultSchema = obj.resultSchema;
  const resultSchema =
    typeof rawResultSchema === 'object' && rawResultSchema !== null
      ? parseSWEComponent(rawResultSchema)
      : undefined;

  // recordSchema: delegate to parseSWEComponent() if present and non-null object
  const rawRecordSchema = obj.recordSchema;
  const recordSchema =
    typeof rawRecordSchema === 'object' && rawRecordSchema !== null
      ? parseSWEComponent(rawRecordSchema)
      : undefined;

  // encoding: delegate to parseEncoding() if present and non-null object
  const rawEncoding = obj.encoding;
  const encoding =
    typeof rawEncoding === 'object' && rawEncoding !== null
      ? parseEncoding(rawEncoding)
      : undefined;

  return {
    obsFormat: typeof obj.obsFormat === 'string' ? obj.obsFormat : '',
    ...(resultSchema !== undefined ? { resultSchema } : {}),
    ...(recordSchema !== undefined ? { recordSchema } : {}),
    ...(encoding !== undefined ? { encoding } : {}),
  } satisfies DatastreamSchemaResponse;
}

/**
 * Transforms a raw JSON object from the `/controlstreams/{id}/schema` endpoint
 * into a typed {@link ControlStreamSchemaResponse} object using tolerant
 * extraction (Postel's Law).
 *
 * The schema response varies by command format:
 * - **JSON format** (`application/json`): contains `parametersSchema` — a
 *   SWE Common component describing the command parameters structure.
 *
 * Schema fields are delegated to the existing SWE Common parser layer:
 * - `parametersSchema` → {@link parseSWEComponent}
 * - `encoding` → {@link parseEncoding}
 *
 * Fields are only delegated when present and are non-null objects. If absent
 * or not an object, the field is omitted from the result (`undefined`).
 *
 * @param json - Raw JSON object from the `/controlstreams/{id}/schema` endpoint.
 * @returns A typed {@link ControlStreamSchemaResponse} object with up to 3 fields.
 * @throws {EndpointError} When `json` is not a non-null object.
 *
 * @example
 * ```ts
 * const raw = {
 *   commandFormat: 'application/json',
 *   parametersSchema: {
 *     type: 'DataRecord',
 *     name: 'DroneCommand',
 *     fields: [
 *       { type: 'Boolean', name: 'arm' },
 *     ],
 *   },
 * };
 * const schema = parseControlStreamSchemaResponse(raw);
 * // schema.commandFormat === 'application/json'
 * // schema.parametersSchema is a parsed DataRecord (not raw JSON)
 * ```
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — Control stream schema endpoint
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/87 — Task 7b
 */
export function parseControlStreamSchemaResponse(
  json: unknown
): ControlStreamSchemaResponse {
  if (typeof json !== 'object' || json === null) {
    throw new EndpointError(
      'parseControlStreamSchemaResponse: input must be a non-null object'
    );
  }

  const obj = json as Record<string, unknown>;

  // parametersSchema: accept both "parametersSchema" (OGC spec / newer OSH) and
  // "paramsSchema" (older OSH builds where the property was not yet renamed).
  // See https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/140
  const rawParametersSchema = obj.parametersSchema ?? obj.paramsSchema;
  const parametersSchema =
    typeof rawParametersSchema === 'object' && rawParametersSchema !== null
      ? parseSWEComponent(rawParametersSchema)
      : undefined;

  // encoding: delegate to parseEncoding() if present and non-null object
  const rawEncoding = obj.encoding;
  const encoding =
    typeof rawEncoding === 'object' && rawEncoding !== null
      ? parseEncoding(rawEncoding)
      : undefined;

  return {
    commandFormat:
      typeof obj.commandFormat === 'string' ? obj.commandFormat : '',
    ...(parametersSchema !== undefined ? { parametersSchema } : {}),
    ...(encoding !== undefined ? { encoding } : {}),
  } satisfies ControlStreamSchemaResponse;
}
