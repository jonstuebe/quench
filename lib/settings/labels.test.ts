import { describe, expect, test } from "bun:test";

import { formatExerciseMinutes, formatWeightLb, healthAccessLabel, petNameError } from "./labels";

describe("healthAccessLabel", () => {
  test("maps HealthKit water sharing status to a short label", () => {
    expect(healthAccessLabel(0)).toBe("Not set up");
    expect(healthAccessLabel(1)).toBe("Off");
    expect(healthAccessLabel(2)).toBe("Connected");
  });
});

describe("formatWeightLb", () => {
  test("rounds to whole pounds", () => {
    expect(formatWeightLb(160.4)).toBe("160 lb");
    expect(formatWeightLb(180.5)).toBe("181 lb");
  });
});

describe("formatExerciseMinutes", () => {
  test("uses min and singular for one", () => {
    expect(formatExerciseMinutes(0)).toBe("0 min");
    expect(formatExerciseMinutes(1)).toBe("1 min");
    expect(formatExerciseMinutes(42.6)).toBe("43 min");
  });
});

describe("petNameError", () => {
  test("explains each validation failure", () => {
    expect(petNameError("empty")).toBe("Give your axolotl a name.");
    expect(petNameError("tooLong")).toBe("Names can be up to 20 characters.");
  });
});
