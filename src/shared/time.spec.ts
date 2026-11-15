import { expandTimeInterval, parseIso8601Duration } from './time.js';

describe('parseIso8601Duration', () => {
  it('parses days', () => {
    expect(parseIso8601Duration('P1D')).toEqual({
      years: 0,
      months: 0,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
  it('parses hours and minutes', () => {
    expect(parseIso8601Duration('PT1H30M')).toEqual({
      years: 0,
      months: 0,
      days: 0,
      hours: 1,
      minutes: 30,
      seconds: 0,
    });
  });
  it('returns null for garbage', () => {
    expect(parseIso8601Duration('nope')).toEqual(null);
  });
  it('parses month and year periods', () => {
    expect(parseIso8601Duration('P1M')).toEqual({
      years: 0,
      months: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
    expect(parseIso8601Duration('P1Y')).toEqual({
      years: 1,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});

describe('expandTimeInterval', () => {
  it('enumerates a regular interval', () => {
    const dates = expandTimeInterval({
      begin: new Date('2020-01-01T00:00:00Z'),
      end: new Date('2020-01-04T00:00:00Z'),
      period: parseIso8601Duration('P1D'),
    });
    expect(dates.map((d) => d.toISOString())).toEqual([
      '2020-01-01T00:00:00.000Z',
      '2020-01-02T00:00:00.000Z',
      '2020-01-03T00:00:00.000Z',
      '2020-01-04T00:00:00.000Z',
    ]);
  });

  it('enumerates a monthly interval by calendar month', () => {
    const dates = expandTimeInterval({
      begin: new Date('2020-01-01T00:00:00Z'),
      end: new Date('2020-04-01T00:00:00Z'),
      period: parseIso8601Duration('P1M'),
    });
    expect(dates.map((d) => d.toISOString())).toEqual([
      '2020-01-01T00:00:00.000Z',
      '2020-02-01T00:00:00.000Z',
      '2020-03-01T00:00:00.000Z',
      '2020-04-01T00:00:00.000Z',
    ]);
  });

  it('enumerates a yearly interval', () => {
    const dates = expandTimeInterval({
      begin: new Date('2020-01-01T00:00:00Z'),
      end: new Date('2022-01-01T00:00:00Z'),
      period: parseIso8601Duration('P1Y'),
    });
    expect(dates.map((d) => d.toISOString())).toEqual([
      '2020-01-01T00:00:00.000Z',
      '2021-01-01T00:00:00.000Z',
      '2022-01-01T00:00:00.000Z',
    ]);
  });

  it('clamps monthly steps to the end of shorter months', () => {
    const dates = expandTimeInterval({
      begin: new Date('2001-01-31T00:00:00Z'),
      end: new Date('2001-06-30T00:00:00Z'),
      period: parseIso8601Duration('P1M'),
    });
    expect(dates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      '2001-01-31',
      '2001-02-28',
      '2001-03-31',
      '2001-04-30',
      '2001-05-31',
      '2001-06-30',
    ]);
  });

  it('clamps yearly steps from Feb 29', () => {
    const dates = expandTimeInterval({
      begin: new Date('2000-02-29T00:00:00Z'),
      end: new Date('2004-02-29T00:00:00Z'),
      period: parseIso8601Duration('P1Y'),
    });
    expect(dates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      '2000-02-29',
      '2001-02-28',
      '2002-02-28',
      '2003-02-28',
      '2004-02-29',
    ]);
  });

  it('respects the cap', () => {
    const dates = expandTimeInterval(
      {
        begin: new Date('2020-01-01T00:00:00Z'),
        end: new Date('2030-01-01T00:00:00Z'),
        period: parseIso8601Duration('PT1H'),
      },
      5,
    );
    expect(dates).toHaveLength(5);
  });
});
