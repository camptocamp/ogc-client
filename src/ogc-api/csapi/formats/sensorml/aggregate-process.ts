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
  ComponentList,
  ComponentEntry,
  ConnectionList,
  Connection,
  InputList,
  OutputList,
  ParameterList,
} from './types.js';
import { SensorMLParseError } from './errors.js';
import {
  isRecord,
  optionalString,
  parseLink,
  parseComponentEntry,
  parseIOComponentChoice,
  parseIOList,
  parseSettings,
  parseFeatureList,
  parseModes,
} from './_helpers.js';

export { SensorMLParseError };
export { parseComponentEntry } from './_helpers.js';

// ========================================
// AggregateProcess-specific Helpers
// ========================================

/**
 * Parse a {@link ComponentList} — array of named sub-process components.
 *
 * @param value - Raw JSON value
 * @returns Parsed ComponentList, or `undefined` if absent/null
 * @throws {SensorMLParseError} If `value` is present but is not an array,
 *   or if any component entry is invalid
 * @see OAS: ComponentList (L4112)
 */
export function parseComponentList(
  value: unknown
): ComponentList | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new SensorMLParseError('"components" must be an array');
  }
  return value.map((item, i) => {
    try {
      return parseComponentEntry(item, i);
    } catch (err) {
      if (err instanceof SensorMLParseError) throw err;
      throw new SensorMLParseError(
        `Invalid components[${i}]: ${(err as Error).message}`
      );
    }
  });
}

/**
 * Parse a single {@link Connection} entry.
 *
 * Both `source` and `destination` properties are required strings
 * (PathRef data paths).
 *
 * @param value - Raw JSON value
 * @param index - Array index for error messages
 * @returns Parsed Connection
 * @throws {SensorMLParseError} If the entry is not valid or lacks
 *   required `source`/`destination` properties
 * @see OAS: ConnectionList (L4127)
 */
function parseConnection(value: unknown, index: number): Connection {
  if (!isRecord(value)) {
    throw new SensorMLParseError(
      `connections[${index}] must be an object`
    );
  }
  if (typeof value.source !== 'string') {
    throw new SensorMLParseError(
      `connections[${index}] must have a string "source" property`
    );
  }
  if (typeof value.destination !== 'string') {
    throw new SensorMLParseError(
      `connections[${index}] must have a string "destination" property`
    );
  }
  return {
    source: value.source,
    destination: value.destination,
  };
}

/**
 * Parse a {@link ConnectionList} — array of data-flow connections.
 *
 * @param value - Raw JSON value
 * @returns Parsed ConnectionList, or `undefined` if absent/null
 * @throws {SensorMLParseError} If `value` is present but is not an array,
 *   or if any connection entry is invalid
 * @see OAS: ConnectionList (L4127)
 */
export function parseConnectionList(
  value: unknown
): ConnectionList | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new SensorMLParseError('"connections" must be an array');
  }
  return value.map((item, i) => parseConnection(item, i));
}

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
  const result: AggregateProcess = {
    // DescribedObject passthrough — the main parser (Issue #22)
    // will handle shared helpers for these fields.
    ...(json as Record<string, unknown>),
    // Enforce discriminator and required fields
    type: 'AggregateProcess' as const,
    label: json.label as string,
    uniqueId: json.uniqueId as string,
  };

  // Apply parsed AbstractProcess-level and AggregateProcess-specific
  // properties (overwrite raw values). Explicitly delete null/undefined
  // raw values before assigning parsed ones, so that optional properties
  // absent in input don't leak as `null`.
  const managedKeys = [
    'definition',
    'typeOf',
    'configuration',
    'featuresOfInterest',
    'inputs',
    'outputs',
    'parameters',
    'modes',
    'components',
    'connections',
  ] as const;
  for (const key of managedKeys) {
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

  // Apply AggregateProcess-specific properties
  if (components !== undefined) result.components = components;
  if (connections !== undefined) result.connections = connections;

  return result;
}
