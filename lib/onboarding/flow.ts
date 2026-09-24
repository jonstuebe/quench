/** Pure step sequencing and copy for the "adopt your egg" onboarding flow. */
import { calculateWaterGoalFlOz } from "@/lib/health/goal";
import { formatAmount } from "@/lib/home/format";
import type { VolumeDisplayUnit } from "@/lib/types";

export const ONBOARDING_STEPS = ["welcome", "how", "health", "day", "ready"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Weight assumed when Apple Health has none (matches the Health store's fallback). */
const FALLBACK_WEIGHT_LB = 160;

export function stepAfter(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) + 1] ?? null;
}

export function stepBefore(step: OnboardingStep): OnboardingStep | null {
  const i = ONBOARDING_STEPS.indexOf(step);
  return i > 0 ? ONBOARDING_STEPS[i - 1] : null;
}

/**
 * Where "Skip" goes: the intro skips straight to setup, and Health can be deferred. Your day
 * and Ready have no skip (their defaults are already fine to continue with).
 */
export function skipTarget(step: OnboardingStep): OnboardingStep | null {
  if (step === "welcome" || step === "how") return "health";
  if (step === "health") return "day";
  return null;
}

export function progressLabel(step: OnboardingStep): string {
  return `Step ${ONBOARDING_STEPS.indexOf(step) + 1} of ${ONBOARDING_STEPS.length}`;
}

/** The goal shown on the Ready step, with an honest note on where it came from. */
export function goalPreview({
  weightLb,
  exerciseMin,
  unit,
}: {
  /** From Apple Health; null when there's no weight (or no read access). */
  weightLb: number | null;
  exerciseMin: number;
  unit: VolumeDisplayUnit;
}): { amount: string; basis: string } {
  if (weightLb == null) {
    return {
      amount: formatAmount(calculateWaterGoalFlOz(FALLBACK_WEIGHT_LB, exerciseMin), unit),
      basis: `A starting goal for ${FALLBACK_WEIGHT_LB} lb. Add your weight in Apple Health to tailor it.`,
    };
  }
  return {
    amount: formatAmount(calculateWaterGoalFlOz(weightLb, exerciseMin), unit),
    basis:
      exerciseMin > 0
        ? "From your weight in Apple Health, plus today's exercise."
        : "From your weight in Apple Health.",
  };
}
