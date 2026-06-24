/**
 * SensorML 3.0 AggregateProcess sub-parser.
 *
 * Parses raw JSON objects with `type: 'AggregateProcess'` into typed
 * {@link AggregateProcess} instances. Handles all {@link AbstractProcess}-level
 * properties (definition, typeOf, configuration, featuresOfInterest,
 * inputs, outputs, parameters, modes) and the AggregateProcess-specific
 * {@link ComponentList | components} and {@link ConnectionList | connections}
 * properties.
 *
 * Component parsing is recursive: an AggregateProcess may contain other
 * process instances as inline components. All 4 concrete SensorML process
 * types are parsed by delegating to `parseSensorML30()`, which dispatches
 * to the correct sub-parser.
 *
 * This is a sub-parser — it is intended to be called by the main
 * SensorML parser (`parseSensorML30()`) when the `type` discriminator is
 * `'AggregateProcess'`.
 *
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see OAS: AggregateProcess (L3698), ComponentList (L4112), ConnectionList (L4127)
 * @module
 */

import type {
  AggregateProcess,
  InputList,
  OutputList,
  ParameterList,
} from './types.js';
import { SensorMLParseError } from './errors.js';
import {
  isRecord,
  optionalString,
  parseLink,
  parseIOList,
  parseSettings,
  parseFeatureList,
  parseModes,
  parseComponentList,
  parseConnectionList,
} from './_helpers.js';

export { SensorMLParseError };
export {
  parseComponentEntry,
  parseComponentList,
  parseConnectionList,
} from './_helpers.js';

// ========================================
// Main Parser
// ========================================

/**
 * Parse a raw SensorML 3.0 AggregateProcess JSON object into a typed
 * {@link AggregateProcess}.
 *
 * AggregateProcess is a composite non-physical process that orchestrates
 * sub-processes via named components and data flow connections.
 *
 * Handles all {@link AbstractProcess}-level properties (`definition`,
 * `typeOf`, `configuration`, `featuresOfInterest`, `inputs`, `outputs`,
 * `parameters`, `modes`) and the AggregateProcess-specific `components`
 * and `connections` properties.
 *
 * Component parsing is **recursive**: if a component's `type` is
 * `'AggregateProcess'`, it is parsed by calling this function again.
 * Other inline process types are passed through as-is until the main
 * parser (Issue #22) coordinates full sub-parser delegation.
 *
 * DescribedObject-level properties (`label`, `uniqueId`, `identifiers`,
 * `classifiers`, etc.) are passed through as-is — shared parsing helpers
 * for those fields belong to Issue #22 (SensorML Main Parser).
 *
 * @param json - Raw JSON object with `type: 'AggregateProcess'`
 * @returns Parsed AggregateProcess object
 * @throws {SensorMLParseError} If the input is not a valid AggregateProcess
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see OAS: AggregateProcess (L3698), AbstractProcess (L3599)
 */
export function parseAggregateProcess(json: unknown): AggregateProcess {
  if (!isRecord(json)) {
    throw new SensorMLParseError(
      'AggregateProcess input must be a non-null object'
    );
  }

  if (json.type !== 'AggregateProcess') {
    throw new SensorMLParseError(
      `Expected type "AggregateProcess", got "${String(json.type)}"`
    );
  }

  // --- DescribedObject-level properties (required) ---
  if (typeof json.label !== 'string') {
    throw new SensorMLParseError(
      'AggregateProcess must have a string "label" property'
    );
  }
  if (typeof json.uniqueId !== 'string') {
    throw new SensorMLParseError(
      'AggregateProcess must have a string "uniqueId" property'
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

  // --- AggregateProcess-specific properties ---
  const components = parseComponentList(json.components);
  const connections = parseConnectionList(json.connections);

  // --- Build result, preserving DescribedObject passthrough ---
  // Parsed fields listed after the spread override any raw values
  // (including null) from the server JSON. Required fields (label,
  // uniqueId) are narrowed by the typeof guards above — no cast needed.
  return {
    ...(json as Record<string, unknown>),
    type: 'AggregateProcess' as const,
    label: json.label,
    uniqueId: json.uniqueId,
    definition,
    typeOf,
    configuration,
    featuresOfInterest,
    inputs,
    outputs,
    parameters,
    modes,
    components,
    connections,
  } as AggregateProcess;
}
