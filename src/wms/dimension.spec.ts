import {
  getDimensionDefaultValue,
  expandDimensionValues,
  parseIso8601DurationMs,
} from './dimension.js';
import { WmsLayerDimension } from './model.js';

function dim(partial: Partial<WmsLayerDimension>): WmsLayerDimension {
  return {
    name: 'time',
    units: 'ISO8601',
    defaultValue: '',
    values: [],
    nearestValue: false,
    multipleValues: false,
    current: false,
    ...partial,
  };
}

describe('getDimensionDefaultValue', () => {
  it('returns the declared default', () => {
    expect(getDimensionDefaultValue(dim({ defaultValue: '2020-01-01' }))).toBe(
      '2020-01-01'
    );
  });

  it('falls back to the start of the first value', () => {
    expect(
      getDimensionDefaultValue(dim({ values: ['2020-01-01/2020-12-31/P1M'] }))
    ).toBe('2020-01-01');
  });

  it('returns null when nothing is available', () => {
    expect(getDimensionDefaultValue(dim({}))).toBeNull();
  });
});

describe('parseIso8601DurationMs', () => {
  it('parses days', () => {
    expect(parseIso8601DurationMs('P1D')).toBe(86400000);
  });
  it('parses hours and minutes', () => {
    expect(parseIso8601DurationMs('PT1H30M')).toBe((3600 + 1800) * 1000);
  });
  it('returns 0 for garbage', () => {
    expect(parseIso8601DurationMs('nope')).toBe(0);
  });
  it('parses month and year periods', () => {
    expect(parseIso8601DurationMs('P1M')).toBeGreaterThan(0);
    expect(parseIso8601DurationMs('P1Y')).toBeGreaterThan(0);
  });
});

describe('expandDimensionValues', () => {
  it('enumerates a regular interval', () => {
    const dates = expandDimensionValues(
      dim({ values: ['2020-01-01T00:00:00Z/2020-01-04T00:00:00Z/P1D'] })
    );
    expect(dates.map((d) => d.toISOString())).toEqual([
      '2020-01-01T00:00:00.000Z',
      '2020-01-02T00:00:00.000Z',
      '2020-01-03T00:00:00.000Z',
      '2020-01-04T00:00:00.000Z',
    ]);
  });

  it('enumerates a monthly interval by calendar month, not fixed ms', () => {
    const dates = expandDimensionValues(
      dim({ values: ['2020-01-01T00:00:00Z/2020-04-01T00:00:00Z/P1M'] })
    );
    // calendar stepping lands on real month boundaries, not 30.44d drift
    expect(dates.map((d) => d.toISOString())).toEqual([
      '2020-01-01T00:00:00.000Z',
      '2020-02-01T00:00:00.000Z',
      '2020-03-01T00:00:00.000Z',
      '2020-04-01T00:00:00.000Z',
    ]);
  });

  it('enumerates a yearly interval', () => {
    const dates = expandDimensionValues(
      dim({ values: ['2020-01-01T00:00:00Z/2022-01-01T00:00:00Z/P1Y'] })
    );
    expect(dates.map((d) => d.toISOString())).toEqual([
      '2020-01-01T00:00:00.000Z',
      '2021-01-01T00:00:00.000Z',
      '2022-01-01T00:00:00.000Z',
    ]);
  });

  it('passes through enumerated single values', () => {
    const dates = expandDimensionValues(
      dim({ values: ['2020-01-01T00:00:00Z', '2020-06-01T00:00:00Z'] })
    );
    expect(dates).toHaveLength(2);
  });

  it('skips unparseable intervals', () => {
    expect(expandDimensionValues(dim({ values: ['bad/worse/P1D'] }))).toEqual(
      []
    );
  });

  it('respects the cap', () => {
    const dates = expandDimensionValues(
      dim({ values: ['2020-01-01T00:00:00Z/2030-01-01T00:00:00Z/PT1H'] }),
      5
    );
    expect(dates).toHaveLength(5);
  });
});
