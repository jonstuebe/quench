import { calculateWaterGoalFlOz } from "../health/goal";
import { addDaysToKey, dayKeyRange, daysBetween, type DayKey } from "./day";

/** Snapshots older than this many days before the last judged day are pruned. */
export const SNAPSHOT_RETENTION_DAYS = 14;

export type ResolveGoalsInput = {
  /** Goal recorded while the app ran on each day (last write of the day wins). */
  snapshots: Record<DayKey, number>;
  /** Exercise minutes for days that need recomputing (see `daysNeedingExercise`). */
  exerciseByDay: Record<DayKey, number>;
  /** Current weight; HealthKit weight history isn't used. */
  weightLb: number;
  from: DayKey;
  today: DayKey;
  /** Today's live goal. */
  goalToday: number;
};

/** Past days in [from, today) with no snapshot, whose exercise must be fetched. */
export function daysNeedingExercise(
  snapshots: Record<DayKey, number>,
  from: DayKey,
  today: DayKey,
): DayKey[] {
  return dayKeyRange(from, addDaysToKey(today, -1)).filter((d) => snapshots[d] == null);
}

/**
 * Goal per day in [from, today]: today = live goal (also recorded as today's snapshot);
 * past day = its snapshot, else recomputed from that day's exercise (0 if none) and current weight.
 */
export function resolveGoals(input: ResolveGoalsInput): {
  goalByDay: Record<DayKey, number>;
  snapshots: Record<DayKey, number>;
} {
  const { exerciseByDay, weightLb, from, today, goalToday } = input;
  const snapshots = { ...input.snapshots, [today]: goalToday };
  const goalByDay: Record<DayKey, number> = {};
  for (const d of dayKeyRange(from, today)) {
    goalByDay[d] = snapshots[d] ?? calculateWaterGoalFlOz(weightLb, exerciseByDay[d] ?? 0);
  }
  return { goalByDay, snapshots };
}

/** Keep snapshots on or after `judgedThrough - SNAPSHOT_RETENTION_DAYS` (all if nothing judged). */
export function pruneGoalSnapshots(
  snapshots: Record<DayKey, number>,
  judgedThrough: DayKey | null,
): Record<DayKey, number> {
  if (!judgedThrough) return { ...snapshots };
  const keepFrom = addDaysToKey(judgedThrough, -SNAPSHOT_RETENTION_DAYS);
  const out: Record<DayKey, number> = {};
  for (const [d, g] of Object.entries(snapshots)) if (daysBetween(keepFrom, d) >= 0) out[d] = g;
  return out;
}
