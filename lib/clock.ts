import { observable } from "@legendapp/state";

import { toDayKey, type DayKey } from "@/lib/streak/day";

/** Local calendar day the app currently considers "today". Updated by `tickClock()`. */
export const todayKey$ = observable<DayKey>(toDayKey(new Date()));

/** Wall-clock ms, ticked about once a minute while the app is active (drives pace mood). */
export const now$ = observable<number>(Date.now());

/** Advance the clock. Returns true when the local day rolled over. */
export function tickClock(now: Date = new Date()): boolean {
  now$.set(now.getTime());
  const key = toDayKey(now);
  if (key === todayKey$.peek()) return false;
  todayKey$.set(key);
  return true;
}
