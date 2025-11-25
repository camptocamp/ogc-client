/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * @file helpers.spec.ts
 * Unit tests for extractParameters() in CSAPI helpers.ts.
 *
 * Validates parameter extraction for structured inputs and ensures
 * graceful handling of empty, null, or undefined input.
 *
 * (Note: Updated import path after moving file into __tests__/)
 */

import { extractParameters } from '../helpers';

describe('CSAPI Helper Utilities', () => {
  test('extractParameters returns correct array for Elevation parameter', () => {
    const input = {
      Elevation: {
        name: 'Elevation',
        observedProperty: { label: { id: 'Elevation', en: 'Elevation' } },
        unit: {
          label: { en: 'Elevation' },
          symbol: { value: 'ft', type: 'http://www.opengis.net/def/uom/UCUM/' },
        },
      },
    };

    const result = extractParameters(input);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Elevation');
  });

  test('extractParameters returns correct array for flat object', () => {
    const input: Record<string, unknown> = { a: 1, b: 2, c: 3 };
    const result = extractParameters(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  test('extractParameters handles empty object gracefully', () => {
    const input: Record<string, unknown> = {};
    const result = extractParameters(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('extractParameters handles null or undefined safely', () => {
    expect(
      extractParameters(null as unknown as Record<string, unknown>)
    ).toEqual([]);
    expect(
      extractParameters(undefined as unknown as Record<string, unknown>)
    ).toEqual([]);
  });
});
