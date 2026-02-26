/**
 * Tests for endpoint-context classification fallback.
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/50 — F41
 */

import {
  inferResourceTypeFromPath,
  classifyFeature,
} from './classification.js';

// ========================================
// Fixtures — 52North-style null featureType
// ========================================

const NULL_FEATURE_TYPE_FEATURE = {
  type: 'Feature',
  id: '5400-526',
  properties: {
    uid: 'urn:sensor:5400-526',
    name: 'Doppler Current Profiler Sensor',
    featureType: null,
    assetType: null,
    validTime: null,
  },
};

const VALID_SENSOR_FEATURE = {
  type: 'Feature',
  id: 'sensor-1',
  properties: {
    uid: 'urn:sensor:1',
    name: 'Temperature Sensor',
    featureType: 'sosa:Sensor',
  },
};

const VALID_DEPLOYMENT_FEATURE = {
  type: 'Feature',
  id: 'dep-1',
  properties: {
    uid: 'urn:deployment:1',
    name: 'Weather Station Deployment',
    featureType: 'sosa:Deployment',
  },
};

// ========================================
// inferResourceTypeFromPath
// ========================================

describe('inferResourceTypeFromPath', () => {
  it('returns System for /systems path', () => {
    expect(inferResourceTypeFromPath('https://server.com/api/systems')).toBe(
      'System'
    );
  });

  it('returns Deployment for /deployments path', () => {
    expect(
      inferResourceTypeFromPath('https://server.com/api/deployments')
    ).toBe('Deployment');
  });

  it('returns Procedure for /procedures path', () => {
    expect(inferResourceTypeFromPath('https://server.com/api/procedures')).toBe(
      'Procedure'
    );
  });

  it('returns SamplingFeature for /samplingFeatures path', () => {
    expect(
      inferResourceTypeFromPath('https://server.com/api/samplingFeatures')
    ).toBe('SamplingFeature');
  });

  it('returns null for unrecognized path segment', () => {
    expect(
      inferResourceTypeFromPath('https://server.com/api/other')
    ).toBeNull();
  });

  it('ignores query string and fragment', () => {
    expect(
      inferResourceTypeFromPath(
        'https://server.com/api/systems?f=json&limit=10#section'
      )
    ).toBe('System');
  });

  it('handles collection-scoped paths', () => {
    expect(
      inferResourceTypeFromPath(
        'https://server.com/collections/weather/systems'
      )
    ).toBe('System');
  });

  it('handles individual resource paths (resource ID after segment)', () => {
    expect(
      inferResourceTypeFromPath('https://server.com/api/systems/abc-123')
    ).toBe('System');
  });

  it('returns null for empty string', () => {
    expect(inferResourceTypeFromPath('')).toBeNull();
  });

  it('handles path-only input (no scheme)', () => {
    expect(inferResourceTypeFromPath('/api/deployments')).toBe('Deployment');
  });

  it('does not match Part 2 collection segments', () => {
    expect(
      inferResourceTypeFromPath('https://server.com/api/datastreams')
    ).toBeNull();
    expect(
      inferResourceTypeFromPath('https://server.com/api/observations')
    ).toBeNull();
  });
});

// ========================================
// classifyFeature
// ========================================

describe('classifyFeature', () => {
  // Test case 1: featureType null + endpoint hint /systems → System
  it('returns hint when featureType is null', () => {
    expect(classifyFeature(NULL_FEATURE_TYPE_FEATURE, 'System')).toBe('System');
  });

  // Test case 2: featureType null + no hint → null (no guessing)
  it('returns null when featureType is null and no hint provided', () => {
    expect(classifyFeature(NULL_FEATURE_TYPE_FEATURE)).toBeNull();
  });

  // Test case 3: valid featureType → ignores hint, uses featureType
  it('uses featureType classification even when hint differs', () => {
    // featureType: 'sosa:Sensor' → System, hint says Deployment
    expect(classifyFeature(VALID_SENSOR_FEATURE, 'Deployment')).toBe('System');
  });

  // Test case 4: featureType null + endpoint hint /deployments → Deployment
  it('returns Deployment hint when featureType is null', () => {
    expect(classifyFeature(NULL_FEATURE_TYPE_FEATURE, 'Deployment')).toBe(
      'Deployment'
    );
  });

  // Test case 5: existing pure classification unaffected (no regression)
  it('classifies valid featureType without any hint', () => {
    expect(classifyFeature(VALID_DEPLOYMENT_FEATURE)).toBe('Deployment');
  });

  it('returns null when hint is explicitly null', () => {
    expect(classifyFeature(NULL_FEATURE_TYPE_FEATURE, null)).toBeNull();
  });

  it('returns null for non-feature input without hint', () => {
    expect(classifyFeature({ random: 'object' })).toBeNull();
  });

  it('returns hint for non-feature input with hint', () => {
    expect(classifyFeature({ random: 'object' }, 'Procedure')).toBe(
      'Procedure'
    );
  });
});

// ========================================
// Integration: inferResourceTypeFromPath → classifyFeature
// ========================================

describe('end-to-end: path inference → classification', () => {
  it('classifies 52North null-featureType feature from endpoint URL', () => {
    const hint = inferResourceTypeFromPath(
      'https://csa.demo.52north.org/collections/weather/systems'
    );
    expect(classifyFeature(NULL_FEATURE_TYPE_FEATURE, hint)).toBe('System');
  });

  it('valid featureType wins even with URL-inferred hint', () => {
    const hint = inferResourceTypeFromPath(
      'https://server.com/api/deployments'
    );
    // Feature says sosa:Sensor (→ System), URL says /deployments
    expect(classifyFeature(VALID_SENSOR_FEATURE, hint)).toBe('System');
  });

  it('returns null when both featureType and URL are uninformative', () => {
    const hint = inferResourceTypeFromPath('https://server.com/api/other');
    expect(classifyFeature(NULL_FEATURE_TYPE_FEATURE, hint)).toBeNull();
  });
});
