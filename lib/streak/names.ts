/** Returns a float in [0, 1). Injected so name generation is deterministic in tests. */
export type Rng = () => number;

/** Ordered list; index is chosen by `floor(rng() * length)`. Keep "Mochi" first and "Zuzu" last. */
export const AXOLOTL_NAMES: readonly string[] = [
  "Mochi",
  "Axel",
  "Bloop",
  "Bubbles",
  "Churro",
  "Dumpling",
  "Frills",
  "Gilly",
  "Guppy",
  "Kelp",
  "Lotl",
  "Marbles",
  "Mango",
  "Noodle",
  "Nori",
  "Olive",
  "Paddle",
  "Peaches",
  "Pickle",
  "Pip",
  "Ripple",
  "Salsa",
  "Sprout",
  "Squish",
  "Taco",
  "Tofu",
  "Waffles",
  "Wiggles",
  "Yuzu",
  "Ziggy",
  "Zuzu",
];

function hashString(s: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 seeded from a string hash. */
export function createSeededRng(seed: string): Rng {
  let a = hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateAxolotlName(rng: Rng): string {
  const i = Math.min(AXOLOTL_NAMES.length - 1, Math.floor(rng() * AXOLOTL_NAMES.length));
  return AXOLOTL_NAMES[i]!;
}
