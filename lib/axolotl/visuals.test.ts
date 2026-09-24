import { describe, expect, test } from "bun:test";

import { moodVisuals, petAccessibilityLabel } from "./visuals";

describe("moodVisuals", () => {
  test("happy is the healthy baseline: perky gills, full colour, open eyes, smile", () => {
    expect(moodVisuals("happy")).toEqual({
      gillDroop: 0,
      saturation: 1,
      tempo: 1,
      smile: 0.8,
      eyes: "open",
      blush: 0.8,
      sparkles: false,
      sweat: false,
      urgency: 0,
    });
  });
  test("celebrating squints with joy, sparkles and bounces faster", () => {
    const v = moodVisuals("celebrating");
    expect(v.eyes).toBe("joy");
    expect(v.sparkles).toBe(true);
    expect(v.tempo).toBe(1.3);
    expect(v.smile).toBe(1);
  });
  test("content is a calmer happy", () => {
    const v = moodVisuals("content");
    expect([v.gillDroop, v.saturation, v.smile, v.eyes]).toEqual([0.1, 0.95, 0.45, "open"]);
  });
  test("thirsty droops the gills a bit and desaturates", () => {
    const v = moodVisuals("thirsty");
    expect([v.gillDroop, v.saturation, v.smile, v.tempo]).toEqual([0.4, 0.7, 0, 0.8]);
  });
  test("parched is faded, droopy, slow and sad-eyed", () => {
    expect(moodVisuals("parched")).toMatchObject({
      gillDroop: 0.85,
      saturation: 0.3,
      tempo: 0.55,
      smile: -0.7,
      eyes: "sad",
      blush: 0,
    });
  });
  test("last-chance sweats and pulses urgently", () => {
    expect(moodVisuals("last-chance")).toMatchObject({
      eyes: "worried",
      sweat: true,
      urgency: 1,
      gillDroop: 0.6,
    });
  });
  test("gills droop monotonically as the pet gets thirstier", () => {
    const order = ["celebrating", "happy", "content", "thirsty", "parched"] as const;
    const droops = order.map((m) => moodVisuals(m).gillDroop);
    expect(droops).toEqual([0, 0, 0.1, 0.4, 0.85]);
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
