import type { Property, ResourceLink } from '../model.js';
import { EndpointError } from '../../../shared/errors.js';

/**
 * Transforms a raw JSON object from the `/properties` endpoint into a typed
 * {@link Property} object using tolerant extraction (Postel's Law).
 *
 * Property is the only Part 1 resource that is **not** a GeoJSON Feature —
 * it is a flat `DerivedProperty` object (SWE Common `AbstractSweIdentifiable`).
 * The input is a plain JSON object, not a `Feature` with `properties`/`geometry`.
 *
 * Missing optional fields are omitted from the output. Required string fields
 * (`label`, `uniqueId`, `baseProperty`) fall back to empty strings when absent.
 * The function only throws when the input is not a non-null object.
 *
 * @param json - Raw JSON object from the `/properties` items array.
 * @returns A typed {@link Property} object with extracted fields.
 * @throws {EndpointError} When `json` is not a non-null object.
 *
 * @example
 * ```ts
 * const raw = {
 *   uniqueId: 'urn:x-ogc:def:property:noaa::AirTemperature',
 *   label: 'Air Temperature',
 *   baseProperty: 'http://qudt.org/vocab/quantitykind/Temperature',
 * };
 * const property = parseProperty(raw);
 * // property.label === 'Air Temperature'
 * // property.uniqueId === 'urn:x-ogc:def:property:noaa::AirTemperature'
 * ```
 *
 * @remarks
 * Validated against 7 live Property resources from OpenSensorHub
 * (February 2026, Issue #131). All parsed correctly with no discrepancies.
 * The live data uses only `id`, `uniqueId`, `label`, `description`, and
 * `baseProperty` — no `objectType`, `statistic`, or `links`.
 * See `fixtures/ogc-api/csapi/osh-properties.json` for the captured responses.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html#_property_resources
 */
export function parseProperty(json: unknown): Property {
  if (typeof json !== 'object' || json === null) {
    throw new EndpointError('parseProperty: input must be a non-null object');
  }

  const obj = json as Record<string, unknown>;

  return {
    ...(typeof obj.id === 'string' ? { id: obj.id } : {}),
    label: typeof obj.label === 'string' ? obj.label : '',
    ...(typeof obj.description === 'string'
      ? { description: obj.description }
      : {}),
    uniqueId: typeof obj.uniqueId === 'string' ? obj.uniqueId : '',
    baseProperty: typeof obj.baseProperty === 'string' ? obj.baseProperty : '',
    ...(typeof obj.objectType === 'string'
      ? { objectType: obj.objectType }
      : {}),
    ...(typeof obj.statistic === 'string' ? { statistic: obj.statistic } : {}),
    ...(Array.isArray(obj.links) ? { links: obj.links as ResourceLink[] } : {}),
  } satisfies Property;
}
