import { describe, expect, test } from "bun:test";

import { dayKeyToDate } from "./day";
import { evaluateStreak, initialStreakState, type StreakState } from "./evaluate";
import { applyNameOverrides, renamePet, validatePetName } from "./rename";

const noonOf = (day: string) => new Date(dayKeyToDate(day).setHours(12));
const run = (state: StreakState, today: string, intakeByDay: Record<string, number>) =>
  evaluateStreak(state, { now: noonOf(today), intakeByDay, goalByDay: {}, fallbackGoalFlOz: 64 });

describe("validatePetName", () => {
  test("trims surrounding whitespace", () => {
    expect(validatePetName("  Bubbles  ")).toEqual({ ok: true, name: "Bubbles" });
  });
  test("collapses inner runs of whitespace", () => {
    expect(validatePetName("Sir \t  Wiggles")).toEqual({ ok: true, name: "Sir Wiggles" });
  });
  test("rejects empty and whitespace-only names", () => {
    expect(validatePetName("")).toEqual({ ok: false, error: "empty" });
    expect(validatePetName("   ")).toEqual({ ok: false, error: "empty" });
  });
  test("allows exactly 20 characters, rejects 21", () => {
    expect(validatePetName("abcdefghijklmnopqrst")).toEqual({
      ok: true,
      name: "abcdefghijklmnopqrst",
    });
    expect(validatePetName("abcdefghijklmnopqrstu")).toEqual({ ok: false, error: "tooLong" });
  });
  test("counts an emoji as one character", () => {
    expect(validatePetName("🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎")).toEqual({
      ok: true,
      name: "🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎🦎",
    });
  });
});

describe("renamePet", () => {
  const withPet = run(run(initialStreakState, "2026-09-20", {}), "2026-09-22", {
    "2026-09-21": 70,
    "2026-09-22": 70,
  });

  test("changes the living pet's name but keeps its identity and streak", () => {
    const { state, overrides } = renamePet(withPet, {}, "Sir Wiggles");
    expect(state.pet).toEqual({
      id: "2026-09-21#0",
      name: "Sir Wiggles",
      hatchedOn: "2026-09-21",
      lastCountedDay: "2026-09-22",
      streakLength: 2,
    });
    expect(overrides).toEqual({ "2026-09-21#0": "Sir Wiggles" });
  });

  test("is a no-op when there is no living pet (egg)", () => {
    const egg = run(initialStreakState, "2026-09-20", {});
    const result = renamePet(egg, { old: "Kept" }, "Nobody");
    expect(result.state).toBe(egg);
    expect(result.overrides).toEqual({ old: "Kept" });
  });
});

describe("applyNameOverrides", () => {
  test("a renamed pet keeps its name through re-evaluation", () => {
    const hatchedToday = run(run(initialStreakState, "2026-09-20", {}), "2026-09-20", {
      "2026-09-20": 70,
    });
    const { state, overrides } = renamePet(hatchedToday, {}, "Sir Wiggles");
    const again = applyNameOverrides(run(state, "2026-09-20", { "2026-09-20": 80 }), overrides);
    expect(again.pet?.name).toBe("Sir Wiggles");
  });

  test("survives the tentative hatch being rewound and re-hatched", () => {
    const hatchedToday = run(run(initialStreakState, "2026-09-20", {}), "2026-09-20", {
      "2026-09-20": 70,
    });
    const { state, overrides } = renamePet(hatchedToday, {}, "Sir Wiggles");
    // Drink undone: back to an egg.
    const undone = applyNameOverrides(run(state, "2026-09-20", { "2026-09-20": 10 }), overrides);
    expect(undone.pet).toBeNull();
    // Logged again: the same pet (same seed id) hatches, with the chosen name.
    const rehatched = applyNameOverrides(
      run(undone, "2026-09-20", { "2026-09-20": 70 }),
      overrides,
    );
    expect(rehatched.pet?.id).toBe("2026-09-20#0");
    expect(rehatched.pet?.name).toBe("Sir Wiggles");
  });

  test("the chosen name is carried onto the grave", () => {
    const withPet = run(run(initialStreakState, "2026-09-20", {}), "2026-09-21", {
      "2026-09-20": 70,
    });
    const { state, overrides } = renamePet(withPet, {}, "Sir Wiggles");
    const died = applyNameOverrides(run(state, "2026-09-23", { "2026-09-20": 70 }), overrides);
    expect(died.pet).toBeNull();
    expect(died.graveyard.map((g) => g.name)).toEqual(["Sir Wiggles"]);
  });

  test("is idempotent and returns the same object when nothing changes", () => {
    const withPet = run(run(initialStreakState, "2026-09-20", {}), "2026-09-20", {
      "2026-09-20": 70,
    });
    expect(applyNameOverrides(withPet, {})).toBe(withPet);
    const { state, overrides } = renamePet(withPet, {}, "Sir Wiggles");
    expect(applyNameOverrides(state, overrides)).toBe(state);
  });
});
