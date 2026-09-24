/** Display rounding for amounts shown on Home (progress, mood line, sheet, quick-log). */
import type { VolumeDisplayUnit } from "@/lib/types";
import { flOzToDisplay, formatVolumeLabel } from "@/lib/volume";

/** Whole fl oz / ml, quarter cups / pints. */
const STEP: Record<VolumeDisplayUnit, number> = { "fl-oz": 1, ml: 1, cup: 0.25, pt_us: 0.25 };

const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** A display-unit value rounded to the unit's step. */
export function roundDisplayValue(value: number, unit: VolumeDisplayUnit): number {
  // Clamp negatives / NaN so we never print "-0" or "NaN".
  if (!(value > 0)) return 0;
  return Math.round(value / STEP[unit]) * STEP[unit];
}

/** fl oz → rounded display number in `unit`. */
export function roundedDisplay(flOz: number, unit: VolumeDisplayUnit): number {
  if (!(flOz > 0)) return 0;
  return roundDisplayValue(flOzToDisplay(flOz, unit), unit);
}

/** Format an already-display-unit value, e.g. a preset or picker option. */
export function formatDisplayAmount(value: number, unit: VolumeDisplayUnit): string {
  return withLabel(roundDisplayValue(value, unit), unit);
}

const SINGULAR: Partial<Record<VolumeDisplayUnit, string>> = { cup: "cup", pt_us: "pint" };

function withLabel(rounded: number, unit: VolumeDisplayUnit): string {
  const label =
    rounded === 1 ? (SINGULAR[unit] ?? formatVolumeLabel(unit)) : formatVolumeLabel(unit);
  return `${numberFmt.format(rounded)} ${label}`;
}

export function formatAmountValue(flOz: number, unit: VolumeDisplayUnit): string {
  return numberFmt.format(roundedDisplay(flOz, unit));
}

export function formatAmount(flOz: number, unit: VolumeDisplayUnit): string {
  return withLabel(roundedDisplay(flOz, unit), unit);
}
