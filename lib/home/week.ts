/** Pure 7-day streak strip derivation for Home (covered by `bun test`). */
import {
  addDaysToKey,
  dayKeyToDate,
  daysBetween,
  toDayKey,
  type DayKey,
} from "@/lib/streak/day";
import { lastFinalDay, type Pet } from "@/lib/streak/evaluate";

/**
 * - `met`: inside the living pet's run (hatch day → last counted day).
 * - `prehatch`: before the living pet hatched (dimmed).
 * - `pending`: yesterday before 04:00, not counted yet but still able to count.
 * - `missed`: final and not met (the previous pet died, or no pet was alive).
 * - `today`: live; `fill` is today's fraction (1 once counted).
 */
export type WeekDayStatus = "met" | "prehatch" | "pending" | "missed" | "today";
export type WeekDay = {
  key: DayKey;
  /** Single-letter weekday, Monday = "M". */
  label: string;
  isToday: boolean;
  status: WeekDayStatus;
  met: boolean;
  /** 0…1 liquid level for the marker. */
  fill: number;
};
export type WeekStrip = { days: WeekDay[]; metCount: number };
export type WeekStripInput = {
  now: Date;
  /** The living pet's run, or null for the egg. */
  pet: Pick<Pet, "hatchedOn" | "lastCountedDay"> | null;
  todayFraction: number;
};

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"]; // indexed by Date#getDay()

/** The last 7 local days, oldest first and ending on today, judged by the streak rules. */
export function weekStrip({
  now,
  pet,
  todayFraction,
}: WeekStripInput): WeekStrip {
  const today = toDayKey(now);
  const finalThrough = lastFinalDay(now);
  const days: WeekDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const key = addDaysToKey(today, -back);
    const inRun =
      !!pet &&
      daysBetween(pet.hatchedOn, key) >= 0 &&
      daysBetween(key, pet.lastCountedDay) >= 0;
    let status: WeekDayStatus;
    if (back === 0) status = "today";
    else if (inRun) status = "met";
    else if (pet && daysBetween(key, pet.hatchedOn) > 0) status = "prehatch";
    else if (daysBetween(finalThrough, key) > 0) status = "pending";
    else status = "missed";
    const fill = inRun ? 1 : back === 0 ? clamp01(todayFraction) : 0;
    days.push({
      key,
      label: LETTERS[dayKeyToDate(key).getDay()],
      isToday: back === 0,
      status,
      met: inRun,
      fill,
    });
  }
  return { days, metCount: days.filter((d) => d.met).length };
}

/** One VoiceOver summary for the whole strip. */
export function weekStripLabel(streak: number, metCount: number): string {
  const head = streak > 0 ? `${streak} day streak` : "No streak yet";
  return `${head}. This week: ${metCount} of 7 days met`;
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
