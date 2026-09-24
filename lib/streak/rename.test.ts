import { describe, expect, test } from "bun:test";

import { dayKeyToDate } from "./day";
import { evaluateStreak, initialStreakState, type StreakState } from "./evaluate";
import {
  applyNameOverrides,
  countCharacters,
  pruneNameOverrides,
  renamePet,
  validatePetName,
} from "./rename";

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

describe("countCharacters", () => {
  test("with Intl.Segmenter, a ZWJ family and a flag each count as one", () => {
    expect(countCharacters("👨‍👩‍👧", true)).toBe(1);
    expect(countCharacters("🇺🇸", true)).toBe(1);
    expect(countCharacters("Pip🇺🇸", true)).toBe(4);
  });
  test("without Segmenter, falls back to code points", () => {
    expect(countCharacters("👨‍👩‍👧", false)).toBe(5);
    expect(countCharacters("🇺🇸", false)).toBe(2);
    expect(countCharacters("Pip", false)).toBe(3);
  });
  test("validatePetName accepts 20 flags (one character each)", () => {
    const flags = "🇺🇸".repeat(20);
    expect(validatePetName(flags)).toEqual({ ok: true, name: flags });
    expect(validatePetName(flags + "🇺🇸")).toEqual({ ok: false, error: "tooLong" });
  });
});

describe("renamed pet whose hatch day becomes final", () => {
  test("keeps its custom name on the grave after it later dies", () => {
    const hatched = run(run(initialStreakState, "2026-09-20", {}), "2026-09-20", {
      "2026-09-20": 70,
    });
    const { state, overrides } = renamePet(hatched, {}, "Sir Wiggles");
    // Two days on: 09-20 is final (met), 09-21 final (met), pet lives.
    const alive = applyNameOverrides(
      run(state, "2026-09-22", { "2026-09-20": 70, "2026-09-21": 70 }),
      overrides,
    );
    expect(alive.judgedThrough).toBe("2026-09-21");
    expect(alive.pet?.name).toBe("Sir Wiggles");
    // 09-22 missed and becomes final on 09-24: the pet dies.
    const dead = applyNameOverrides(
      run(alive, "2026-09-24", { "2026-09-20": 70, "2026-09-21": 70 }),
      overrides,
    );
    expect(dead.pet).toBeNull();
    expect(dead.graveyard).toEqual([
      {
        id: "2026-09-20#0",
        name: "Sir Wiggles",
        hatchedOn: "2026-09-20",
        lastCountedDay: "2026-09-21",
        diedOn: "2026-09-22",
        streakLength: 2,
      },
    ]);
  });
});

describe("pruneNameOverrides", () => {
  const base = run(run(initialStreakState, "2026-09-20", {}), "2026-09-22", {
    "2026-09-20": 70,
    "2026-09-21": 70,
  });

  test("drops names for pets that are neither alive, buried, nor re-hatchable", () => {
    expect(
      pruneNameOverrides(base, {
        "2026-09-20#0": "Sir Wiggles",
        "2026-08-01#3": "Ghost",
      }),
    ).toEqual({ "2026-09-20#0": "Sir Wiggles" });
  });

  test("keeps names on graves", () => {
    const dead = run(base, "2026-09-24", { "2026-09-20": 70, "2026-09-21": 70 });
    expect(pruneNameOverrides(dead, { "2026-09-20#0": "Sir Wiggles" })).toEqual({
      "2026-09-20#0": "Sir Wiggles",
    });
  });

  test("keeps a name for a tentative hatch that was undone today (it can re-hatch)", () => {
    const egg = run(run(initialStreakState, "2026-09-20", {}), "2026-09-20", {});
    expect(pruneNameOverrides(egg, { "2026-09-20#0": "Sir Wiggles" })).toEqual({
      "2026-09-20#0": "Sir Wiggles",
    });
  });

  test("returns the same object when nothing is pruned", () => {
    const o = { "2026-09-20#0": "Sir Wiggles" };
    expect(pruneNameOverrides(base, o)).toBe(o);
  });
});
