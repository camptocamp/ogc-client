import { WmsLayerDimension } from './model.js';

/**
 * Resolve the value a dimension should default to: the server's declared
 * default, otherwise the start of the first available value (an interval value
 * is expressed as "start/end/period"). Returns null if none is available.
 */
export function getDimensionDefaultValue(
  dim: WmsLayerDimension
): string | null {
  const candidate = dim.defaultValue || dim.values[0]?.split('/')[0];
  return candidate || null;
}

export type Iso8601Duration = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * Parse an ISO 8601 duration (e.g. "P1Y", "P1M", "P1D", "PT1H", "PT30M").
 * Returns null for an unparseable duration. Years and months are kept separate
 * from the fixed-length fields because they are not constant-length and must be
 * applied by calendar arithmetic (see expandDimensionValues).
 */
export function parseIso8601Duration(duration: string): Iso8601Duration | null {
  const match = duration.match(
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
  );
  // a bare "P" or "PT" matches but carries no fields, which is not a duration
  if (!match || match.slice(1).every((g) => g === undefined)) return null;
  return {
    years: Number(match[1] ?? 0),
    months: Number(match[2] ?? 0),
    days: Number(match[3] ?? 0),
    hours: Number(match[4] ?? 0),
    minutes: Number(match[5] ?? 0),
    seconds: Number(match[6] ?? 0),
  };
}

/**
 * Parse an ISO 8601 duration into milliseconds. Years and months use civil
 * averages (365.25d / 30.44d) and so are approximate; for exact calendar
 * stepping use parseIso8601Duration + advanceByDuration. Returns 0 when
 * unparseable.
 */
export function parseIso8601DurationMs(duration: string): number {
  const d = parseIso8601Duration(duration);
  if (!d) return 0;
  return (
    (d.years * 31557600 +
      d.months * 2629800 +
      d.days * 86400 +
      d.hours * 3600 +
      d.minutes * 60 +
      d.seconds) *
    1000
  );
}

/**
 * Advance a date by an ISO 8601 duration using calendar arithmetic.
 */
function advanceByDuration(date: Date, d: Iso8601Duration): Date {
  const next = new Date(date.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + d.years);
  next.setUTCMonth(next.getUTCMonth() + d.months);
  next.setUTCDate(next.getUTCDate() + d.days);
  next.setUTCHours(next.getUTCHours() + d.hours);
  next.setUTCMinutes(next.getUTCMinutes() + d.minutes);
  next.setUTCMilliseconds(next.getUTCMilliseconds() + d.seconds * 1000);
  return next;
}

const DEFAULT_MAX_VALUES = 3650;

/**
 * Expand a dimension's values into Date objects.
 * Each entry is either a single ISO datetime or an interval "start/end/period".
 * Interval entries are enumerated by their period; capped at `max` entries
 * (default 3650) to avoid runaway expansion on dense series.
 */
export function expandDimensionValues(
  dim: WmsLayerDimension,
  max: number = DEFAULT_MAX_VALUES
): Date[] {
  const dates: Date[] = [];
  for (const value of dim.values) {
    if (dates.length >= max) break;
    const parts = value.split('/');
    if (parts.length === 3) {
      const start = new Date(parts[0]);
      const end = new Date(parts[1]);
      const step = parseIso8601Duration(parts[2]);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || !step) continue;
      const endMs = end.getTime();
      let current = start;
      while (current.getTime() <= endMs) {
        if (dates.length >= max) break;
        dates.push(current);
        const next = advanceByDuration(current, step);
        if (next.getTime() <= current.getTime()) break; // zero-length step guard
        current = next;
      }
    } else {
      const d = new Date(value);
      if (!isNaN(d.getTime())) dates.push(d);
    }
  }
  return dates;
}
