import { describe, expect, test } from "bun:test";

import { calculateWaterGoalFlOz, goalBreakdown } from "./goal";

describe("goalBreakdown", () => {
  test("no exercise: the whole goal comes from weight", () => {
    expect(goalBreakdown(160, 0)).toEqual({
      fromWeightFlOz: 107,
      fromExerciseFlOz: 0,
      totalFlOz: 107,
    });
  });
  test("exercise adds on top of the weight base", () => {
    expect(goalBreakdown(160, 30)).toEqual({
      fromWeightFlOz: 107,
      fromExerciseFlOz: 12,
      totalFlOz: 119,
    });
  });
  test("parts always sum to the goal the app uses, even when rounding splits", () => {
    expect(goalBreakdown(150.5, 45)).toEqual({
      fromWeightFlOz: 101,
      fromExerciseFlOz: 18,
      totalFlOz: 119,
    });
    expect(calculateWaterGoalFlOz(150.5, 45)).toBe(119);
  });
});
