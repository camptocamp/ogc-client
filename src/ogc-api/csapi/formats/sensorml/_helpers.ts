/**
 * SensorML 3.0 — shared internal parsing helpers.
 *
 * These helpers are used by multiple SensorML sub-parsers and the main
 * parser. They were previously duplicated as private functions in each
 * consumer file; this module consolidates them into a single source of
 * truth (Issue #54, resolving Phase 3.8 F5).
 *
 * **Consumers:**
 * - `parser.ts` — main SensorML parser
 * - `simple-process.ts` — SimpleProcess sub-parser
 * - `aggregate-process.ts` — AggregateProcess sub-parser
 * - `physical-system.ts` — PhysicalSystem/PhysicalComponent sub-parser
 *
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0 (JSON)
 * @module
 */

import type {
  ProcessMethod,
  IOComponentChoice,
  Mode,
  Settings,
  Link,
  FeatureList,
  ComponentEntry,
  ComponentList,
  ConnectionList,
  Connection,
} from './types.js';
import { SensorMLParseError } from './errors.js';
import { parseSensorML30 } from './parser.js';
import { isRecord } from '../_parse-utils.js';

// ========================================
// Primitive Helpers
// ========================================

export { isRecord } from '../_parse-utils.js';

/**
 * Return `value` if it is a string, otherwise `undefined`.
 */
export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// ========================================
// Link / FeatureList
// ========================================

/**
 * Parse a `link-2` object.
 *
 * Extracts only the standard OGC link properties (href, rel, type,
 * hreflang, title, uid), stripping any non-standard extensions.
 *
 * @param value - Raw JSON value
 * @returns Parsed {@link Link} or `undefined` if not a valid link object
 * @see OAS: link-2 schema
 */
export function parseLink(value: unknown): Link | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.href !== 'string') return undefined;
  const link: Link = { href: value.href };
  if (typeof value.rel === 'string') link.rel = value.rel;
  if (typeof value.type === 'string') link.type = value.type;
  if (typeof value.hreflang === 'string') link.hreflang = value.hreflang;
  if (typeof value.title === 'string') link.title = value.title;
  if (typeof value.uid === 'string') link.uid = value.uid;
  return link;
}

/**
 * Parse a {@link FeatureList} (array of links).
 *
 * @param value - Raw JSON value
 * @returns Parsed FeatureList or `undefined`
 * @see OAS: FeatureList (L3579)
 */
export function parseFeatureList(value: unknown): FeatureList | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return undefined;
  const links: Link[] = [];
  for (const item of value) {
    const link = parseLink(item);
    if (link) links.push(link);
  }
  return links.length > 0 ? links : undefined;
}

// ========================================
// I/O Components
// ========================================

/**
 * Parse a single {@link IOComponentChoice} entry.
 *
 * Deep SWE Common validation is not wired in;
 * the entry is preserved as-is with validated `name`.
 *
 * @param value - Raw JSON value
 * @returns Parsed IOComponentChoice
 * @throws {SensorMLParseError} If the entry lacks a required `name`
 * @see OAS: IOComponentChoice (L3662)
 */
export function parseIOComponentChoice(value: unknown): IOComponentChoice {
  if (!isRecord(value)) {
    throw new SensorMLParseError('IOComponentChoice entry must be an object');
  }
  if (typeof value.name !== 'string') {
    throw new SensorMLParseError(
      'IOComponentChoice entry must have a string "name" property'
    );
  }
  return value as unknown as IOComponentChoice;
}

/**
 * Parse an array of {@link IOComponentChoice} entries.
 *
 * @param value - Raw JSON value (expected: array)
 * @param listName - Name for error messages (e.g. `'inputs'`)
 * @returns Parsed array, or `undefined` if absent/null
 * @throws {SensorMLParseError} If present but not an array
 */
export function parseIOList(
  value: unknown,
  listName: string
): IOComponentChoice[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new SensorMLParseError(`"${listName}" must be an array`);
  }
  return value.map((item, i) => {
    try {
      return parseIOComponentChoice(item);
    } catch (err) {
      throw new SensorMLParseError(
        `Invalid ${listName}[${i}]: ${(err as Error).message}`,
        `${listName}[${i}]`
      );
    }
  });
}

// ========================================
// Settings
// ========================================

/**
 * Parse a {@link Settings} object.
 *
 * Deep SWE Common field-level validation is not wired in; raw JSON pass-through.
 *
 * @param value - Raw JSON value
 * @returns Parsed Settings or `undefined`
 * @see OAS: Settings (L3307)
 */
export function parseSettings(value: unknown): Settings | undefined {
  if (!isRecord(value)) return undefined;
  return value as unknown as Settings;
}

// ========================================
// Modes
// ========================================

/**
 * Parse a {@link Mode} object.
 *
 * @param value - Raw JSON value
 * @returns Parsed Mode or `undefined`
 * @see OAS: Mode (L3570)
 */
export function parseMode(value: unknown): Mode | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.type !== 'string') return undefined;
  if (typeof value.label !== 'string') return undefined;
  if (typeof value.uniqueId !== 'string') return undefined;
  return value as unknown as Mode;
}

/**
 * Parse an array of {@link Mode} objects.
 *
 * @param value - Raw JSON value
 * @returns Parsed array or `undefined`
 */
export function parseModes(value: unknown): Mode[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return undefined;
  const modes: Mode[] = [];
  for (const item of value) {
    const mode = parseMode(item);
    if (mode) modes.push(mode);
  }
  return modes.length > 0 ? modes : undefined;
}

// ========================================
// ProcessMethod
// ========================================

/**
 * Parse a {@link ProcessMethod} object.
 *
 * @param value - Raw JSON value
 * @returns Parsed ProcessMethod or `undefined` if not a valid object
 * @see OAS: ProcessMethod (L3671)
 */
export function parseProcessMethod(value: unknown): ProcessMethod | undefined {
  if (!isRecord(value)) return undefined;
  const method: ProcessMethod = {};
  if (value.algorithm !== undefined) method.algorithm = value.algorithm;
  if (typeof value.description === 'string')
    method.description = value.description;
  return method;
}

// ========================================
// Component Entry (shared by PhysicalSystem & AggregateProcess)
// ========================================

/**
 * Parse a single {@link ComponentEntry}.
 *
 * Each component entry must have a `name` property (from SoftNamedProperty).
 * The entry is either:
 * - An **inline process** (any of the 4 concrete SensorML process types,
 *   identified by `type` being one of `'SimpleProcess'`, `'AggregateProcess'`,
 *   `'PhysicalComponent'`, `'PhysicalSystem'`)
 * - An **external link** (`type: 'Link'` with `href`)
 *
 * All 4 inline process types (`PhysicalSystem`, `PhysicalComponent`,
 * `SimpleProcess`, `AggregateProcess`) are parsed by delegating to
 * {@link parseSensorML30}, which dispatches to the correct sub-parser.
 * External links and unrecognized types are passed through as-is.
 *
 * @param value - Raw JSON value
 * @param index - Array index for error messages
 * @returns Parsed ComponentEntry
 * @throws {SensorMLParseError} If the entry is not a valid object or
 *   lacks a required `name` property
 * @see {@link parseSensorML30} in `parser.ts` — dispatches all 4 process types
 * @see OAS: ComponentList (L4112), SoftNamedProperty (L1938)
 */
export function parseComponentEntry(
  value: unknown,
  index: number
): ComponentEntry {
  if (!isRecord(value)) {
    throw new SensorMLParseError(`components[${index}] must be an object`);
  }
  if (typeof value.name !== 'string') {
    throw new SensorMLParseError(
      `components[${index}] must have a string "name" property`
    );
  }

  // Delegate all inline process types to the main SensorML dispatcher
  const knownTypes = [
    'PhysicalSystem',
    'PhysicalComponent',
    'SimpleProcess',
    'AggregateProcess',
  ];
  if (typeof value.type === 'string' && knownTypes.includes(value.type)) {
    const parsed = parseSensorML30(value);
    return { ...parsed, name: value.name as string } as ComponentEntry;
  }

  // External links and unrecognized types are passed through
  return value as unknown as ComponentEntry;
}

// ========================================
// Component & Connection List Helpers
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
export function parseComponentList(value: unknown): ComponentList | undefined {
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
export function parseConnection(value: unknown, index: number): Connection {
  if (!isRecord(value)) {
    throw new SensorMLParseError(`connections[${index}] must be an object`);
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
