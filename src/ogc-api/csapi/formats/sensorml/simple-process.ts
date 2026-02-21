/**
 * SensorML 3.0 SimpleProcess sub-parser.
 *
 * Parses raw JSON objects with `type: 'SimpleProcess'` into typed
 * {@link SimpleProcess} instances. Handles all {@link AbstractProcess}-level
 * properties (definition, typeOf, configuration, featuresOfInterest,
 * inputs, outputs, parameters, modes) and the SimpleProcess-specific
 * {@link ProcessMethod | method} property.
 *
 * This is a sub-parser — it is intended to be called by the main
 * SensorML parser (Issue #22) when the `type` discriminator is
 * `'SimpleProcess'`.
 *
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see OAS: SimpleProcess (L3679), AbstractProcess (L3599)
 * @module
 */

import type {
  SimpleProcess,
  InputList,
  OutputList,
  ParameterList,
} from './types.js';
import { SensorMLParseError } from './errors.js';
import {
  isRecord,
  optionalString,
  parseLink,
  parseProcessMethod,
  parseIOComponentChoice,
  parseIOList,
  parseSettings,
  parseFeatureList,
  parseModes,
} from './_helpers.js';

export { SensorMLParseError };
export { parseProcessMethod, parseIOComponentChoice } from './_helpers.js';

// ========================================
// Main Parser
// ========================================

/**
 * Parse a raw SensorML 3.0 SimpleProcess JSON object into a typed
 * {@link SimpleProcess}.
 *
 * Handles all {@link AbstractProcess}-level properties (`definition`,
 * `typeOf`, `configuration`, `featuresOfInterest`, `inputs`, `outputs`,
 * `parameters`, `modes`) and the SimpleProcess-specific `method` property.
 *
 * DescribedObject-level properties (`label`, `uniqueId`, `identifiers`,
 * `classifiers`, etc.) are passed through as-is — shared parsing helpers
 * for those fields belong to Issue #22 (SensorML Main Parser).
 *
 * @param json - Raw JSON object with `type: 'SimpleProcess'`
 * @returns Parsed SimpleProcess object
 * @throws {SensorMLParseError} If the input is not a valid SimpleProcess
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see OAS: SimpleProcess (L3679), AbstractProcess (L3599)
 */
export function parseSimpleProcess(json: unknown): SimpleProcess {
  if (!isRecord(json)) {
    throw new SensorMLParseError(
      'SimpleProcess input must be a non-null object'
    );
  }

  if (json.type !== 'SimpleProcess') {
    throw new SensorMLParseError(
      `Expected type "SimpleProcess", got "${String(json.type)}"`
    );
  }

  // --- DescribedObject-level properties (required) ---
  if (typeof json.label !== 'string') {
    throw new SensorMLParseError(
      'SimpleProcess must have a string "label" property'
    );
  }
  if (typeof json.uniqueId !== 'string') {
    throw new SensorMLParseError(
      'SimpleProcess must have a string "uniqueId" property'
    );
  }

  // --- AbstractProcess-level properties ---
  const definition = optionalString(json.definition);
  const typeOf = parseLink(json.typeOf);
  const configuration = parseSettings(json.configuration);
  const featuresOfInterest = parseFeatureList(json.featuresOfInterest);
  const inputs = parseIOList(json.inputs, 'inputs') as InputList | undefined;
  const outputs = parseIOList(json.outputs, 'outputs') as
    | OutputList
    | undefined;
  const parameters = parseIOList(json.parameters, 'parameters') as
    | ParameterList
    | undefined;
  const modes = parseModes(json.modes);

  // --- SimpleProcess-specific property ---
  const method = parseProcessMethod(json.method);

  // --- Build result, preserving DescribedObject passthrough ---
  const result: SimpleProcess = {
    // DescribedObject passthrough — the main parser (Issue #22)
    // will handle shared helpers for these fields.
    ...(json as Record<string, unknown>),
    // Enforce discriminator and required fields
    type: 'SimpleProcess' as const,
    label: json.label as string,
    uniqueId: json.uniqueId as string,
  };

  // Apply parsed AbstractProcess-level properties (overwrite raw values).
  // Explicitly delete null/undefined raw values before assigning parsed ones,
  // so that optional properties absent in input don't leak as `null`.
  const abstractKeys = [
    'definition',
    'typeOf',
    'configuration',
    'featuresOfInterest',
    'inputs',
    'outputs',
    'parameters',
    'modes',
    'method',
  ] as const;
  for (const key of abstractKeys) {
    delete (result as unknown as Record<string, unknown>)[key];
  }

  if (definition !== undefined) result.definition = definition;
  if (typeOf !== undefined) result.typeOf = typeOf;
  if (configuration !== undefined) result.configuration = configuration;
  if (featuresOfInterest !== undefined)
    result.featuresOfInterest = featuresOfInterest;
  if (inputs !== undefined) result.inputs = inputs;
  if (outputs !== undefined) result.outputs = outputs;
  if (parameters !== undefined) result.parameters = parameters;
  if (modes !== undefined) result.modes = modes;

  // Apply SimpleProcess-specific property
  if (method !== undefined) result.method = method;

  return result;
}
