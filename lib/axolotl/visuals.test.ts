import { describe, expect, test } from "bun:test";

import { ghostVisuals, moodVisuals, petAccessibilityLabel } from "./visuals";

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

describe("ghostVisuals", () => {
  test("a ghost rests: eyes closed, faint smile, no motion or effects", () => {
    const g = ghostVisuals(7);
    expect(g.eyes).toBe("closed");
    expect(g.tempo).toBe(0);
    expect(g.smile).toBeGreaterThan(0);
    expect(g.smile).toBeLessThan(0.5);
    expect(g.sparkles).toBe(false);
    expect(g.sweat).toBe(false);
    expect(g.urgency).toBe(0);
  });
  test("paler than even a parched pet, and translucent", () => {
    const g = ghostVisuals(7);
    expect(g.saturation).toBeLessThan(moodVisuals("parched")!.saturation);
    expect(g.opacity).toBeGreaterThan(0.5);
    expect(g.opacity).toBeLessThan(1);
  });
  test("the halo glows brighter for longer lives, capped at a month", () => {
    expect(ghostVisuals(1).halo).toBe(0.35);
    expect(ghostVisuals(10).halo).toBeGreaterThan(0.35);
    expect(ghostVisuals(10).halo).toBeLessThan(ghostVisuals(20).halo);
    expect(ghostVisuals(30).halo).toBe(1);
    expect(ghostVisuals(400).halo).toBe(1);
  });
  test("a nonsensical length still yields the dimmest halo", () => {
    expect(ghostVisuals(0).halo).toBe(0.35);
    expect(ghostVisuals(Number.NaN).halo).toBe(0.35);
  });
});
