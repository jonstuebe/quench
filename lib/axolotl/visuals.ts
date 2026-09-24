/**
 * Pure mood → drawing-parameter mapping for the axolotl. No RN/Skia imports so `bun test`
 * can cover it; the Skia component animates toward these targets.
 */
import type { PetMood } from "@/lib/streak/view";
import type { Mood } from "@/lib/streak/mood";

export type EyeStyle = "open" | "joy" | "sad" | "worried";

export type MoodVisuals = {
  /** 0 = gills fanned up and perky, 1 = fully drooped. */
  gillDroop: number;
  /** Colour saturation multiplier (1 = healthy leucistic pink; lower fades toward grey). */
  saturation: number;
  /** Idle-animation speed multiplier (breathing, bob, gill sway). */
  tempo: number;
  /** Mouth curve, -1 (frown) … 1 (big grin). */
  smile: number;
  eyes: EyeStyle;
  /** Cheek blush opacity 0–1. */
  blush: number;
  sparkles: boolean;
  sweat: boolean;
  /** 0–1: drives the urgent wobble + pulse. */
  urgency: number;
};

const VISUALS: Record<Mood, MoodVisuals> = {
  celebrating: {
    gillDroop: 0,
    saturation: 1.1,
    tempo: 1.3,
    smile: 1,
    eyes: "joy",
    blush: 1,
    sparkles: true,
    sweat: false,
    urgency: 0,
  },
  happy: {
    gillDroop: 0,
    saturation: 1,
    tempo: 1,
    smile: 0.8,
    eyes: "open",
    blush: 0.8,
    sparkles: false,
    sweat: false,
    urgency: 0,
  },
  content: {
    gillDroop: 0.1,
    saturation: 0.95,
    tempo: 0.9,
    smile: 0.45,
    eyes: "open",
    blush: 0.55,
    sparkles: false,
    sweat: false,
    urgency: 0,
  },
  thirsty: {
    gillDroop: 0.4,
    saturation: 0.7,
    tempo: 0.8,
    smile: 0,
    eyes: "open",
    blush: 0.25,
    sparkles: false,
    sweat: false,
    urgency: 0,
  },
  parched: {
    gillDroop: 0.85,
    saturation: 0.3,
    tempo: 0.55,
    smile: -0.7,
    eyes: "sad",
    blush: 0,
    sparkles: false,
    sweat: false,
    urgency: 0,
  },
  "last-chance": {
    gillDroop: 0.6,
    saturation: 0.55,
    tempo: 1.2,
    smile: -0.4,
    eyes: "worried",
    blush: 0,
    sparkles: false,
    sweat: true,
    urgency: 1,
  },
};

export function moodVisuals(mood: Mood): MoodVisuals {
  return VISUALS[mood];
}

const MOOD_WORDS: Record<Mood, string> = {
  celebrating: "celebrating",
  happy: "happy",
  content: "content",
  thirsty: "thirsty",
  parched: "parched",
  "last-chance": "very thirsty, needs water before midnight",
};

export function petAccessibilityLabel(name: string | null, mood: PetMood): string {
  if (mood === "egg") return "An axolotl egg. Meet your goal today to hatch it";
  return `${name ?? "Your"} the axolotl, ${MOOD_WORDS[mood]}`;
}
