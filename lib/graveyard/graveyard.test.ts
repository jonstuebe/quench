import { describe, expect, test } from "bun:test";

import type { Grave } from "@/lib/streak/evaluate";

import {
  daysLabel,
  epitaphFor,
  formatDayLong,
  formatLifespan,
  graveAccessibilityLabel,
  graveLifespan,
  graveLifespanSpoken,
  graveyardStats,
  gravesNewestFirst,
  lifespanSpoken,
  longestStreakHolder,
} from "./graveyard";

/** A grave; `diedOn` is the missed day (normally the day after `lastCountedDay`). */
const grave = (
  name: string,
  hatchedOn: string,
  lastCountedDay: string,
  len: number,
  diedOn: string,
): Grave => ({
  id: `${hatchedOn}#${name}`,
  name,
  hatchedOn,
  lastCountedDay,
  streakLength: len,
  diedOn,
});

const mochi = grave("Mochi", "2026-09-02", "2026-09-13", 12, "2026-09-14");
const bean = grave("Bean", "2026-01-05", "2026-01-07", 3, "2026-01-08");
const tofu = grave("Tofu", "2025-12-28", "2026-01-03", 7, "2026-01-04");

describe("gravesNewestFirst", () => {
  test("puts the most recent death first without mutating the input", () => {
    const input = [tofu, bean, mochi];
    expect(gravesNewestFirst(input).map((g) => g.name)).toEqual(["Mochi", "Bean", "Tofu"]);
    expect(input.map((g) => g.name)).toEqual(["Tofu", "Bean", "Mochi"]);
  });
  test("keeps later-buried first when two died on the same day", () => {
    const a = grave("A", "2026-03-01", "2026-03-01", 1, "2026-03-02");
    const b = grave("B", "2026-03-01", "2026-03-01", 1, "2026-03-02");
    expect(gravesNewestFirst([a, b]).map((g) => g.name)).toEqual(["B", "A"]);
  });
  test("handles hundreds of graves", () => {
    const many = Array.from({ length: 500 }, (_, i) =>
      grave(`P${i}`, "2026-01-01", "2026-01-01", 1, `2026-0${1 + (i % 9)}-15`),
    );
    const sorted = gravesNewestFirst(many);
    expect(sorted).toHaveLength(500);
    expect(sorted[0].diedOn).toBe("2026-09-15");
    expect(sorted[499].diedOn).toBe("2026-01-15");
  });
});

describe("graveyardStats", () => {
  test("empty graveyard, no pet", () => {
    expect(graveyardStats([], null)).toEqual({ lost: 0, totalDays: 0 });
  });
  test("counts lost axolotls and sums days across every life, including the living one", () => {
    expect(graveyardStats([tofu, bean, mochi], { name: "Dumpling", streakLength: 5 })).toEqual({
      lost: 3,
      totalDays: 27,
    });
  });
});

describe("longestStreakHolder", () => {
  test("nobody holds a zero record", () => {
    expect(longestStreakHolder(0, [], null)).toBeNull();
  });
  test("the grave whose streak matches the record", () => {
    expect(longestStreakHolder(12, [tofu, mochi, bean], null)).toEqual({
      name: "Mochi",
      alive: false,
    });
  });
  test("a tie goes to whoever reached it first (the older grave)", () => {
    const later = grave("Pickle", "2026-05-01", "2026-05-12", 12, "2026-05-13");
    const first = grave("Olive", "2026-02-01", "2026-02-12", 12, "2026-02-13");
    expect(longestStreakHolder(12, [first, later], null)?.name).toBe("Olive");
    // Order-agnostic: the list may already be sorted newest first.
    expect(longestStreakHolder(12, [later, first], null)?.name).toBe("Olive");
  });
  test("no holder when the record belongs to nobody still on record", () => {
    const short = grave("Kiwi", "2026-04-01", "2026-04-12", 12, "2026-04-13");
    expect(longestStreakHolder(20, [short], null)).toBeNull();
  });
  test("the living pet holds it once it has matched the record", () => {
    expect(longestStreakHolder(12, [mochi], { name: "Dumpling", streakLength: 12 })).toEqual({
      name: "Dumpling",
      alive: true,
    });
    expect(longestStreakHolder(12, [mochi], { name: "Dumpling", streakLength: 11 })?.name).toBe(
      "Mochi",
    );
  });
});

describe("formatLifespan", () => {
  test("same year shows the year once", () => {
    expect(formatLifespan("2026-09-02", "2026-09-14", "en-US")).toBe("Sep 2 – Sep 14, 2026");
  });
  test("a year-crossing life shows both years", () => {
    expect(formatLifespan("2025-12-28", "2026-01-03", "en-US")).toBe("Dec 28, 2025 – Jan 3, 2026");
  });
  test("a one-day life is a single date", () => {
    expect(formatLifespan("2026-03-08", "2026-03-08", "en-US")).toBe("Mar 8, 2026");
  });
  test("follows the locale's day/month order", () => {
    expect(formatLifespan("2026-09-02", "2026-09-14", "en-GB")).toBe("2 Sep – 14 Sep 2026");
  });
});

describe("spoken dates", () => {
  test("lifespan reads with full month names", () => {
    expect(lifespanSpoken("2026-09-02", "2026-09-14", "en-US")).toBe(
      "September 2 to September 14, 2026",
    );
    expect(lifespanSpoken("2025-12-28", "2026-01-03", "en-US")).toBe(
      "December 28, 2025 to January 3, 2026",
    );
    expect(lifespanSpoken("2026-03-08", "2026-03-08", "en-US")).toBe("March 8, 2026");
  });
  test("formatDayLong", () => {
    expect(formatDayLong("2026-11-01", "en-US")).toBe("November 1, 2026");
  });
});

describe("daysLabel", () => {
  test("singular and plural", () => {
    expect(daysLabel(1)).toBe("1 day");
    expect(daysLabel(12)).toBe("12 days");
    expect(daysLabel(1200)).toBe("1,200 days");
  });
});

describe("graveLifespan (hatch day to the day it died)", () => {
  test("runs to the death day, not the last full day", () => {
    expect(graveLifespan(mochi, "en-US")).toBe("Sep 2 – Sep 14, 2026");
    expect(graveLifespanSpoken(mochi, "en-US")).toBe("September 2 to September 14, 2026");
  });
  test("a 1-day life spans hatch day and the next day", () => {
    const bit = grave("Bit", "2026-03-08", "2026-03-08", 1, "2026-03-09");
    expect(graveLifespan(bit, "en-US")).toBe("Mar 8 – Mar 9, 2026");
  });
  test("a death just after New Year shows both years", () => {
    expect(graveLifespan(tofu, "en-US")).toBe("Dec 28, 2025 – Jan 4, 2026");
  });
});

describe("graveAccessibilityLabel", () => {
  test("reads a grave as one sentence", () => {
    expect(graveAccessibilityLabel(mochi, "en-US")).toBe(
      "Mochi, lived 12 days, September 2 to September 14, 2026",
    );
    expect(
      graveAccessibilityLabel(grave("Bit", "2026-03-08", "2026-03-08", 1, "2026-03-09"), "en-US"),
    ).toBe("Bit, lived 1 day, March 8 to March 9, 2026");
  });
});

describe("epitaphFor", () => {
  test("is stable for the same grave", () => {
    expect(epitaphFor("2026-09-02#3")).toBe(epitaphFor("2026-09-02#3"));
  });
  test("varies across graves", () => {
    const seen = new Set(Array.from({ length: 30 }, (_, i) => epitaphFor(`2026-01-${i}#${i}`)));
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
  test("always a non-empty line, even for an empty id", () => {
    expect(epitaphFor("").length).toBeGreaterThan(0);
  });
});
