/** Pure copy + preset helpers for the Home tab (covered by `bun test`). */
import type { PetMood } from "@/lib/streak/view";
import type { VolumeDisplayUnit } from "@/lib/types";
import { flOzToDisplay, formatDisplayVolumeValue, formatVolumeLabel } from "@/lib/volume";

export function streakChipLabel(currentStreak: number): string {
  return currentStreak > 0 ? `Day ${currentStreak}` : "Start your streak";
}

/** One-tap amounts on the quick-log bar, in the user's display unit. */
const PRESETS: Record<VolumeDisplayUnit, number[]> = {
  "fl-oz": [8, 12, 16],
  ml: [250, 350, 500],
  cup: [0.5, 1, 2],
  pt_us: [0.5, 1, 1.5],
};

export function quickLogPresets(unit: VolumeDisplayUnit): number[] {
  return PRESETS[unit];
}

export type MoodLineInput = {
  mood: PetMood;
  name: string | null;
  unit: VolumeDisplayUnit;
  /** fl oz behind an even pace right now. */
  behindFlOz: number;
  /** fl oz still needed to reach today's goal. */
  remainingFlOz: number;
};

/** One short sentence under the progress readout. */
export function moodLine({ mood, name, unit, behindFlOz, remainingFlOz }: MoodLineInput): string {
  const amount = (flOz: number) =>
    `${formatDisplayVolumeValue(flOzToDisplay(flOz, unit), unit)} ${formatVolumeLabel(unit)}`;
  const pet = name ?? "Your axolotl";
  switch (mood) {
    case "egg":
      return "Hit today's goal to hatch your egg";
    case "celebrating":
      return `Goal met! ${pet} is thrilled`;
    case "happy":
      return `${pet} is happy and on pace`;
    case "content":
      return `${pet} is doing fine — ${amount(behindFlOz)} to catch up`;
    case "thirsty":
      return `${pet} is getting thirsty — you're ${amount(behindFlOz)} behind`;
    case "parched":
      return `${pet} is parched — you're ${amount(behindFlOz)} behind`;
    case "last-chance":
      return `Last chance! Drink ${amount(remainingFlOz)} before midnight to keep ${pet}`;
  }
}
