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
      return "pt";
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

/** Picker options: multiples of increment (fl oz) up to max fl oz, shown in display unit */
export function buildAmountOptions(incrementFlOz: 4 | 5, displayUnit: VolumeDisplayUnit): number[] {
  const maxFlOz = incrementFlOz === 4 ? 64 : 100;
  const out: number[] = [];
  for (let f = incrementFlOz; f <= maxFlOz; f += incrementFlOz) {
    out.push(flOzToDisplay(f, displayUnit));
  }
  return out;
}
