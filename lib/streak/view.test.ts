import { describe, expect, test } from "bun:test";

import { evaluateStreak, initialStreakState } from "./evaluate";
import { derivePetView } from "./view";
import { dayKeyToDate } from "./day";

const noonOf = (day: string) => new Date(dayKeyToDate(day).setHours(12));

const wake = { hour: 7, minute: 0 };
const bed = { hour: 22, minute: 0 };
const GOAL = 80;

function stateAfter(today: string, intakeByDay: Record<string, number>) {
  const installed = evaluateStreak(initialStreakState, {
    now: noonOf("2026-09-01"),
    intakeByDay: {},
    goalByDay: {},
    fallbackGoalFlOz: GOAL,
  });
  return evaluateStreak(installed, {
    now: noonOf(today),
    intakeByDay,
    goalByDay: {},
    fallbackGoalFlOz: GOAL,
  });
}

describe("derivePetView", () => {
  test("no living pet is an egg with no mood and streak 0, even if behind pace", () => {
    const s = stateAfter("2026-09-01", { "2026-09-01": 0 });
    const v = derivePetView(s, {
      today: "2026-09-01",
      intakeTodayFlOz: 0,
      goalTodayFlOz: GOAL,
      now: new Date(2026, 8, 1, 21, 0),
      wake,
      bed,
    });
    expect(v).toEqual({ kind: "egg", mood: "egg", currentStreak: 0 });
  });

  test("living pet not yet counted today shows yesterday's streak and a pace mood", () => {
    const s = stateAfter("2026-09-03", { "2026-09-01": 80, "2026-09-02": 80, "2026-09-03": 20 });
    const v = derivePetView(s, {
      today: "2026-09-03",
      intakeTodayFlOz: 20,
      goalTodayFlOz: GOAL,
      now: new Date(2026, 8, 3, 14, 30), // expected 40
      wake,
      bed,
    });
    expect(v.kind).toBe("alive");
    expect(v.mood).toBe("thirsty");
    expect(v.currentStreak).toBe(2);
    if (v.kind === "alive") {
      expect(v.countedToday).toBe(false);
      expect(v.pace.expectedFlOz).toBe(40);
    }
  });

  test("goal met today: celebrating, streak includes today", () => {
    const s = stateAfter("2026-09-03", { "2026-09-01": 80, "2026-09-02": 80, "2026-09-03": 80 });
    const v = derivePetView(s, {
      today: "2026-09-03",
      intakeTodayFlOz: 80,
      goalTodayFlOz: GOAL,
      now: new Date(2026, 8, 3, 12, 0),
      wake,
      bed,
    });
    expect(v).toMatchObject({
      kind: "alive",
      mood: "celebrating",
      currentStreak: 3,
      countedToday: true,
    });
  });

  test("late evening behind with a living pet is last-chance", () => {
    const s = stateAfter("2026-09-02", { "2026-09-01": 80, "2026-09-02": 50 });
    const v = derivePetView(s, {
      today: "2026-09-02",
      intakeTodayFlOz: 50,
      goalTodayFlOz: GOAL,
      now: new Date(2026, 8, 2, 21, 30),
      wake,
      bed,
    });
    expect(v).toMatchObject({ kind: "alive", mood: "last-chance", currentStreak: 1 });
  });
});
