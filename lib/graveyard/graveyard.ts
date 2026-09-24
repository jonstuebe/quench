/**
 * Pure Graveyard helpers: ordering, stats, record holder, date copy and epitaphs.
 * No RN imports so `bun test` covers them.
 */
import { dayKeyToDate, type DayKey } from "@/lib/streak/day";
import type { Grave } from "@/lib/streak/evaluate";

export type LivingPetSummary = { name: string; streakLength: number };
export type RecordHolder = { name: string; alive: boolean } | null;
export type GraveyardStats = { lost: number; totalDays: number };

/** Most recent death first. Same-day deaths keep burial order reversed (later-buried first). */
export function gravesNewestFirst(graves: readonly Grave[]): Grave[] {
  return graves
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (a.g.diedOn === b.g.diedOn ? b.i - a.i : a.g.diedOn < b.g.diedOn ? 1 : -1))
    .map((x) => x.g);
}

/** Axolotls lost, and streak days summed across every life (the living pet included). */
export function graveyardStats(
  graves: readonly Grave[],
  pet: LivingPetSummary | null,
): GraveyardStats {
  const past = graves.reduce((sum, g) => sum + g.streakLength, 0);
  return { lost: graves.length, totalDays: past + (pet?.streakLength ?? 0) };
}

/**
 * Who holds the longest streak. The living pet once it has matched the record; otherwise the
 * grave that reached it first (earliest death), whatever the input order.
 */
export function longestStreakHolder(
  longest: number,
  graves: readonly Grave[],
  pet: LivingPetSummary | null,
): RecordHolder {
  if (longest <= 0) return null;
  if (pet && pet.streakLength >= longest) return { name: pet.name, alive: true };
  let g: Grave | undefined;
  for (const x of graves) {
    if (x.streakLength === longest && (!g || x.diedOn < g.diedOn)) g = x;
  }
  return g ? { name: g.name, alive: false } : null;
}

const fmt = (day: DayKey, locale: string | undefined, o: Intl.DateTimeFormatOptions) =>
  dayKeyToDate(day).toLocaleDateString(locale, o);

function range(
  from: DayKey,
  to: DayKey,
  locale: string | undefined,
  month: "short" | "long",
  sep: string,
): string {
  const full = { month, day: "numeric", year: "numeric" } as const;
  if (from === to) return fmt(from, locale, full);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = sameYear ? fmt(from, locale, { month, day: "numeric" }) : fmt(from, locale, full);
  return `${start}${sep}${fmt(to, locale, full)}`;
}

/** "Sep 2 – Sep 14, 2026"; the year shows twice only when the life crossed New Year. */
export function formatLifespan(from: DayKey, to: DayKey, locale?: string): string {
  return range(from, to, locale, "short", " – ");
}

/** VoiceOver form: "September 2 to September 14, 2026". */
export function lifespanSpoken(from: DayKey, to: DayKey, locale?: string): string {
  return range(from, to, locale, "long", " to ");
}

export function formatDayLong(day: DayKey, locale?: string): string {
  return fmt(day, locale, { month: "long", day: "numeric", year: "numeric" });
}

export function daysLabel(n: number): string {
  return `${n.toLocaleString()} ${n === 1 ? "day" : "days"}`;
}

/** One element per grave: "Mochi, lived 12 days, September 2 to September 13, 2026". */
export function graveAccessibilityLabel(g: Grave, locale?: string): string {
  return `${g.name}, lived ${daysLabel(g.streakLength)}, ${lifespanSpoken(g.hatchedOn, g.lastCountedDay, locale)}`;
}

const EPITAPHS = [
  "Loved a good glass of water",
  "Never met a puddle it didn't like",
  "Gills up, always",
  "Swam off to a bigger pond",
  "Forever hydrated in our hearts",
  "Sipped slowly, smiled often",
  "Dreaming of cool, clear water",
  "Here lies a very good friend",
  "Rest easy, little one",
  "Still blowing bubbles somewhere",
];

/** Deterministic per grave id (FNV-1a), so a grave's epitaph never changes. */
export function epitaphFor(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return EPITAPHS[h % EPITAPHS.length];
}
