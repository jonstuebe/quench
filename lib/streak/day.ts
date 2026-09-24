import { addDays, differenceInCalendarDays, format, parse } from "date-fns";

/** Local calendar day in `yyyy-MM-dd` form. All streak logic works on these keys. */
export type DayKey = string;

const DAY_KEY_FORMAT = "yyyy-MM-dd";

export function toDayKey(date: Date): DayKey {
  return format(date, DAY_KEY_FORMAT);
}

/** Local midnight that starts `day`. */
export function dayKeyToDate(day: DayKey): Date {
  return parse(day, DAY_KEY_FORMAT, new Date(2000, 0, 1));
}

export function addDaysToKey(day: DayKey, n: number): DayKey {
  return toDayKey(addDays(dayKeyToDate(day), n));
}

/** Calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DayKey, to: DayKey): number {
  return differenceInCalendarDays(dayKeyToDate(to), dayKeyToDate(from));
}

/** Inclusive list of day keys; empty when `from` is after `to`. */
export function dayKeyRange(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let d = from; daysBetween(d, to) >= 0; d = addDaysToKey(d, 1)) out.push(d);
  return out;
}
