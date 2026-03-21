import convert from "convert-units";

import type { VolumeDisplayUnit } from "@/lib/types";

/** All math vs HealthKit uses US fluid ounces */
export type FlOz = number;

export function formatVolumeLabel(unit: VolumeDisplayUnit): string {
  switch (unit) {
    case "fl-oz":
      return "fl oz";
    case "ml":
      return "ml";
    case "cup":
      return "cups";
    case "pt_us":
      return "pints";
    default:
      return unit;
  }
}

/** Convert fl oz to the user's display unit */
export function flOzToDisplay(flOz: number, unit: VolumeDisplayUnit): number {
  if (unit === "fl-oz") return Math.round(flOz * 10) / 10;
  const map: Record<VolumeDisplayUnit, "fl-oz" | "ml" | "cup" | "pnt"> = {
    "fl-oz": "fl-oz",
    ml: "ml",
    cup: "cup",
    pt_us: "pnt",
  };
  return convert(flOz).from("fl-oz").to(map[unit]);
}

/**
 * Format a display-unit value (from {@link flOzToDisplay}) for UI: omit unnecessary
 * trailing zeros; max precision depends on unit (e.g. tenths for fl oz, hundredths for ml/cups).
 */
export function formatDisplayVolumeValue(value: number, unit: VolumeDisplayUnit): string {
  const v =
    unit === "fl-oz"
      ? Math.round(value * 10) / 10
      : Math.round(value * 100) / 100;
  const maxFractionDigits = unit === "fl-oz" ? 1 : 2;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  }).format(v);
}

/** Display value → fl oz for HealthKit */
export function displayToFlOz(value: number, unit: VolumeDisplayUnit): number {
  const map: Record<VolumeDisplayUnit, "fl-oz" | "ml" | "cup" | "pnt"> = {
    "fl-oz": "fl-oz",
    ml: "ml",
    cup: "cup",
    pt_us: "pnt",
  };
  return convert(value).from(map[unit]).to("fl-oz");
}

/** Log wheel: step and max in the user's display unit (HealthKit still uses fl oz via displayToFlOz). */
const LOG_AMOUNT_RANGE: Record<VolumeDisplayUnit, { step: number; max: number }> = {
  "fl-oz": { step: 1, max: 64 },
  ml: { step: 50, max: 2000 },
  cup: { step: 0.25, max: 8 },
  pt_us: { step: 0.25, max: 8 },
};

/** Picker options from step to max in display units */
export function buildAmountOptions(displayUnit: VolumeDisplayUnit): number[] {
  const { step, max } = LOG_AMOUNT_RANGE[displayUnit];
  const out: number[] = [];

  switch (displayUnit) {
    case "fl-oz":
      for (let v = step; v <= max; v += step) {
        out.push(flOzToDisplay(v, displayUnit));
      }
      break;
    case "ml":
      for (let v = step; v <= max; v += step) {
        out.push(v);
      }
      break;
    case "cup":
    case "pt_us": {
      const count = Math.round(max / step);
      for (let n = 1; n <= count; n++) {
        out.push(Math.round(n * step * 100) / 100);
      }
      break;
    }
  }

  return out;
}
