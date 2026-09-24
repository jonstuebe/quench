import { describe, expect, test } from "bun:test";

import { weekStrip } from "./week";

// Local times (TZ pinned to America/New_York in test/setup.ts).
const at = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h);
const statuses = (w: ReturnType<typeof weekStrip>) =>
  w.days.map((d) => d.status);

describe("weekStrip", () => {
  test("labels run oldest → today and end on today's weekday", () => {
    // 2026-09-24 is a Thursday.
    const w = weekStrip({ now: at(2026, 9, 24), pet: null, todayFraction: 0 });
    expect(w.days.map((d) => d.label)).toEqual([
      "F",
      "S",
      "S",
      "M",
      "T",
      "W",
      "T",
    ]);
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

  test("streak of 0 (egg): no past day is met, today shows the live fraction", () => {
    const w = weekStrip({
      now: at(2026, 9, 24),
      pet: null,
      todayFraction: 0.4,
    });
    expect(statuses(w)).toEqual([
      "missed",
      "missed",
      "missed",
      "missed",
      "missed",
      "missed",
      "today",
    ]);
    expect(w.days[6].fill).toBe(0.4);
    expect(w.metCount).toBe(0);
  });

  test("streak of 3 hatched mid-week: earlier days are pre-hatch", () => {
    // Hatched Monday, counted through Wednesday; today (Thu) not met yet.
    const w = weekStrip({
      now: at(2026, 9, 24),
      pet: { hatchedOn: "2026-09-21", lastCountedDay: "2026-09-23" },
      todayFraction: 0.25,
    });
    expect(statuses(w)).toEqual([
      "prehatch",
      "prehatch",
      "prehatch",
      "met",
      "met",
      "met",
      "today",
    ]);
    expect(w.days.map((d) => d.fill)).toEqual([0, 0, 0, 1, 1, 1, 0.25]);
    expect(w.metCount).toBe(3);
  });

  test("today already met counts as met and fills fully", () => {
    const w = weekStrip({
      now: at(2026, 9, 24),
      pet: { hatchedOn: "2026-09-22", lastCountedDay: "2026-09-24" },
      todayFraction: 0.8, // stale fraction must not under-fill a met day
    });
    expect(w.days[6]).toMatchObject({ status: "today", met: true, fill: 1 });
    expect(w.metCount).toBe(3);
  });

  test("streak of 10+ fills the whole strip", () => {
    const w = weekStrip({
      now: at(2026, 9, 24),
      pet: { hatchedOn: "2026-09-14", lastCountedDay: "2026-09-24" },
      todayFraction: 1,
    });
    expect(w.days.every((d) => d.met && d.fill === 1)).toBe(true);
    expect(w.metCount).toBe(7);
  });

  test("before 04:00 an uncounted yesterday is still pending, not missed", () => {
    const w = weekStrip({
      now: at(2026, 9, 24, 2),
      pet: { hatchedOn: "2026-09-20", lastCountedDay: "2026-09-22" },
      todayFraction: 0,
    });
    expect(statuses(w)).toEqual([
      "prehatch",
      "prehatch",
      "met",
      "met",
      "met",
      "pending",
      "today",
    ]);
  });

  test("from 04:00 an uncounted yesterday is missed", () => {
    const w = weekStrip({
      now: at(2026, 9, 24, 5),
      pet: null,
      todayFraction: 0,
    });
    expect(w.days[5].status).toBe("missed");
  });

  test("steps back across a DST change without skipping or repeating a day", () => {
    // DST ends 2026-11-01 in America/New_York.
    const w = weekStrip({
      now: at(2026, 11, 4, 0),
      pet: { hatchedOn: "2026-10-31", lastCountedDay: "2026-11-03" },
      todayFraction: 0,
    });
    expect(w.days.map((d) => d.key)).toEqual([
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
    ]);
    expect(statuses(w)).toEqual([
      "prehatch",
      "prehatch",
      "met",
      "met",
      "met",
      "met",
      "today",
    ]);
  });
});

describe("weekStripLabel", () => {
  test("summarises streak and week", async () => {
    const { weekStripLabel } = await import("./week");
    expect(weekStripLabel(12, 5)).toBe(
      "12 day streak. This week: 5 of 7 days met",
    );
    expect(weekStripLabel(1, 1)).toBe(
      "1 day streak. This week: 1 of 7 days met",
    );
    expect(weekStripLabel(0, 0)).toBe(
      "No streak yet. This week: 0 of 7 days met",
    );
  });
});
