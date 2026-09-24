import type { Grave } from "@/lib/streak/evaluate";

/**
 * DEV only. Set true to show `SAMPLE_GRAVES` in the Graveyard tab instead of the real
 * graveyard (display only; never written to persisted state). Keep false in commits.
 */
export const DEV_SAMPLE_GRAVES = false;

/** Oldest first, like the real graveyard. Covers a 1-day life, a tie and a New Year crossing. */
export const SAMPLE_GRAVES: readonly Grave[] = [
  g("Pip", "2025-11-03", "2025-11-03", 1, "2025-11-04"),
  g("Tofu", "2025-12-20", "2026-01-11", 23, "2026-01-12"),
  g("Bean", "2026-02-02", "2026-02-05", 4, "2026-02-06"),
  g("Olive", "2026-03-10", "2026-04-01", 23, "2026-04-02"),
  g("Noodle", "2026-05-14", "2026-05-20", 7, "2026-05-21"),
  g("Marshmallow Wigglesworth", "2026-06-01", "2026-06-02", 2, "2026-06-03"),
  g("Mochi", "2026-09-02", "2026-09-13", 12, "2026-09-14"),
];

function g(name: string, hatchedOn: string, lastCountedDay: string, len: number, diedOn: string) {
  return { id: `${hatchedOn}#${name}`, name, hatchedOn, lastCountedDay, streakLength: len, diedOn };
}
