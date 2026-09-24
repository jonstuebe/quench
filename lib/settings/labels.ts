/** Display strings for the Settings screen. */
import { PET_NAME_MAX_LENGTH, type PetNameResult } from "@/lib/streak/rename";

/** HealthKit `AuthorizationStatus` for writing water: 0 not determined, 1 denied, 2 authorized. */
export function healthAccessLabel(status: 0 | 1 | 2): string {
  if (status === 2) return "Saving to Health";
  if (status === 1) return "Off";
  return "Not set up";
}

export function formatWeightLb(lb: number): string {
  return `${Math.round(lb).toLocaleString("en-US")} lb`;
}

export function formatExerciseMinutes(minutes: number): string {
  return `${Math.round(minutes).toLocaleString("en-US")} min`;
}

export function petNameError(error: Extract<PetNameResult, { ok: false }>["error"]): string {
  if (error === "empty") return "Give your axolotl a name.";
  return `Names can be up to ${PET_NAME_MAX_LENGTH} characters.`;
}
