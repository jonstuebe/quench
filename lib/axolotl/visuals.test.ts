import { describe, expect, test } from "bun:test";

import { moodVisuals, petAccessibilityLabel } from "./visuals";

describe("moodVisuals", () => {
  const decline = ["happy", "content", "thirsty", "parched"] as const;
  const get = (m: (typeof decline)[number] | "celebrating" | "last-chance") => {
    const v = moodVisuals(m);
    if (!v) throw new Error(`no visuals for ${m}`);
    return v;
  };
  const strictlyIncreasing = (xs: number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]);
  const strictlyDecreasing = (xs: number[]) => xs.every((x, i) => i === 0 || x < xs[i - 1]);

  test("gills droop further at each step from happy to parched", () => {
    expect(strictlyIncreasing(decline.map((m) => get(m).gillDroop))).toBe(true);
  });
  test("colour fades at each step from happy to parched", () => {
    expect(strictlyDecreasing(decline.map((m) => get(m).saturation))).toBe(true);
  });
  test("the smile shrinks and the animation slows as thirst grows", () => {
    expect(strictlyDecreasing(decline.map((m) => get(m).smile))).toBe(true);
    expect(strictlyDecreasing(decline.map((m) => get(m).tempo))).toBe(true);
  });
  test("a healthy pet is full colour with perky gills; a parched one frowns", () => {
    expect(get("happy").gillDroop).toBe(0);
    expect(get("happy").saturation).toBe(1);
    expect(get("parched").smile).toBeLessThan(0);
    expect(get("parched").eyes).toBe("sad");
  });
  test("only celebrating sparkles; only last-chance sweats and pulses", () => {
    const all = ["celebrating", ...decline, "last-chance"] as const;
    expect(all.filter((m) => get(m).sparkles)).toEqual(["celebrating"]);
    expect(all.filter((m) => get(m).sweat)).toEqual(["last-chance"]);
    expect(all.filter((m) => get(m).urgency > 0)).toEqual(["last-chance"]);
  });
  test("the egg has no face to draw", () => {
    expect(moodVisuals("egg")).toBeNull();
  });
});

describe("petAccessibilityLabel", () => {
  test("names the pet and its mood", () => {
    expect(petAccessibilityLabel("Mochi", "thirsty")).toBe("Mochi the axolotl, thirsty");
  });
  test("spells out last-chance", () => {
    expect(petAccessibilityLabel("Mochi", "last-chance")).toBe(
      "Mochi the axolotl, very thirsty, needs water before midnight",
    );
  });
  test("describes the egg", () => {
    expect(petAccessibilityLabel(null, "egg")).toBe(
      "An axolotl egg. Meet your goal today to hatch it",
    );
  });
});
