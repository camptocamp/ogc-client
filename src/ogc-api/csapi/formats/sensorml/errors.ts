/**
 * Shared error class for SensorML 3.0 parsing failures.
 *
 * All SensorML sub-parsers throw this single error class, ensuring that
 * `instanceof SensorMLParseError` checks work consistently regardless of
 * which sub-parser module throws the error.
 *
 * @see parsePhysicalSystem — `physical-system.ts`
 * @see parsePhysicalComponent — `physical-system.ts`
 * @see parseSimpleProcess — `simple-process.ts`
 * @see parseAggregateProcess — `aggregate-process.ts`
 * @module
 */

/**
 * Error thrown when SensorML parsing fails.
 *
 * Indicates that the input JSON did not conform to the expected SensorML 3.0
 * structure for the target process type (e.g., wrong `type` discriminator,
 * missing required fields, or non-object input).
 *
 * @see parsePhysicalSystem
 * @see parsePhysicalComponent
 * @see parseSimpleProcess
 * @see parseAggregateProcess
 * @see parseSensorML30
 */
export class SensorMLParseError extends Error {
  /**
   * Optional path indicating where in the document the error occurred.
   *
   * @example `'components[2].type'`
   * @example `'capabilities[0].capabilities[1].name'`
   */
  path?: string;

  constructor(message: string, path?: string) {
    super(message);
    this.name = 'SensorMLParseError';
    if (path !== undefined) this.path = path;
  }
}
