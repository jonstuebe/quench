import { describe, expect, test } from "bun:test";

import type { VolumeDisplayUnit } from "@/lib/types";
import { displayToFlOz } from "@/lib/volume";

import { moodLine, quickLogPresets } from "./copy";

describe("quickLogPresets", () => {
  const units: VolumeDisplayUnit[] = ["fl-oz", "ml", "cup", "pt_us"];
  test.each(units)("%s presets are ascending, glass-sized drinks", (unit) => {
    const flOz = quickLogPresets(unit).map((v) => displayToFlOz(v, unit));
    expect(flOz.length).toBeGreaterThanOrEqual(2);
    for (const oz of flOz) {
      expect(oz).toBeGreaterThanOrEqual(4);
      expect(oz).toBeLessThanOrEqual(32);
    }
    expect([...flOz].sort((a, b) => a - b)).toEqual(flOz);
  });
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
    expect(
      moodLine({ ...base, unit: "ml", mood: "parched", behindFlOz: 10 }),
    ).toBe("Mochi is parched — you're 296 ml behind");
  });
  test("happy", () => {
    expect(moodLine({ ...base, mood: "happy", behindFlOz: 0 })).toBe(
      "Mochi is happy and on pace",
    );
  });
  test("content", () => {
    expect(moodLine({ ...base, mood: "content", behindFlOz: 3 })).toBe(
      "Mochi is doing fine — 3 fl oz to catch up",
    );
  });
  test("last-chance", () => {
    expect(moodLine({ ...base, mood: "last-chance", behindFlOz: 14 })).toBe(
      "Last chance! Drink 20 fl oz before midnight to keep Mochi",
    );
  });
  test("celebrating", () => {
    expect(
      moodLine({
        ...base,
        mood: "celebrating",
        behindFlOz: 0,
        remainingFlOz: 0,
      }),
    ).toBe("Goal met! Mochi is thrilled");
  });
  test("rounds fl oz to whole numbers", () => {
    expect(moodLine({ ...base, mood: "content", behindFlOz: 3.6 })).toBe(
      "Mochi is doing fine — 4 fl oz to catch up",
    );
  });
  test("cups round to the nearest quarter", () => {
    expect(
      moodLine({ ...base, unit: "cup", mood: "thirsty", behindFlOz: 11 }),
    ).toBe("Mochi is getting thirsty — you're 1.5 cups behind");
  });
  test("pints round to the nearest quarter", () => {
    expect(
      moodLine({
        ...base,
        unit: "pt_us",
        mood: "last-chance",
        behindFlOz: 0,
        remainingFlOz: 20,
      }),
    ).toBe("Last chance! Drink 1.25 pints before midnight to keep Mochi");
  });
  test("content with a shortfall that rounds to zero reads as on pace", () => {
    expect(moodLine({ ...base, mood: "content", behindFlOz: 0.3 })).toBe(
      "Mochi is right on pace",
    );
  });
  test("thirsty with a shortfall that rounds to zero is just a sip behind", () => {
    expect(moodLine({ ...base, mood: "thirsty", behindFlOz: 0.3 })).toBe(
      "Mochi is getting thirsty — you're just a sip behind",
    );
  });
  test("parched with a shortfall that rounds to zero is just a sip behind", () => {
    expect(moodLine({ ...base, mood: "parched", behindFlOz: 0.2 })).toBe(
      "Mochi is parched — you're just a sip behind",
    );
  });
  test("last-chance with a remainder that rounds to zero asks for one more sip", () => {
    expect(
      moodLine({
        ...base,
        mood: "last-chance",
        behindFlOz: 0.4,
        remainingFlOz: 0.4,
      }),
    ).toBe("Last chance! Just a sip more before midnight to keep Mochi");
  });
  test("an unnamed pet is 'Your axolotl'", () => {
    expect(
      moodLine({ ...base, name: null, mood: "happy", behindFlOz: 0 }),
    ).toBe("Your axolotl is happy and on pace");
  });
});
