import { describe, expect, test } from "bun:test";

import { daysToFetch, evaluateStreak, initialStreakState, type StreakState } from "./evaluate";
import { AXOLOTL_NAMES } from "./names";

const GOAL = 64;

function run(
  state: StreakState,
  today: string,
  intakeByDay: Record<string, number>,
  goalByDay: Record<string, number> = {},
  fallbackGoalFlOz = GOAL,
) {
  return evaluateStreak(state, { today, intakeByDay, goalByDay, fallbackGoalFlOz });
}

/** Start tracking on `day` with nothing drunk yet. */
const installedOn = (day: string) => run(initialStreakState, day, {});

describe("first launch", () => {
  test("nothing drunk yet is an egg", () => {
    expect(installedOn("2026-09-24")).toEqual({
      trackingSince: "2026-09-24",
      judgedThrough: null,
      pet: null,
      graveyard: [],
      longestStreak: 0,
    });
  });

  test("meeting today's goal hatches a pet on streak day 1", () => {
    const s = run(initialStreakState, "2026-09-24", { "2026-09-24": 70 });
    expect(s.pet).toMatchObject({
      hatchedOn: "2026-09-24",
      lastCountedDay: "2026-09-24",
      streakLength: 1,
    });
    expect(AXOLOTL_NAMES).toContain(s.pet!.name);
    expect(s.longestStreak).toBe(1);
  });

  test("meeting the goal exactly counts; a hair under does not", () => {
    expect(run(initialStreakState, "2026-09-24", { "2026-09-24": 64 }).pet?.streakLength).toBe(1);
    expect(run(initialStreakState, "2026-09-24", { "2026-09-24": 63.9 }).pet).toBeNull();
  });

  test("history before install is never judged", () => {
    const s = run(initialStreakState, "2026-09-24", { "2026-09-20": 100, "2026-09-23": 0 });
    expect(s.graveyard).toEqual([]);
    expect(s.pet).toBeNull();
  });
});

describe("extending and breaking a streak", () => {
  test("met 3 consecutive days, missed day 4 -> one grave with streak 3, egg, longest 3", () => {
    let s = installedOn("2026-09-01");
    const intake = { "2026-09-01": 70, "2026-09-02": 64, "2026-09-03": 80, "2026-09-04": 10 };
    s = run(s, "2026-09-05", intake);
    expect(s.pet).toBeNull();
    expect(s.graveyard).toHaveLength(1);
    expect(s.graveyard[0]).toMatchObject({
      hatchedOn: "2026-09-01",
      lastCountedDay: "2026-09-03",
      diedOn: "2026-09-04",
      streakLength: 3,
    });
    expect(s.longestStreak).toBe(3);
    expect(s.judgedThrough).toBe("2026-09-04");
  });

  test("opening the app daily gives the same result as opening it once", () => {
    const intake = {
      "2026-09-01": 70,
      "2026-09-02": 70,
      "2026-09-03": 5,
      "2026-09-04": 70,
      "2026-09-05": 70,
    };
    let daily = installedOn("2026-09-01");
    for (const d of [
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]) {
      daily = run(daily, d, intake);
    }
    const once = run(installedOn("2026-09-01"), "2026-09-06", intake);
    expect(daily).toEqual(once);
    expect(once.pet).toMatchObject({ hatchedOn: "2026-09-04", streakLength: 2 });
    expect(once.graveyard.map((g) => g.streakLength)).toEqual([2]);
  });

  test("today in progress never kills the pet", () => {
    let s = installedOn("2026-09-01");
    s = run(s, "2026-09-03", { "2026-09-01": 70, "2026-09-02": 70 });
    expect(s.pet).toMatchObject({ lastCountedDay: "2026-09-02", streakLength: 2 });
    expect(s.graveyard).toEqual([]);
  });

  test("meeting today's goal extends the streak to day N+1", () => {
    let s = installedOn("2026-09-01");
    s = run(s, "2026-09-03", { "2026-09-01": 70, "2026-09-02": 70, "2026-09-03": 64 });
    expect(s.pet).toMatchObject({ lastCountedDay: "2026-09-03", streakLength: 3 });
    expect(s.longestStreak).toBe(3);
  });

  test("a day with no data at all is a miss", () => {
    let s = installedOn("2026-09-01");
    s = run(s, "2026-09-04", { "2026-09-01": 70, "2026-09-03": 70 });
    expect(s.graveyard).toHaveLength(1);
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-09-02", streakLength: 1 });
    expect(s.pet).toMatchObject({ hatchedOn: "2026-09-03", streakLength: 1 });
  });

  test("midnight rollover judges the day that just ended", () => {
    let s = run(installedOn("2026-09-01"), "2026-09-01", { "2026-09-01": 70 });
    s = run(s, "2026-09-02", { "2026-09-01": 70 }); // 00:00 on the 2nd, nothing yet
    expect(s.judgedThrough).toBe("2026-09-01");
    expect(s.pet).toMatchObject({ streakLength: 1 });
    s = run(s, "2026-09-03", { "2026-09-01": 70, "2026-09-02": 20 });
    expect(s.pet).toBeNull();
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-09-02", streakLength: 1 });
  });
});

describe("app closed for a long time", () => {
  test("a week of misses kills once, and stays an egg until the next counted day", () => {
    let s = installedOn("2026-09-01");
    s = run(s, "2026-09-02", { "2026-09-01": 70, "2026-09-02": 70 });
    s = run(s, "2026-09-10", { "2026-09-01": 70, "2026-09-02": 70 });
    expect(s.graveyard).toHaveLength(1);
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-09-03", streakLength: 2 });
    expect(s.pet).toBeNull();
    expect(s.judgedThrough).toBe("2026-09-09");
  });

  test("a new pet hatches on the first counted day after the break", () => {
    let s = run(installedOn("2026-09-01"), "2026-09-01", { "2026-09-01": 70 });
    s = run(s, "2026-09-10", {
      "2026-09-01": 70,
      "2026-09-07": 70,
      "2026-09-08": 70,
      "2026-09-09": 70,
    });
    expect(s.graveyard).toHaveLength(1);
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-09-02", streakLength: 1 });
    expect(s.pet).toMatchObject({
      hatchedOn: "2026-09-07",
      lastCountedDay: "2026-09-09",
      streakLength: 3,
    });
    expect(s.pet!.id).not.toBe(s.graveyard[0]!.id);
  });

  test("two separate breaks produce two graves in order", () => {
    const s = run(installedOn("2026-09-01"), "2026-09-08", {
      "2026-09-01": 70,
      "2026-09-02": 70,
      "2026-09-04": 70,
      "2026-09-06": 70,
      "2026-09-07": 70,
    });
    expect(s.graveyard.map((g) => [g.hatchedOn, g.diedOn, g.streakLength])).toEqual([
      ["2026-09-01", "2026-09-03", 2],
      ["2026-09-04", "2026-09-05", 1],
    ]);
    expect(s.pet).toMatchObject({ hatchedOn: "2026-09-06", streakLength: 2 });
    expect(new Set([...s.graveyard.map((g) => g.id), s.pet!.id]).size).toBe(3);
  });
});

describe("re-evaluation", () => {
  test("is idempotent for the same inputs", () => {
    const intake = { "2026-09-01": 70, "2026-09-02": 0, "2026-09-03": 70, "2026-09-04": 70 };
    const once = run(installedOn("2026-09-01"), "2026-09-04", intake);
    const twice = run(once, "2026-09-04", intake);
    expect(twice).toEqual(once);
    expect(twice.pet).toMatchObject({ streakLength: 2 });
  });

  test("pet identity (id and name) is stable across re-runs", () => {
    const a = run(initialStreakState, "2026-09-24", { "2026-09-24": 70 });
    const b = run(run(a, "2026-09-24", { "2026-09-24": 10 }), "2026-09-24", { "2026-09-24": 70 });
    expect(b.pet).toEqual(a.pet);
  });

  test("undoing water today after meeting the goal reverts today's count", () => {
    let s = installedOn("2026-09-01");
    s = run(s, "2026-09-02", { "2026-09-01": 70, "2026-09-02": 70 });
    expect(s.pet).toMatchObject({ streakLength: 2 });
    s = run(s, "2026-09-02", { "2026-09-01": 70, "2026-09-02": 50 });
    expect(s.pet).toMatchObject({ lastCountedDay: "2026-09-01", streakLength: 1 });
    expect(s.longestStreak).toBe(1);
  });

  test("undoing water on the hatch day goes back to an egg", () => {
    let s = run(initialStreakState, "2026-09-24", { "2026-09-24": 70 });
    s = run(s, "2026-09-24", { "2026-09-24": 60 });
    expect(s.pet).toBeNull();
    expect(s.longestStreak).toBe(0);
  });

  test("a day counted while in progress is re-judged on its final total", () => {
    let s = run(installedOn("2026-09-01"), "2026-09-01", { "2026-09-01": 70 });
    s = run(s, "2026-09-02", { "2026-09-01": 70, "2026-09-02": 70 }); // counted as today
    // A drink on the 2nd was later deleted from Health; the 2nd ended under goal.
    s = run(s, "2026-09-03", { "2026-09-01": 70, "2026-09-02": 30 });
    expect(s.pet).toBeNull();
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-09-02", streakLength: 1 });
  });

  test("a clock that moved backwards leaves judged history untouched", () => {
    const s = run(installedOn("2026-09-01"), "2026-09-05", {
      "2026-09-01": 70,
      "2026-09-02": 70,
      "2026-09-03": 70,
      "2026-09-04": 70,
    });
    const back = run(s, "2026-09-03", {});
    expect(back.pet).toMatchObject({ lastCountedDay: "2026-09-04", streakLength: 4 });
    expect(back.judgedThrough).toBe("2026-09-04");
    expect(back.graveyard).toEqual([]);
  });
});

describe("goals per day", () => {
  test("each past day is judged against that day's own goal", () => {
    let s = installedOn("2026-09-01");
    s = run(
      s,
      "2026-09-03",
      { "2026-09-01": 70, "2026-09-02": 70 },
      { "2026-09-01": 64, "2026-09-02": 80 },
    );
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-09-02", streakLength: 1 });
  });

  test("raising the goal today does not retroactively fail yesterday", () => {
    let s = installedOn("2026-09-01");
    s = run(
      s,
      "2026-09-03",
      { "2026-09-01": 70, "2026-09-02": 70 },
      { "2026-09-01": 64, "2026-09-02": 64 },
      100,
    );
    expect(s.pet).toMatchObject({ streakLength: 2 });
  });

  test("the fallback goal judges days that have no recorded goal", () => {
    let s = installedOn("2026-09-01");
    s = run(s, "2026-09-03", { "2026-09-01": 70, "2026-09-02": 70 }, { "2026-09-01": 64 }, 90);
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-09-02", streakLength: 1 });
  });
});

describe("DST", () => {
  test("a streak across spring-forward counts every calendar day", () => {
    const s = run(installedOn("2026-03-07"), "2026-03-10", {
      "2026-03-07": 70,
      "2026-03-08": 70,
      "2026-03-09": 70,
    });
    expect(s.pet).toMatchObject({
      hatchedOn: "2026-03-07",
      lastCountedDay: "2026-03-09",
      streakLength: 3,
    });
  });

  test("a miss on the fall-back day is still exactly one day", () => {
    const s = run(installedOn("2026-10-31"), "2026-11-03", { "2026-10-31": 70, "2026-11-02": 70 });
    expect(s.graveyard[0]).toMatchObject({ diedOn: "2026-11-01", streakLength: 1 });
    expect(s.pet).toMatchObject({ hatchedOn: "2026-11-02", streakLength: 1 });
  });
});

describe("longest streak", () => {
  test("survives a death and is not lowered by a shorter new streak", () => {
    const s = run(installedOn("2026-09-01"), "2026-09-08", {
      "2026-09-01": 70,
      "2026-09-02": 70,
      "2026-09-03": 70,
      "2026-09-05": 70,
      "2026-09-06": 70,
    });
    expect(s.longestStreak).toBe(3);
    expect(s.pet).toBeNull();
  });

  test("grows when the living streak passes the record", () => {
    const s = run(installedOn("2026-09-01"), "2026-09-07", {
      "2026-09-01": 70,
      "2026-09-03": 70,
      "2026-09-04": 70,
      "2026-09-05": 70,
      "2026-09-06": 70,
      "2026-09-07": 70,
    });
    expect(s.longestStreak).toBe(5);
  });
});

describe("daysToFetch", () => {
  test("first launch fetches only today", () => {
    expect(daysToFetch(initialStreakState, "2026-09-24")).toEqual({
      from: "2026-09-24",
      to: "2026-09-24",
    });
  });
  test("fetches from the day after the last judged day through today", () => {
    const s = run(installedOn("2026-09-01"), "2026-09-05", {});
    expect(daysToFetch(s, "2026-09-12")).toEqual({ from: "2026-09-05", to: "2026-09-12" });
  });
  test("before anything is judged, fetches from the tracking start", () => {
    expect(daysToFetch(installedOn("2026-09-01"), "2026-09-03")).toEqual({
      from: "2026-09-01",
      to: "2026-09-03",
    });
  });
});
