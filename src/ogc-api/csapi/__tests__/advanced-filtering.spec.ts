/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Advanced Filtering Tests (B7)
 * Requirement IDs appear verbatim for traceability.
 * Geometry test is skipped (placeholder until spatial parser exists).
 * Now uses unified fixtures from examples/ directory.
 */

// Import filtering helpers - now automatically uses unified fixtures
const {
  filterSystems,
  filterDeployments,
  filterProcedures,
  filterSamplingFeatures,
  filterPropertyDefs,
  intersection,
  geometryFilterPlaceholder,
  systems,
} = require('../advanced_filtering_helpers');

/* ---------------- /req/advanced-filtering/resource-by-id ---------------- */
describe('/req/advanced-filtering/resource-by-id', () => {
  test('Systems id list', () => {
    const out = filterSystems({ id: ['sys-1', 'sys-3'] });
    expect(out.map((o) => o.id)).toEqual(['sys-1', 'sys-3']);
  });
  test('Deployments wildcard prefix', () => {
    const out = filterDeployments({ id: ['dep-*'] });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((d) => d.id.startsWith('dep-'))).toBe(true);
  });
});

/* ------------- /req/advanced-filtering/resource-by-keyword -------------- */
describe('/req/advanced-filtering/resource-by-keyword', () => {
  test('Systems keyword q', () => {
    const out = filterSystems({ q: 'alpha' });
    expect(out.length).toBe(1);
    expect(out[0].name?.toLowerCase()).toContain('alpha');
  });
});

/* -------------- /req/advanced-filtering/feature-by-geom ----------------- */
describe('/req/advanced-filtering/feature-by-geom', () => {
  test.skip('Geometry placeholder (TODO)', () => {
    const out = geometryFilterPlaceholder(systems, 'POLYGON(...)');
    expect(Array.isArray(out)).toBe(true);
  });
});

/* -------------------------- System-specific filters --------------------- */
describe('System filters', () => {
  test('/req/advanced-filtering/system-by-parent', () => {
    const out = filterSystems({ parent: ['sys-root'] });
    expect(out.every((s) => s.parentId === 'sys-root')).toBe(true);
  });
  test('/req/advanced-filtering/system-by-procedure', () => {
    const out = filterSystems({ procedure: ['proc-2'] });
    expect(out.every((s) => s.procedureIds?.includes('proc-2'))).toBe(true);
  });
  test('/req/advanced-filtering/system-by-foi', () => {
    const out = filterSystems({ foi: ['foi-9'] });
    expect(out.every((s) => s.foiIds?.includes('foi-9'))).toBe(true);
  });
  test('/req/advanced-filtering/system-by-obsprop', () => {
    const out = filterSystems({ observedProperty: ['prop-temp'] });
    expect(out.every((s) => s.observedProperties?.includes('prop-temp'))).toBe(
      true
    );
  });
  test('/req/advanced-filtering/system-by-controlprop', () => {
    const out = filterSystems({ controlledProperty: ['prop-valve'] });
    expect(
      out.every((s) => s.controlledProperties?.includes('prop-valve'))
    ).toBe(true);
  });
});

/* ------------------------ Deployment-specific filters ------------------- */
describe('Deployment filters', () => {
  test('/req/advanced-filtering/deployment-by-parent', () => {
    const out = filterDeployments({ parent: ['dep-root'] });
    expect(out.every((d) => d.parentId === 'dep-root')).toBe(true);
  });
  test('/req/advanced-filtering/deployment-by-system', () => {
    const out = filterDeployments({ system: ['sys-1'] });
    expect(out.every((d) => d.systemIds?.includes('sys-1'))).toBe(true);
  });
  test('/req/advanced-filtering/deployment-by-foi', () => {
    const out = filterDeployments({ foi: ['foi-9'] });
    expect(out.every((d) => d.foiIds?.includes('foi-9'))).toBe(true);
  });
  test('/req/advanced-filtering/deployment-by-obsprop', () => {
    const out = filterDeployments({ observedProperty: ['prop-temp'] });
    expect(out.every((d) => d.observedProperties?.includes('prop-temp'))).toBe(
      true
    );
  });
  test('/req/advanced-filtering/deployment-by-controlprop', () => {
    const out = filterDeployments({ controlledProperty: ['prop-valve'] });
    expect(
      out.every((d) => d.controlledProperties?.includes('prop-valve'))
    ).toBe(true);
  });
});

/* ----------------------- Procedure-specific filters --------------------- */
describe('Procedure filters', () => {
  test('/req/advanced-filtering/procedure-by-obsprop', () => {
    const out = filterProcedures({ observedProperty: ['prop-temp'] });
    expect(out.every((p) => p.observedProperties?.includes('prop-temp'))).toBe(
      true
    );
  });
  test('/req/advanced-filtering/procedure-by-controlprop', () => {
    const out = filterProcedures({ controlledProperty: ['prop-valve'] });
    expect(
      out.every((p) => p.controlledProperties?.includes('prop-valve'))
    ).toBe(true);
  });
});

/* -------------------- Sampling Feature-specific filters ----------------- */
describe('Sampling Feature filters', () => {
  test('/req/advanced-filtering/sf-by-foi', () => {
    const out = filterSamplingFeatures({ foi: ['foi-9'] });
    expect(out.every((sf) => sf.foiIds?.includes('foi-9'))).toBe(true);
  });
  test('/req/advanced-filtering/sf-by-obsprop', () => {
    const out = filterSamplingFeatures({ observedProperty: ['prop-temp'] });
    expect(
      out.every((sf) => sf.observedProperties?.includes('prop-temp'))
    ).toBe(true);
  });
  test('/req/advanced-filtering/sf-by-controlprop', () => {
    const out = filterSamplingFeatures({ controlledProperty: ['prop-valve'] });
    expect(
      out.every((sf) => sf.controlledProperties?.includes('prop-valve'))
    ).toBe(true);
  });
});

/* ---------------------- Property Definition filtering ------------------- */
describe('Property Definition filters', () => {
  test('/req/advanced-filtering/prop-by-baseprop', () => {
    const out = filterPropertyDefs({ baseProperty: ['prop-base-1'] });
    expect(out.every((p) => p.baseProperty === 'prop-base-1')).toBe(true);
  });
  test('/req/advanced-filtering/prop-by-object', () => {
    const out = filterPropertyDefs({ objectType: ['ObjectTypeA'] });
    expect(out.every((p) => p.objectTypes?.includes('ObjectTypeA'))).toBe(true);
  });
});

/* ----------------------------- Combined filters ------------------------- */
describe('/req/advanced-filtering/combined-filters', () => {
  test('Deployments system + FOI AND', () => {
    const bySystem = filterDeployments({ system: ['sys-1'] });
    const byFoi = filterDeployments({ foi: ['foi-9'] });
    const combo = intersection(bySystem, byFoi);
    expect(combo.length).toBeGreaterThan(0);
    expect(
      combo.every(
        (d) =>
          bySystem.some((x) => x.id === d.id) &&
          byFoi.some((y) => y.id === d.id)
      )
    ).toBe(true);
  });

  test('Systems procedure + observedProperty AND', () => {
    const byProc = filterSystems({ procedure: ['proc-2'] });
    const byObs = filterSystems({ observedProperty: ['prop-temp'] });
    const combo = intersection(byProc, byObs);
    expect(combo.length).toBeGreaterThan(0);
    expect(
      combo.every(
        (s) =>
          s.procedureIds?.includes('proc-2') &&
          s.observedProperties?.includes('prop-temp')
      )
    ).toBe(true);
  });
});

/* ---------------------- Negative / edge-case filtering ------------------ */
/**
 * These tests are not tied to a specific requirement ID; they validate
 * robustness of the filtering semantics (AND logic, wildcard miss, empty set).
 */
describe('Advanced Filtering negative / edge cases', () => {
  test('No match for non-existent system id yields empty array', () => {
    const out = filterSystems({ id: ['__no_such_id__'] });
    expect(out).toHaveLength(0);
  });

  test('Wildcard with no matches returns empty array', () => {
    const out = filterDeployments({ id: ['zzz-*'] });
    expect(out).toHaveLength(0);
  });

  test('List filter AND semantics: observedProperty list with one invalid returns empty', () => {
    const out = filterSystems({
      observedProperty: ['prop-temp', '__invalid_prop__'],
    });
    expect(out).toHaveLength(0);
  });

  test('Multiple invalid list values returns empty', () => {
    const out = filterSystems({ observedProperty: ['__bad1__', '__bad2__'] });
    expect(out).toHaveLength(0);
  });

  test('Combined filters with disjoint criteria produce no intersection', () => {
    const byProc = filterSystems({ procedure: ['proc-2'] });
    const byObs = filterSystems({ observedProperty: ['__invalid_prop__'] });
    const combo = intersection(byProc, byObs);
    expect(combo).toHaveLength(0);
  });

  test('Direct multi-filter mismatch (procedure + invalid controlledProperty) yields empty', () => {
    const out = filterSystems({
      procedure: ['proc-2'],
      controlledProperty: ['__invalid_cp__'],
    });
    expect(out).toHaveLength(0);
  });

  test('Case-insensitive keyword positive (ALPHA matches alpha)', () => {
    const out = filterSystems({ q: 'ALPHA' });
    expect(out.length).toBe(1);
    expect(out[0].name?.toLowerCase()).toContain('alpha');
  });

  test('Keyword no match returns empty array', () => {
    const out = filterSystems({ q: 'ZZZ_NO_MATCH' });
    expect(out).toHaveLength(0);
  });

  test('Empty filter object returns all systems (baseline sanity)', () => {
    const out = filterSystems({});
    expect(out.length).toBe(systems.length);
  });

  test('Property Definitions invalid baseProperty returns empty', () => {
    const out = filterPropertyDefs({ baseProperty: ['__invalid_base__'] });
    expect(out).toHaveLength(0);
  });

  test('Multiple invalid single-value filters combined returns empty', () => {
    const out = filterSystems({
      procedure: ['__bad_proc__'],
      foi: ['__bad_foi__'],
      observedProperty: ['__bad_prop__'],
    });
    expect(out).toHaveLength(0);
  });
});
