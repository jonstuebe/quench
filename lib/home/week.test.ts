import { describe, expect, test } from "bun:test";

import type { Grave } from "@/lib/streak/evaluate";

import { dropLevel, weekStrip, weekStripLabel, type WeekStripInput } from "./week";

// Local times (TZ pinned to America/New_York in test/setup.ts). 2026-09-24 is a Thursday.
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const NOW = at(2026, 9, 24);
const base = (over: Partial<WeekStripInput> = {}): WeekStripInput => ({
  now: NOW,
  pet: null,
  graves: [],
  trackingSince: "2026-08-01",
  judgedThrough: "2026-09-23",
  todayFraction: 0,
  ...over,
});
const statuses = (w: ReturnType<typeof weekStrip>) => w.days.map((d) => d.status);
const grave = (hatchedOn: string, lastCountedDay: string, diedOn: string): Grave => ({
  id: hatchedOn,
  name: "Old",
  hatchedOn,
  lastCountedDay,
  diedOn,
  streakLength: 1,
});

describe("weekStrip", () => {
  test("labels and keys run oldest → today, ending on today's weekday", () => {
    const w = weekStrip(base());
    expect(w.days.map((d) => d.label)).toEqual(["F", "S", "S", "M", "T", "W", "T"]);
    expect(w.days.map((d) => d.key)).toEqual([
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
    ]);
    expect(w.days[6].isToday).toBe(true);
  });

  test("fresh install: days before tracking started are untracked, not missed", () => {
    const w = weekStrip(
      base({
        trackingSince: "2026-09-24",
        judgedThrough: null,
        todayFraction: 0.4,
      }),
    );
    expect(statuses(w)).toEqual([
      "untracked",
      "untracked",
      "untracked",
      "untracked",
      "untracked",
      "untracked",
      "today",
    ]);
    expect(w.metCount).toBe(0);
  });

  test("egg after tracked unmet days with no death: those days are not-alive, not missed", () => {
    const w = weekStrip(base({ trackingSince: "2026-09-21" }));
    expect(statuses(w)).toEqual([
      "untracked",
      "untracked",
      "untracked",
      "prehatch",
      "prehatch",
      "prehatch",
      "today",
    ]);
  });

  test("streak of 3 hatched mid-week", () => {
    const w = weekStrip(
      base({
        pet: { hatchedOn: "2026-09-21", lastCountedDay: "2026-09-23" },
        todayFraction: 0.25,
      }),
    );
    expect(statuses(w)).toEqual(["prehatch", "prehatch", "prehatch", "met", "met", "met", "today"]);
    expect(w.metCount).toBe(3);
  });

  test("previous pet's run is met and its death day is missed", () => {
    const w = weekStrip(
      base({
        graves: [grave("2026-09-10", "2026-09-19", "2026-09-20")],
        pet: { hatchedOn: "2026-09-22", lastCountedDay: "2026-09-23" },
      }),
    );
    expect(statuses(w)).toEqual(["met", "met", "missed", "prehatch", "met", "met", "today"]);
    expect(w.metCount).toBe(4);
  });

  test("streak of 10+ fills the whole strip", () => {
    const w = weekStrip(
      base({
        pet: { hatchedOn: "2026-09-14", lastCountedDay: "2026-09-24" },
        todayFraction: 1,
      }),
    );
    expect(w.days.every((d) => d.met && d.fill === 1)).toBe(true);
    expect(w.metCount).toBe(7);
  });

  test("today counted: full drop even with a lower stale fraction", () => {
    const w = weekStrip(
      base({
        pet: { hatchedOn: "2026-09-22", lastCountedDay: "2026-09-24" },
        todayFraction: 0.8,
      }),
    );
    expect(w.days[6]).toMatchObject({ met: true, fill: 1 });
  });

  test("today not counted never renders full, even at 100%", () => {
    const w = weekStrip(base({ todayFraction: 1 }));
    expect(w.days[6].met).toBe(false);
    expect(w.days[6].fill).toBeLessThan(1);
  });

  test("todayFraction NaN → empty, above 1 → capped", () => {
    expect(weekStrip(base({ todayFraction: Number.NaN })).days[6].fill).toBe(0);
    expect(weekStrip(base({ todayFraction: 3 })).days[6].fill).toBeLessThan(1);
    expect(weekStrip(base({ todayFraction: 3 })).todayPercent).toBe(100);
  });

  test("before 04:00 an uncounted yesterday is pending", () => {
    const w = weekStrip(
      base({
        now: at(2026, 9, 24, 2),
        judgedThrough: "2026-09-22",
        pet: { hatchedOn: "2026-09-20", lastCountedDay: "2026-09-22" },
      }),
    );
    expect(statuses(w)).toEqual(["prehatch", "prehatch", "met", "met", "met", "pending", "today"]);
    expect(w.pendingCount).toBe(1);
  });

  test("before 04:00, counted through yesterday: yesterday is met, not pending", () => {
    const w = weekStrip(
      base({
        now: at(2026, 9, 24, 2),
        judgedThrough: "2026-09-22",
        pet: { hatchedOn: "2026-09-20", lastCountedDay: "2026-09-23" },
      }),
    );
    expect(w.days[5].status).toBe("met");
  });

  test("before 04:00, a gap yesterday with today met: yesterday pending, today counted", () => {
    // Today can only count on top of yesterday in the engine, so a met today after an unmet
    // provisional yesterday means a fresh hatch today (no living pet crossed the gap).
    const w = weekStrip(
      base({
        now: at(2026, 9, 24, 2),
        judgedThrough: "2026-09-22",
        pet: { hatchedOn: "2026-09-24", lastCountedDay: "2026-09-24" },
      }),
    );
    expect(w.days[5].status).toBe("pending");
    expect(w.days[6]).toMatchObject({ met: true, fill: 1 });
  });

  test("exactly 04:00: yesterday's judgement is whatever the engine recorded", () => {
    // At 04:00 yesterday is final; once judged (judgedThrough = yesterday) it is missed.
    const w = weekStrip(
      base({
        now: at(2026, 9, 24, 4),
        judgedThrough: "2026-09-23",
        graves: [grave("2026-09-20", "2026-09-22", "2026-09-23")],
      }),
    );
    expect(w.days[5].status).toBe("missed");
  });

  test("stale lastCountedDay before the session's first evaluation: unjudged days pending", () => {
    // Engine last ran 3 days ago; header still says 12, days since are not missed.
    const w = weekStrip(
      base({
        judgedThrough: "2026-09-20",
        pet: { hatchedOn: "2026-09-09", lastCountedDay: "2026-09-20" },
      }),
    );
    expect(statuses(w)).toEqual(["met", "met", "met", "pending", "pending", "pending", "today"]);
  });

  test("DST end: now on 2026-11-01 steps back one calendar day at a time", () => {
    const w = weekStrip(
      base({
        now: at(2026, 11, 1, 1, 30),
        judgedThrough: "2026-10-30",
        pet: { hatchedOn: "2026-10-20", lastCountedDay: "2026-10-31" },
      }),
    );
    expect(w.days.map((d) => d.key)).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(w.days.map((d) => d.label)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
  });

  test("DST start: now on 2026-03-08 steps back one calendar day at a time", () => {
    const w = weekStrip(
      base({
        now: at(2026, 3, 8, 3, 30),
        trackingSince: "2026-01-01",
        judgedThrough: "2026-03-06",
      }),
    );
    expect(w.days.map((d) => d.key)).toEqual([
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
    ]);
  });
});

describe("weekStripLabel", () => {
  test("streak, honest met count and today's progress", () => {
    const w = weekStrip(
      base({
        graves: [grave("2026-09-10", "2026-09-19", "2026-09-20")],
        pet: { hatchedOn: "2026-09-22", lastCountedDay: "2026-09-23" },
        todayFraction: 0.6,
      }),
    );
    expect(weekStripLabel(2, w)).toBe("2 day streak. This week: 4 of 7 days met. Today 60%");
  });

  test("mentions pending days and a met today", () => {
    const w = weekStrip(
      base({
        now: at(2026, 9, 24, 2),
        judgedThrough: "2026-09-22",
        pet: { hatchedOn: "2026-09-24", lastCountedDay: "2026-09-24" },
      }),
    );
    expect(weekStripLabel(1, w)).toBe(
      "1 day streak. This week: 1 of 7 days met, 1 still counting. Today's goal met",
    );
  });

  test("no streak", () => {
    const w = weekStrip(base({ trackingSince: "2026-09-24", judgedThrough: null }));
    expect(weekStripLabel(0, w)).toBe("No streak yet. This week: 0 of 7 days met. Today 0%");
  });
});

describe("dropLevel", () => {
  test("maps onto the glyph's inked bounds: empty/full stay exact, small fractions show water", () => {
    expect(dropLevel(0)).toBe(0);
    expect(dropLevel(1)).toBe(1);
    expect(dropLevel(0.05)).toBeGreaterThan(0.1);
    expect(dropLevel(0.5)).toBeGreaterThan(0.5);
    expect(dropLevel(0.5)).toBeLessThan(dropLevel(0.6));
  });
});
