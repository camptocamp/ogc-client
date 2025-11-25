/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

import fs from 'fs';
import path from 'path';

/**
 * Legacy type maintained for backward compatibility.
 * @deprecated Profile-based loading is no longer used. All fixtures load from examples/.
 */
export type CSAPIFixtureProfile =
  | 'minimal'
  | 'advanced'
  | 'default'
  | 'examples';

/**
 * Returns the unified examples directory path.
 * @returns Path to unified examples directory
 */
function getFixturesPath(): string {
  return 'fixtures/ogc-api/csapi/examples';
}

/**
 * Loads a fixture from the unified examples directory.
 * @param name - Fixture name (without .json extension)
 * @returns Parsed fixture data
 */
export function loadFixture(name: string): any;
/**
 * Loads a fixture from the unified examples directory.
 * @param profile - Ignored, maintained for backward compatibility
 * @param name - Fixture name (without .json extension)
 * @returns Parsed fixture data
 * @deprecated Use loadFixture(name) instead
 */
export function loadFixture(profile: CSAPIFixtureProfile, name: string): any;
export function loadFixture(
  profileOrName: CSAPIFixtureProfile | string,
  name?: string
): any {
  const fixtureName = name !== undefined ? name : (profileOrName as string);
  const dir = getFixturesPath();
  const filePath = path.resolve(process.cwd(), `${dir}/${fixtureName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`[CSAPI fixtures] Fixture not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Loads a fixture from the unified examples directory.
 * The CSAPI_FIXTURE_PROFILE environment variable is ignored.
 * @param name - Fixture name (without .json extension)
 * @returns Parsed fixture data
 */
export function loadFixtureEnv(name: string): any {
  return loadFixture(name);
}

const cache = new Map<string, any>();
/**
 * Loads and caches a fixture from the unified examples directory.
 * @param name - Fixture name (without .json extension)
 * @returns Cached fixture data
 */
export function cachedFixture(name: string): any {
  const key = `examples:${name}`;
  if (!cache.has(key)) {
    cache.set(key, loadFixture(name));
  }
  return cache.get(key);
}
