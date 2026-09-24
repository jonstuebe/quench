import { describe, expect, test } from "bun:test";

import { daysNeedingExercise, pruneGoalSnapshots, resolveGoals } from "./goals";

// Goal formula (lib/health/goal.ts): round(weightLb * 0.67 + 0.4 * exerciseMinutes).
// With weightLb = 100: no exercise -> 67, 10 min -> 71, 30 min -> 79.

describe("daysNeedingExercise", () => {
  test("lists past days in range without a snapshot, never today", () => {
    expect(daysNeedingExercise({ "2026-09-02": 80 }, "2026-09-01", "2026-09-04")).toEqual([
      "2026-09-01",
      "2026-09-03",
    ]);
  });
});

describe("resolveGoals", () => {
  const base = {
    weightLb: 100,
    from: "2026-09-01",
    today: "2026-09-04",
    goalToday: 90,
  };

  test("a snapshot wins over recomputing from exercise", () => {
    const r = resolveGoals({
      ...base,
      snapshots: { "2026-09-02": 55 },
      exerciseByDay: { "2026-09-02": 30 },
    });
    expect(r.goalByDay["2026-09-02"]).toBe(55);
  });

  test("a day without a snapshot is recomputed from that day's exercise", () => {
    const r = resolveGoals({
      ...base,
      snapshots: {},
      exerciseByDay: { "2026-09-01": 30, "2026-09-03": 10 },
    });
    expect(r.goalByDay["2026-09-01"]).toBe(79);
    expect(r.goalByDay["2026-09-03"]).toBe(71);
  });

  test("no snapshot and no exercise falls back to the weight-only base goal", () => {
    const r = resolveGoals({ ...base, snapshots: {}, exerciseByDay: {} });
    expect(r.goalByDay["2026-09-02"]).toBe(67);
  });

  test("today always uses the live goal and is recorded as today's snapshot", () => {
    const r = resolveGoals({
      ...base,
      snapshots: { "2026-09-04": 70, "2026-09-02": 55 },
      exerciseByDay: {},
    });
    expect(r.goalByDay["2026-09-04"]).toBe(90);
    expect(r.snapshots).toEqual({ "2026-09-04": 90, "2026-09-02": 55 });
  });

  test("returns a goal for every day in range", () => {
    const r = resolveGoals({
      ...base,
      snapshots: { "2026-09-02": 55 },
      exerciseByDay: { "2026-09-01": 30 },
    });
    expect(r.goalByDay).toEqual({
      "2026-09-01": 79,
      "2026-09-02": 55,
      "2026-09-03": 67,
      "2026-09-04": 90,
    });
  });
});

describe("pruneGoalSnapshots", () => {
  const snaps = {
    "2026-08-15": 60,
    "2026-08-16": 61,
    "2026-08-30": 62,
    "2026-09-01": 63,
    "2026-09-02": 64,
  };

  test("drops days older than judgedThrough - 14, keeps the rest including unjudged days", () => {
    expect(pruneGoalSnapshots(snaps, "2026-08-30")).toEqual({
      "2026-08-16": 61,
      "2026-08-30": 62,
      "2026-09-01": 63,
      "2026-09-02": 64,
    });
  });

  test("keeps everything when nothing has been judged", () => {
    expect(pruneGoalSnapshots(snaps, null)).toEqual(snaps);
  });
});
