import { Duration, TimeInterval } from './models.js';

export function parseIso8601Duration(duration: string): Duration {
  const match = duration.match(
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
  );
  if (!match) return null;
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
 * Advance a date by an ISO 8601 duration using calendar arithmetic.
 * Year and month steps clamp the day to the end of the target month,
 * e.g. Jan 31 + P1M gives Feb 28 (or 29).
 */
export function advanceByDuration(date: Date, d: Duration): Date {
  const next = new Date(date.getTime());
  const dayOfMonth = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCFullYear(next.getUTCFullYear() + d.years);
  next.setUTCMonth(next.getUTCMonth() + d.months);
  const daysInMonth = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(dayOfMonth, daysInMonth) + d.days);
  next.setUTCHours(next.getUTCHours() + d.hours);
  next.setUTCMinutes(next.getUTCMinutes() + d.minutes);
  next.setUTCMilliseconds(next.getUTCMilliseconds() + d.seconds * 1000);
  return next;
}

/**
 * Expand a time interval into discrete Date objects; it is advised to specify
 * a maximum of objects to instantiate to avoid performance issues
 */
export function expandTimeInterval(
  interval: TimeInterval,
  maxDatesCount: number = 3650,
): Date[] {
  const dates: Date[] = [];
  const endMs = interval.end.getTime();
  const p = interval.period;
  let current = interval.begin;
  // each step is computed from `begin` so that month-end clamping does not accumulate
  for (
    let k = 1;
    current.getTime() <= endMs && dates.length < maxDatesCount;
    k++
  ) {
    dates.push(current);
    const next = advanceByDuration(interval.begin, {
      years: p.years * k,
      months: p.months * k,
      days: p.days * k,
      hours: p.hours * k,
      minutes: p.minutes * k,
      seconds: p.seconds * k,
    });
    if (next.getTime() <= current.getTime()) break; // zero-length step guard
    current = next;
  }
  return dates;
}
