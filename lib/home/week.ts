/** Pure 7-day streak strip derivation for Home (covered by `bun test`). */
import { addDaysToKey, dayKeyToDate, daysBetween, toDayKey, type DayKey } from "@/lib/streak/day";
import type { Grave, Pet } from "@/lib/streak/evaluate";

/**
 * - `untracked`: before tracking started; never judged (dimmed).
 * - `met`: inside a pet's run (the living pet's, or a grave's hatch → last counted day).
 * - `missed`: a pet died that day.
 * - `pending`: not judged yet (yesterday before 04:00, or the engine hasn't run this session).
 * - `prehatch`: judged, unmet, and no pet was alive to die (egg days; dimmed).
 * - `today`: live; `fill` is today's fraction, capped below full until the day counts.
 */
export type WeekDayStatus = "untracked" | "met" | "missed" | "pending" | "prehatch" | "today";
export type WeekDay = {
  key: DayKey;
  /** Single-letter weekday, Monday = "M". */
  label: string;
  isToday: boolean;
  status: WeekDayStatus;
  met: boolean;
  /** 0…1 share of the day's goal to show as liquid (see `dropLevel` for glyph height). */
  fill: number;
};
export type WeekStrip = {
  days: WeekDay[];
  metCount: number;
  pendingCount: number;
  /** Today's progress, 0…100 (100 once counted). */
  todayPercent: number;
};
type Run = Pick<Pet, "hatchedOn" | "lastCountedDay">;
export type WeekStripInput = {
  now: Date;
  /** The living pet's run, or null for the egg. */
  pet: Run | null;
  graves: readonly Pick<Grave, "hatchedOn" | "lastCountedDay" | "diedOn">[];
  trackingSince: DayKey | null;
  judgedThrough: DayKey | null;
  todayFraction: number;
};

/** Fill shown for an uncounted today at or over 100%, so it never reads as a counted day. */
export const UNCOUNTED_TODAY_MAX_FILL = 0.9;

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"]; // indexed by Date#getDay()

const within = (key: DayKey, r: Run) =>
  daysBetween(r.hatchedOn, key) >= 0 && daysBetween(key, r.lastCountedDay) >= 0;

/** The last 7 local days, oldest first and ending on today, judged by the streak rules. */
export function weekStrip(input: WeekStripInput): WeekStrip {
  const { now, pet, graves, trackingSince, judgedThrough } = input;
  const today = toDayKey(now);
  const fraction = clamp01(input.todayFraction);
  const runs: Run[] = pet ? [pet, ...graves] : [...graves];
  const days: WeekDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const key = addDaysToKey(today, -back);
    const met = runs.some((r) => within(key, r));
    let status: WeekDayStatus;
    if (back === 0) status = "today";
    else if (met) status = "met";
    else if (!trackingSince || daysBetween(key, trackingSince) > 0) status = "untracked";
    else if (graves.some((g) => g.diedOn === key)) status = "missed";
    else if (!judgedThrough || daysBetween(judgedThrough, key) > 0) status = "pending";
    else status = "prehatch";
    const fill = met ? 1 : back === 0 ? Math.min(fraction, UNCOUNTED_TODAY_MAX_FILL) : 0;
    days.push({
      key,
      label: LETTERS[dayKeyToDate(key).getDay()],
      isToday: back === 0,
      status,
      met,
      fill,
    });
  }
  const todayMet = days[6].met;
  return {
    days,
    metCount: days.filter((d) => d.met).length,
    pendingCount: days.filter((d) => d.status === "pending").length,
    todayPercent: todayMet ? 100 : Math.round(fraction * 100),
  };
}

/** One VoiceOver summary for the whole strip. `streak` is the living pet's streak only. */
export function weekStripLabel(streak: number, week: WeekStrip): string {
  const head = streak > 0 ? `${streak} day streak` : "No streak yet";
  const pending = week.pendingCount > 0 ? `, ${week.pendingCount} still counting` : "";
  const today = week.days[6]?.met ? "Today's goal met" : `Today ${week.todayPercent}%`;
  return `${head}. This week: ${week.metCount} of 7 days met${pending}. ${today}`;
}

/**
 * SF Symbols `drop.fill` doesn't ink its whole square frame: estimated top/bottom padding as
 * a share of the frame. `dropLevel` maps a 0…1 fill onto the inked span so 0 is empty, any
 * water is visible, and 1 reaches the tip.
 */
const DROP_INK_TOP = 0.06;
const DROP_INK_BOTTOM = 0.08;
export function dropLevel(fill: number): number {
  const f = clamp01(fill);
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  return DROP_INK_BOTTOM + f * (1 - DROP_INK_TOP - DROP_INK_BOTTOM);
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
