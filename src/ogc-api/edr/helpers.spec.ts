import { DateTimeParameter } from '../../shared/models.js';
import { DateTimeParameterToEDRString } from './helpers.js';

describe('DateTimeParameterToEDRString', () => {
  const toDate = (str: string) => new Date(str);

  it('serializes a plain Date', () => {
    const result = DateTimeParameterToEDRString(toDate('2025-01-01T00:00:00Z'));
    expect(result).toBe('2025-01-01T00:00:00.000Z');
  });

  it('serializes with only start', () => {
    const result = DateTimeParameterToEDRString({
      start: toDate('2025-01-01T00:00:00Z'),
    });
    expect(result).toBe('2025-01-01T00:00:00.000Z/..');
  });

  it('serializes with only end', () => {
    const result = DateTimeParameterToEDRString({
      end: toDate('2025-12-31T23:59:59Z'),
    });
    expect(result).toBe('../2025-12-31T23:59:59.000Z');
  });

  it('serializes with start and end', () => {
    const result = DateTimeParameterToEDRString({
      start: toDate('2025-01-01T00:00:00Z'),
      end: toDate('2025-12-31T23:59:59Z'),
    });
    expect(result).toBe('2025-01-01T00:00:00.000Z/2025-12-31T23:59:59.000Z');
  });

  it('throws if passed an invalid object', () => {
    expect(() =>
      DateTimeParameterToEDRString({} as DateTimeParameter)
    ).toThrow();
  });
});
