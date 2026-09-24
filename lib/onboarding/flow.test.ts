import { describe, expect, test } from "bun:test";

import { goalPreview, progressLabel, skipTarget, stepAfter, stepBefore } from "./flow";

describe("step sequencing", () => {
  test("walks welcome → how → health → day → ready and stops at ready", () => {
    expect(stepAfter("welcome")).toBe("how");
    expect(stepAfter("how")).toBe("health");
    expect(stepAfter("health")).toBe("day");
    expect(stepAfter("day")).toBe("ready");
    expect(stepAfter("ready")).toBeNull();
  });

  test("goes back one step, and nowhere from the first", () => {
    expect(stepBefore("ready")).toBe("day");
    expect(stepBefore("how")).toBe("welcome");
    expect(stepBefore("welcome")).toBeNull();
  });

  test("skipping the intro jumps to Apple Health; setup steps can't be skipped past ready", () => {
    expect(skipTarget("welcome")).toBe("health");
    expect(skipTarget("how")).toBe("health");
    expect(skipTarget("health")).toBe("day");
    expect(skipTarget("day")).toBeNull();
    expect(skipTarget("ready")).toBeNull();
  });

  test("progress reads as a 1-based position for VoiceOver", () => {
    expect(progressLabel("welcome")).toBe("Step 1 of 5");
    expect(progressLabel("ready")).toBe("Step 5 of 5");
  });
});

describe("goalPreview", () => {
  test("uses the Health weight and today's exercise, in the chosen unit", () => {
    expect(goalPreview({ weightLb: 180, exerciseMin: 30, unit: "fl-oz" })).toEqual({
      amount: "133 fl oz",
      basis: "From your weight in Apple Health, plus today's exercise.",
    });
  });

  test("without exercise the basis mentions only weight", () => {
    expect(goalPreview({ weightLb: 180, exerciseMin: 0, unit: "ml" }).basis).toBe(
      "From your weight in Apple Health.",
    );
  });

  test("no weight in Health falls back to a 160 lb baseline and says so", () => {
    expect(goalPreview({ weightLb: null, exerciseMin: 0, unit: "fl-oz" })).toEqual({
      amount: "107 fl oz",
      basis: "A starting goal for 160 lb. Add your weight in Apple Health to tailor it.",
    });
  });
});
