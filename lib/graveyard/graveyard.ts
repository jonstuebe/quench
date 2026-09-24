/**
 * Pure Graveyard helpers: ordering, stats, record holder, date copy and epitaphs.
 * No RN imports so `bun test` covers them.
 */
import { dayKeyToDate, type DayKey } from "@/lib/streak/day";
import type { Grave } from "@/lib/streak/evaluate";

/** Most recent death first. Same-day deaths keep burial order reversed (later-buried first). */
export function gravesNewestFirst(graves: readonly Grave[]): Grave[] {
  return graves
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (a.g.diedOn === b.g.diedOn ? b.i - a.i : a.g.diedOn < b.g.diedOn ? 1 : -1))
    .map((x) => x.g);
}

/** The Graveyard's hero: the grave that lived longest; a tie goes to whoever died first. */
export function longestLife(graves: readonly Grave[]): Grave | undefined {
  let best: Grave | undefined;
  for (const g of graves) {
    if (
      !best ||
      g.streakLength > best.streakLength ||
      (g.streakLength === best.streakLength && g.diedOn < best.diedOn)
    )
      best = g;
  }
  return best;
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

/** One element per grave: "Mochi, lived 12 days, September 2 to September 14, 2026". */
/** A grave's lifespan for display: hatch day → the day it died. */
export function graveLifespan(g: Grave, locale?: string): string {
  return formatLifespan(g.hatchedOn, g.diedOn, locale);
}

export function graveLifespanSpoken(g: Grave, locale?: string): string {
  return lifespanSpoken(g.hatchedOn, g.diedOn, locale);
}

export function graveAccessibilityLabel(g: Grave, locale?: string): string {
  return `${g.name}, lived ${daysLabel(g.streakLength)}, ${graveLifespanSpoken(g, locale)}`;
}

/** "Tofu, longest life, 23 days. Opens memorial" */
export function heroAccessibilityLabel(g: Grave): string {
  return `${g.name}, longest life, ${daysLabel(g.streakLength)}. Opens memorial`;
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
