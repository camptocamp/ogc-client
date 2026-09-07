/**
 * Shared parser utility functions used across SensorML and SWE Common parsers.
 *
 * This module lives at the `formats/` level so that both `sensorml/` and
 * `swecommon/` can depend on it without creating cross-dependencies on
 * each other. The `_` prefix signals an internal module (consistent with
 * the `_helpers.ts` convention used by each sub-parser group).
 *
 * @see Issue #135 — D-4 consolidation
 * @module
 */

/**
 * Type guard: checks whether `value` is a non-null, non-array object.
 *
 * Used throughout SensorML and SWE Common parsers for safe property
 * access before reading discriminator fields or required properties.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
