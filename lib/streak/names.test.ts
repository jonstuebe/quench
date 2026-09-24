import { describe, expect, test } from "bun:test";

import { AXOLOTL_NAMES, createSeededRng, generateAxolotlName } from "./names";

describe("generateAxolotlName", () => {
  test("rng at 0 picks the first name, rng just under 1 picks the last", () => {
    expect(generateAxolotlName(() => 0)).toBe("Mochi");
    expect(generateAxolotlName(() => 0.999999)).toBe("Zuzu");
  });
  test("rng at 0.5 picks the middle of the list", () => {
    expect(generateAxolotlName(() => 0.5)).toBe("Olive");
    expect(AXOLOTL_NAMES.length).toBeGreaterThanOrEqual(30);
  });
});

describe("createSeededRng", () => {
  test("same seed yields the same sequence", () => {
    const a = createSeededRng("2026-09-24#0");
    const b = createSeededRng("2026-09-24#0");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  test("values are in [0, 1)", () => {
    const r = createSeededRng("x");
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v >= 0 && v < 1).toBe(true);
    }
  });
  test("different seeds spread across many names", () => {
    const names = new Set<string>();
    for (let i = 0; i < 100; i++) names.add(generateAxolotlName(createSeededRng(`seed-${i}`)));
    expect(names.size).toBeGreaterThanOrEqual(20);
  });
});
