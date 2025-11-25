/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

import {
  CSAPIResource,
  CSAPICollection,
  CSAPISystem,
  CSAPISystemLink,
  CSAPISystemCollection,
  CSAPIParameter,
} from '../model';

/**
 * CSAPI Model Layer Structural Tests
 *
 * PURPOSE:
 *  - Provide minimal instantiation / shape checks for shared CSAPI model interfaces.
 *  - Make explicit traceability links to meta requirements:
 *      - part1/overview
 *      - part1/collections-meta
 *      - Part 2 §8.1 (Systems model)
 *
 * OUT OF SCOPE:
 *  - Behavioral semantics (filtering, endpoint assembly, link traversal).
 *  - GeoJSON representation (handled elsewhere).
 *  - Exhaustive schema validation.
 *
 * NOTES:
 *  - These tests intentionally remain lightweight; they demonstrate representative object shapes.
 *  - Domain/resource specs perform richer behavioral validation.
 */

/* -------------------------------------------------------------------------- */
/*  part1/overview – base resource semantics                                  */
/* -------------------------------------------------------------------------- */
describe('part1/overview – base resource structure', () => {
  test('CSAPIResource minimal instantiation', () => {
    const resource: CSAPIResource = {
      id: 'sys-001',
      type: 'System',
      customField: 'ok',
    };
    expect(resource.id).toBe('sys-001');
    expect(typeof resource.type).toBe('string');
    expect(resource).toHaveProperty('customField', 'ok');
  });

  test('CSAPISystem extends CSAPIResource with optional fields', () => {
    const system: CSAPISystem = {
      id: 'sys-002',
      type: 'System',
      name: 'Test System',
      status: 'active',
      // description & links omitted intentionally
    };
    expect(system.id).toBe('sys-002');
    expect(system.type).toBe('System');
    expect(system.name).toBe('Test System');
    expect(system).not.toHaveProperty('links');
  });

  test('CSAPISystemLink structure', () => {
    const link: CSAPISystemLink = {
      rel: 'deployment',
      href: 'https://example.org/systems/sys-002/deployments',
      type: 'application/json',
      title: 'Deployments',
    };
    expect(link.rel).toBe('deployment');
    expect(link.href).toMatch(/^https?:\/\//); // basic URL pattern
    expect(link.title).toBe('Deployments');
  });
});

/* -------------------------------------------------------------------------- */
/*  part1/collections-meta – collection semantics                             */
/* -------------------------------------------------------------------------- */
describe('part1/collections-meta – collection structure', () => {
  test('Generic CSAPICollection with arbitrary CSAPIResource items', () => {
    const itemA: CSAPIResource = { id: 'r1', type: 'CustomType' };
    const itemB: CSAPIResource = { id: 'r2', type: 'CustomType', extra: 42 };

    const coll: CSAPICollection<CSAPIResource> = {
      type: 'FeatureCollection',
      itemType: 'CustomType',
      features: [itemA, itemB],
      links: [{ rel: 'self', href: 'https://example.org/custom' }],
    };

    expect(coll.type).toBe('FeatureCollection');
    expect(coll.features).toHaveLength(2);
    expect(coll.itemType).toBe('CustomType');
  });

  test('CSAPISystemCollection specialized itemType and features', () => {
    const sysA: CSAPISystem = { id: 'sys-A', type: 'System', name: 'A' };
    const sysB: CSAPISystem = { id: 'sys-B', type: 'System' };

    const systems: CSAPISystemCollection = {
      type: 'FeatureCollection',
      itemType: 'System',
      features: [sysA, sysB],
      links: [
        { rel: 'self', href: 'https://example.org/systems' },
        { rel: 'system', href: 'https://example.org/systems/sys-A' },
      ],
    };

    expect(systems.type).toBe('FeatureCollection');
    expect(systems.itemType).toBe('System');
    expect(systems.features.every((f) => f.type === 'System')).toBe(true);
  });

  test('Empty collection is structurally valid', () => {
    const emptySystems: CSAPISystemCollection = {
      type: 'FeatureCollection',
      itemType: 'System',
      features: [],
    };
    expect(emptySystems.features).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------------- */
/*  Part 2 §8.1 – Systems model consolidation                                 */
/* -------------------------------------------------------------------------- */
describe('Part 2 §8.1 – Systems model consolidation', () => {
  test('System with links array instantiation', () => {
    const system: CSAPISystem = {
      id: 'sys-links-01',
      type: 'System',
      name: 'Linked System',
      links: [
        { rel: 'deployment', href: 'https://example.org/deployments/d1' },
        { rel: 'procedure', href: 'https://example.org/procedures/p9' },
      ],
    };
    expect(system.links).toBeDefined();
    expect(system.links?.map((l) => l.rel)).toContain('deployment');
  });
});

/* -------------------------------------------------------------------------- */
/*  CSAPIParameter tests (original + minimal variant)                         */
/* -------------------------------------------------------------------------- */
describe('CSAPIParameter basic smoke tests', () => {
  test('CSAPIParameter structure is valid', () => {
    const param: CSAPIParameter = {
      name: 'Elevation',
      description: 'Height above mean sea level',
      required: false,
      schema: {
        type: 'number',
        unit: 'ft',
        minimum: 0,
      },
    };
    expect(param.name).toBe('Elevation');
    expect(param.schema).toHaveProperty('type', 'number');
  });

  test('CSAPIParameter without optional fields', () => {
    const minimal: CSAPIParameter = { name: 'Depth' };
    expect(minimal.name).toBe('Depth');
    expect(minimal).not.toHaveProperty('schema');
  });
});

/* -------------------------------------------------------------------------- */
/*  NOTE: Deliberately limited scope; deeper semantics tested elsewhere.      */
/* -------------------------------------------------------------------------- */
