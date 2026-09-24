/**
 * Integration glue: fetch per-day HealthKit totals and run the pure evaluator.
 * Triggers are wired in `hooks/use-streak-engine.ts`.
 */
import { tickClock } from "@/lib/clock";
import { calculateWaterGoalFlOz } from "@/lib/health/goal";
import {
  getWeightLb,
  sumExerciseMinutesByDay,
  sumExerciseMinutesForDay,
  sumWaterFlOzByDay,
} from "@/lib/health/queries";
import { refreshTodayMetrics } from "@/lib/health/store";

import { addDaysToKey, dayKeyRange, daysBetween, toDayKey, type DayKey } from "./day";
import { daysToFetch, evaluateStreak } from "./evaluate";
import { goalSnapshots$, streakState$ } from "./store";

/** Never fetch more than this many days of history in one evaluation. */
const MAX_FETCH_DAYS = 400;
/** Goal snapshots older than this (relative to the last judged day) are pruned. */
const SNAPSHOT_RETENTION_DAYS = 14;
const DEFAULT_WEIGHT_LB = 160;

let inFlight: Promise<void> | null = null;
let rerun = false;

/**
 * Evaluate the streak now. Concurrent calls coalesce into one follow-up run.
 * If HealthKit can't be read the state is left untouched (never judge on missing data).
 */
export function evaluateStreakNow(): Promise<void> {
  if (inFlight) {
    rerun = true;
    return inFlight;
  }
  inFlight = (async () => {
    try {
      do {
        rerun = false;
        await runOnce(new Date());
      } while (rerun);
    } catch (e) {
      console.warn("[streak] evaluation skipped", e);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

async function runOnce(now: Date) {
  const today = toDayKey(now);
  const state = streakState$.peek();
  let { from } = daysToFetch(state, today);
  if (daysBetween(from, today) < 0) from = today; // clock moved backwards
  if (daysBetween(from, today) > MAX_FETCH_DAYS) from = addDaysToKey(today, -MAX_FETCH_DAYS);

  const [intakeByDay, weight, exerciseToday] = await Promise.all([
    sumWaterFlOzByDay(from, today),
    getWeightLb(),
    sumExerciseMinutesForDay(now),
  ]);
  const weightLb = weight ?? DEFAULT_WEIGHT_LB;
  const goalToday = calculateWaterGoalFlOz(weightLb, exerciseToday);

  // Past-day goals: the snapshot taken while the app ran that day; otherwise recompute from that
  // day's exercise with the current weight (HealthKit has no history of our goal).
  const snapshots = { ...goalSnapshots$.peek(), [today]: goalToday };
  const goalByDay: Record<DayKey, number> = { ...snapshots };
  const unsnapped = dayKeyRange(from, addDaysToKey(today, -1)).filter((d) => snapshots[d] == null);
  if (unsnapped.length > 0) {
    const exercise = await sumExerciseMinutesByDay(unsnapped[0]!, unsnapped[unsnapped.length - 1]!);
    for (const d of unsnapped) goalByDay[d] = calculateWaterGoalFlOz(weightLb, exercise[d] ?? 0);
  }

  const next = evaluateStreak(state, {
    today,
    intakeByDay,
    goalByDay,
    fallbackGoalFlOz: goalToday,
  });
  streakState$.set(next);

  const keepFrom = addDaysToKey(next.judgedThrough ?? today, -SNAPSHOT_RETENTION_DAYS);
  const pruned: Record<DayKey, number> = {};
  for (const [d, g] of Object.entries(snapshots)) if (daysBetween(keepFrom, d) >= 0) pruned[d] = g;
  goalSnapshots$.set(pruned);
}

/**
 * Advance the clock; on a local-day rollover refetch the "today" metrics so the home screen
 * doesn't keep showing yesterday's totals. Then re-evaluate the streak.
 */
export async function onClockTick(): Promise<void> {
  if (tickClock()) {
    await refreshTodayMetrics().catch(() => undefined);
  }
  await evaluateStreakNow();
}
