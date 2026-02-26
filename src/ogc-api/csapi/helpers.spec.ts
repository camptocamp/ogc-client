import type { BoundingBox } from '../../shared/models.js';
import type { CsapiDateTimeParameter } from './model.js';
import {
  formatDateTimeParameter,
  isValidResourceType,
  assertValidResourceType,
  encodeResourceId,
  scanCsapiLinks,
  validateLimit,
  validateBbox,
} from './helpers.js';

// ========================================
// Temporal Encoding
// ========================================

describe('formatDateTimeParameter', () => {
  const toDate = (str: string) => new Date(str);

  it('serializes a plain Date', () => {
    const result = formatDateTimeParameter(toDate('2024-01-01T00:00:00Z'));
    expect(result).toBe('2024-01-01T00:00:00.000Z');
  });

  it('serializes with only start (open-ended range)', () => {
    const result = formatDateTimeParameter({
      start: toDate('2024-01-01T00:00:00Z'),
    });
    expect(result).toBe('2024-01-01T00:00:00.000Z/..');
  });

  it('serializes with only end (open-ended range)', () => {
    const result = formatDateTimeParameter({
      end: toDate('2024-12-31T23:59:59Z'),
    });
    expect(result).toBe('../2024-12-31T23:59:59.000Z');
  });

  it('serializes start and end interval', () => {
    const result = formatDateTimeParameter({
      start: toDate('2024-01-01T00:00:00Z'),
      end: toDate('2024-12-31T23:59:59Z'),
    });
    expect(result).toBe('2024-01-01T00:00:00.000Z/2024-12-31T23:59:59.000Z');
  });

  it('passes through the "latest" keyword', () => {
    const result = formatDateTimeParameter('latest');
    expect(result).toBe('latest');
  });

  it('throws for an invalid parameter', () => {
    expect(() => formatDateTimeParameter({} as CsapiDateTimeParameter)).toThrow(
      'Invalid CsapiDateTimeParameter'
    );
  });
});

// ========================================
// Resource Type Validation
// ========================================

describe('isValidResourceType', () => {
  it('returns true for all 9 valid resource types', () => {
    const validTypes = [
      'systems',
      'deployments',
      'samplingFeatures',
      'procedures',
      'properties',
      'datastreams',
      'observations',
      'controlStreams',
      'commands',
    ];
    validTypes.forEach((type) => {
      expect(isValidResourceType(type)).toBe(true);
    });
  });

  it('returns false for invalid resource types', () => {
    expect(isValidResourceType('sensors')).toBe(false);
    expect(isValidResourceType('System')).toBe(false);
    expect(isValidResourceType('')).toBe(false);
    expect(isValidResourceType('SYSTEMS')).toBe(false);
  });
});

describe('assertValidResourceType', () => {
  it('does not throw for valid resource types', () => {
    expect(() => assertValidResourceType('systems')).not.toThrow();
    expect(() => assertValidResourceType('observations')).not.toThrow();
  });

  it('throws with descriptive message for invalid types', () => {
    expect(() => assertValidResourceType('invalid')).toThrow(
      'Invalid CSAPI resource type: "invalid"'
    );
    expect(() => assertValidResourceType('invalid')).toThrow(
      'Valid types are:'
    );
  });
});

// ========================================
// URL Encoding
// ========================================

describe('encodeResourceId', () => {
  it('encodes a simple ID unchanged', () => {
    expect(encodeResourceId('sys-001')).toBe('sys-001');
  });

  it('encodes spaces', () => {
    expect(encodeResourceId('my system')).toBe('my%20system');
  });

  it('encodes slashes', () => {
    expect(encodeResourceId('org/sys/001')).toBe('org%2Fsys%2F001');
  });

  it('encodes colons and special characters', () => {
    expect(encodeResourceId('urn:example:sensor:001')).toBe(
      'urn%3Aexample%3Asensor%3A001'
    );
  });

  it('encodes hash and query characters', () => {
    expect(encodeResourceId('id#1?v=2')).toBe('id%231%3Fv%3D2');
  });
});

// ========================================
// Link Scanning
// ========================================

describe('scanCsapiLinks', () => {
  it('returns empty map for empty links array', () => {
    expect(scanCsapiLinks([])).toEqual(new Map());
  });

  it('returns empty map for non-array input', () => {
    expect(scanCsapiLinks(null as unknown as [])).toEqual(new Map());
  });

  it('detects ogc-cs: prefixed link relations', () => {
    const links = [
      { rel: 'ogc-cs:systems', href: 'http://example.com/api/systems' },
      { rel: 'ogc-cs:deployments', href: 'http://example.com/api/deployments' },
    ];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(2);
    expect(result.get('systems')).toBe('http://example.com/api/systems');
    expect(result.get('deployments')).toBe(
      'http://example.com/api/deployments'
    );
  });

  it('detects plain resource name link relations', () => {
    const links = [
      { rel: 'systems', href: 'http://example.com/api/systems' },
      { rel: 'datastreams', href: 'http://example.com/api/datastreams' },
    ];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(2);
    expect(result.get('systems')).toBe('http://example.com/api/systems');
    expect(result.get('datastreams')).toBe(
      'http://example.com/api/datastreams'
    );
  });

  it('detects items links with resource type in href', () => {
    const links = [
      { rel: 'items', href: 'http://example.com/api/systems' },
      { rel: 'items', href: 'http://example.com/api/observations/' },
    ];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(2);
    expect(result.get('systems')).toBe('http://example.com/api/systems');
    expect(result.get('observations')).toBe(
      'http://example.com/api/observations/'
    );
  });

  it('handles mixed conventions in the same links array', () => {
    const links = [
      { rel: 'ogc-cs:systems', href: 'http://example.com/api/systems' },
      { rel: 'deployments', href: 'http://example.com/api/deployments' },
      { rel: 'items', href: 'http://example.com/api/procedures' },
      { rel: 'self', href: 'http://example.com/api' },
    ];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(3);
    expect(result.has('systems')).toBe(true);
    expect(result.has('deployments')).toBe(true);
    expect(result.has('procedures')).toBe(true);
  });

  it('ignores links without string rel', () => {
    const links = [
      { href: 'http://example.com/api/systems' },
      { rel: 123, href: 'http://example.com/api/systems' },
    ] as unknown as Array<{ rel?: string; href?: string }>;
    expect(scanCsapiLinks(links)).toEqual(new Map());
  });

  it('ignores items links with non-resource-type href', () => {
    const links = [{ rel: 'items', href: 'http://example.com/api/widgets' }];
    expect(scanCsapiLinks(links)).toEqual(new Map());
  });

  it('strips query parameters from items href before matching', () => {
    const links = [
      { rel: 'items', href: '/systems?f=application/json' },
      { rel: 'items', href: '/deployments?f=application/json' },
    ];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(2);
    expect(result.get('systems')).toBe('/systems?f=application/json');
    expect(result.get('deployments')).toBe('/deployments?f=application/json');
  });

  it('strips query parameters and trailing slashes from items href', () => {
    const links = [{ rel: 'items', href: '/procedures/?f=application/json' }];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(1);
    expect(result.get('procedures')).toBe('/procedures/?f=application/json');
  });

  it('normalizes featuresOfInterest to samplingFeatures in items href', () => {
    const links = [{ rel: 'items', href: '/featuresOfInterest' }];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(1);
    expect(result.get('samplingFeatures')).toBe('/featuresOfInterest');
  });

  it('normalizes featuresOfInterest with query params to samplingFeatures', () => {
    const links = [
      { rel: 'items', href: '/featuresOfInterest?f=application/json' },
    ];
    const result = scanCsapiLinks(links);
    expect(result.size).toBe(1);
    expect(result.get('samplingFeatures')).toBe(
      '/featuresOfInterest?f=application/json'
    );
  });
});

// ========================================
// Parameter Validation
// ========================================

describe('validateLimit', () => {
  it('accepts positive integers', () => {
    expect(() => validateLimit(1)).not.toThrow();
    expect(() => validateLimit(100)).not.toThrow();
    expect(() => validateLimit(10000)).not.toThrow();
  });

  it('rejects zero', () => {
    expect(() => validateLimit(0)).toThrow('Must be a positive integer');
  });

  it('rejects negative numbers', () => {
    expect(() => validateLimit(-5)).toThrow('Must be a positive integer');
  });

  it('rejects non-integer numbers', () => {
    expect(() => validateLimit(1.5)).toThrow('Must be a positive integer');
  });

  it('rejects NaN', () => {
    expect(() => validateLimit(NaN)).toThrow('Must be a positive integer');
  });
});

describe('validateBbox', () => {
  it('accepts a valid bounding box', () => {
    expect(() => validateBbox([0, 0, 10, 10])).not.toThrow();
  });

  it('accepts equal min/max (point bbox)', () => {
    expect(() => validateBbox([5, 5, 5, 5])).not.toThrow();
  });

  it('accepts negative coordinates', () => {
    expect(() => validateBbox([-180, -90, 180, 90])).not.toThrow();
  });

  it('rejects when minx > maxx', () => {
    expect(() => validateBbox([10, 0, 5, 10] as BoundingBox)).toThrow(
      'minx (10) must be ≤ maxx (5)'
    );
  });

  it('rejects when miny > maxy', () => {
    expect(() => validateBbox([0, 10, 10, 5] as BoundingBox)).toThrow(
      'miny (10) must be ≤ maxy (5)'
    );
  });

  it('rejects non-finite coordinates', () => {
    expect(() => validateBbox([0, 0, Infinity, 10] as BoundingBox)).toThrow(
      'finite numbers'
    );
  });

  it('rejects NaN coordinates', () => {
    expect(() => validateBbox([NaN, 0, 10, 10] as BoundingBox)).toThrow(
      'finite numbers'
    );
  });
});

// ========================================
// Edge Case Tests — Issue #33
// ========================================

// ----------------------------------------
// formatDateTimeParameter edge cases
// ----------------------------------------

describe('formatDateTimeParameter edge cases', () => {
  it('serializes epoch date (1970-01-01)', () => {
    const result = formatDateTimeParameter(new Date('1970-01-01T00:00:00Z'));
    expect(result).toBe('1970-01-01T00:00:00.000Z');
  });

  it('serializes far-future date', () => {
    const result = formatDateTimeParameter(
      new Date('2099-12-31T23:59:59.999Z')
    );
    expect(result).toBe('2099-12-31T23:59:59.999Z');
  });

  it('serializes date with millisecond precision', () => {
    const result = formatDateTimeParameter(
      new Date('2024-06-15T10:30:45.123Z')
    );
    expect(result).toBe('2024-06-15T10:30:45.123Z');
  });

  it('throws for invalid parameter type (plain object with no start/end)', () => {
    expect(() => formatDateTimeParameter({} as CsapiDateTimeParameter)).toThrow(
      'Invalid CsapiDateTimeParameter'
    );
  });

  it('serializes end-only interval with epoch date', () => {
    const result = formatDateTimeParameter({
      end: new Date('1970-01-01T00:00:00Z'),
    });
    expect(result).toBe('../1970-01-01T00:00:00.000Z');
  });

  it('serializes start-only interval with far-future date', () => {
    const result = formatDateTimeParameter({
      start: new Date('2099-01-01T00:00:00Z'),
    });
    expect(result).toBe('2099-01-01T00:00:00.000Z/..');
  });
});

// ----------------------------------------
// isValidResourceType edge cases
// ----------------------------------------

describe('isValidResourceType edge cases', () => {
  it('rejects empty string', () => {
    expect(isValidResourceType('')).toBe(false);
  });

  it('rejects similar but invalid strings', () => {
    expect(isValidResourceType('system')).toBe(false);
    expect(isValidResourceType('Systems')).toBe(false);
    expect(isValidResourceType('SYSTEMS')).toBe(false);
  });

  it('rejects strings with extra whitespace', () => {
    expect(isValidResourceType(' systems')).toBe(false);
    expect(isValidResourceType('systems ')).toBe(false);
  });
});

// ----------------------------------------
// assertValidResourceType edge cases
// ----------------------------------------

describe('assertValidResourceType edge cases', () => {
  it('includes the invalid value in error message', () => {
    expect(() => assertValidResourceType('foo')).toThrow('"foo"');
  });

  it('lists valid types in error message', () => {
    expect(() => assertValidResourceType('invalid')).toThrow('systems');
    expect(() => assertValidResourceType('invalid')).toThrow('deployments');
  });

  it('rejects empty string with descriptive error', () => {
    expect(() => assertValidResourceType('')).toThrow(
      'Invalid CSAPI resource type'
    );
  });
});

// ----------------------------------------
// encodeResourceId edge cases
// ----------------------------------------

describe('encodeResourceId edge cases', () => {
  it('returns empty string for empty input', () => {
    expect(encodeResourceId('')).toBe('');
  });

  it('encodes unicode characters', () => {
    const encoded = encodeResourceId('sensor-日本語');
    expect(encoded).toBe(encodeURIComponent('sensor-日本語'));
  });

  it('double-encodes already-encoded strings', () => {
    const encoded = encodeResourceId('hello%20world');
    expect(encoded).toBe('hello%2520world');
  });

  it('encodes ampersand and equals sign', () => {
    const encoded = encodeResourceId('key=value&foo=bar');
    expect(encoded).toBe('key%3Dvalue%26foo%3Dbar');
  });

  it('preserves unreserved characters', () => {
    const encoded = encodeResourceId('sensor-001_test.v2~draft');
    expect(encoded).toBe('sensor-001_test.v2~draft');
  });
});

// ----------------------------------------
// scanCsapiLinks edge cases
// ----------------------------------------

describe('scanCsapiLinks edge cases', () => {
  it('handles link with rel but missing href (defaults to empty string)', () => {
    const links = [{ rel: 'ogc-cs:systems' } as any];
    const result = scanCsapiLinks(links);
    // Convention 1 stores empty string when href is missing
    expect(result.get('systems')).toBe('');
  });

  it('handles link with href undefined (defaults to empty string)', () => {
    const links = [{ rel: 'ogc-cs:systems', href: undefined } as any];
    const result = scanCsapiLinks(links);
    // Convention 1 stores empty string when href is undefined
    expect(result.get('systems')).toBe('');
  });

  it('deduplicates resource types from multiple link conventions', () => {
    const links = [
      { rel: 'ogc-cs:systems', href: '/api/systems' },
      { rel: 'systems', href: '/v2/systems' },
      { rel: 'items', href: '/systems' },
    ];
    const result = scanCsapiLinks(links);
    // All three refer to "systems" — should be in the map (last wins or first wins depending on impl)
    expect(result.has('systems')).toBe(true);
  });

  it('handles mixed valid and invalid link relations', () => {
    const links = [
      { rel: 'ogc-cs:systems', href: '/systems' },
      { rel: 'ogc-cs:unknown', href: '/unknown' },
      { rel: 'unrelated', href: '/foo' },
      { rel: 'ogc-cs:deployments', href: '/deployments' },
    ];
    const result = scanCsapiLinks(links);
    expect(result.has('systems')).toBe(true);
    expect(result.has('deployments')).toBe(true);
    // ogc-cs: convention 1 stores ANY suffix, not just known types
    expect(result.has('unknown')).toBe(true);
    // Plain 'unrelated' is not a known type, so it's skipped
    expect(result.has('unrelated')).toBe(false);
  });

  it('handles empty array', () => {
    expect(scanCsapiLinks([]).size).toBe(0);
  });
});

// ----------------------------------------
// validateLimit edge cases
// ----------------------------------------

describe('validateLimit edge cases', () => {
  it('rejects Infinity', () => {
    expect(() => validateLimit(Infinity)).toThrow('positive integer');
  });

  it('rejects negative Infinity', () => {
    expect(() => validateLimit(-Infinity)).toThrow('positive integer');
  });

  it('accepts MAX_SAFE_INTEGER', () => {
    expect(() => validateLimit(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it('rejects very small fractional number', () => {
    expect(() => validateLimit(0.001)).toThrow('positive integer');
  });
});

// ----------------------------------------
// validateBbox edge cases
// ----------------------------------------

describe('validateBbox edge cases', () => {
  it('rejects 3-element array', () => {
    expect(() => validateBbox([0, 0, 10] as unknown as BoundingBox)).toThrow(
      '4 coordinates'
    );
  });

  it('rejects 5-element array', () => {
    expect(() =>
      validateBbox([0, 0, 10, 10, 0] as unknown as BoundingBox)
    ).toThrow('4 coordinates');
  });

  it('rejects 6-element array', () => {
    expect(() =>
      validateBbox([0, 0, 0, 10, 10, 10] as unknown as BoundingBox)
    ).toThrow('4 coordinates');
  });

  it('rejects empty array', () => {
    expect(() => validateBbox([] as unknown as BoundingBox)).toThrow(
      '4 coordinates'
    );
  });

  it('rejects negative Infinity coordinates', () => {
    expect(() => validateBbox([-Infinity, 0, 10, 10] as BoundingBox)).toThrow(
      'finite numbers'
    );
  });

  it('accepts point bbox (equal min/max)', () => {
    expect(() => validateBbox([0, 0, 0, 0])).not.toThrow();
  });

  it('accepts global extent bbox', () => {
    expect(() => validateBbox([-180, -90, 180, 90])).not.toThrow();
  });
});
