import { describe, expect, test } from "bun:test";

import { moodLine, quickLogPresets, streakChipLabel } from "./copy";

describe("streakChipLabel", () => {
  test("invites a first streak at zero", () => {
    expect(streakChipLabel(0)).toBe("Start your streak");
  });
  test("counts days", () => {
    expect(streakChipLabel(1)).toBe("Day 1");
    expect(streakChipLabel(14)).toBe("Day 14");
  });
});

describe("quickLogPresets", () => {
  test("fl oz", () => expect(quickLogPresets("fl-oz")).toEqual([8, 12, 16]));
  test("ml", () => expect(quickLogPresets("ml")).toEqual([250, 350, 500]));
  test("cups", () => expect(quickLogPresets("cup")).toEqual([0.5, 1, 2]));
  test("pints", () => expect(quickLogPresets("pt_us")).toEqual([0.5, 1, 1.5]));
});

describe("moodLine", () => {
  const base = { name: "Mochi", unit: "fl-oz" as const, remainingFlOz: 20 };
  test("egg", () => {
    expect(moodLine({ ...base, name: null, mood: "egg", behindFlOz: 0 })).toBe(
      "Hit today's goal to hatch your egg",
    );
  });
  test("thirsty mentions the shortfall", () => {
    expect(moodLine({ ...base, mood: "thirsty", behindFlOz: 12 })).toBe(
      "Mochi is getting thirsty — you're 12 fl oz behind",
    );
  });
  test("shortfall is shown in the display unit", () => {
    expect(moodLine({ ...base, unit: "ml", mood: "parched", behindFlOz: 10 })).toBe(
      "Mochi is parched — you're 295.74 ml behind",
    );
  });
  test("happy", () => {
    expect(moodLine({ ...base, mood: "happy", behindFlOz: 0 })).toBe("Mochi is happy and on pace");
  });
  test("content", () => {
    expect(moodLine({ ...base, mood: "content", behindFlOz: 3.5 })).toBe(
      "Mochi is doing fine — 3.5 fl oz to catch up",
    );
  });
  test("last-chance", () => {
    expect(moodLine({ ...base, mood: "last-chance", behindFlOz: 14 })).toBe(
      "Last chance! Drink 20 fl oz before midnight to keep Mochi",
    );
  });
  test("celebrating", () => {
    expect(moodLine({ ...base, mood: "celebrating", behindFlOz: 0, remainingFlOz: 0 })).toBe(
      "Goal met! Mochi is thrilled",
    );
  });
});
