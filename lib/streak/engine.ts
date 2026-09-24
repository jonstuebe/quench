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

import { AppState } from "react-native";

import { addDaysToKey, daysBetween, toDayKey } from "./day";
import { daysToFetch, evaluateStreak, normalizeStreakState } from "./evaluate";
import { daysNeedingExercise, pruneGoalSnapshots, resolveGoals } from "./goals";
import { goalSnapshots$, streakState$ } from "./store";

/** Never fetch more than this many days of history in one evaluation. */
const MAX_FETCH_DAYS = 400;
const DEFAULT_WEIGHT_LB = 160;

let inFlight: Promise<void> | null = null;
/** A run was skipped because the app wasn't active (cold launch in "unknown"/"inactive", or a
 * locked background launch). The AppState "active" listener flushes it. */
let pendingWhileInactive = false;

export function hasPendingStreakRun(): boolean {
  return pendingWhileInactive;
}
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
  // Defense in depth: UIBackgroundModes can mount JS while the device is locked, when
  // HealthKit reads may come back empty (protected data) and would read as misses.
  if (AppState.currentState !== "active") {
    pendingWhileInactive = true; // run on the next transition to "active"
    return;
  }
  pendingWhileInactive = false;

  const today = toDayKey(now);
  const state = normalizeStreakState(streakState$.peek());
  let { from } = daysToFetch(state, today);
  if (daysBetween(from, today) < 0) from = today; // clock moved backwards
  // Cap history per run. Older unjudged days read as 0 intake, i.e. a miss; acceptable since a
  // break that long has already ended any streak (and only one death is recorded per break).
  if (daysBetween(from, today) > MAX_FETCH_DAYS) from = addDaysToKey(today, -MAX_FETCH_DAYS);

  const [intakeByDay, weight, exerciseToday] = await Promise.all([
    sumWaterFlOzByDay(from, today),
    getWeightLb(),
    sumExerciseMinutesForDay(now),
  ]);
  const weightLb = weight ?? DEFAULT_WEIGHT_LB;
  const goalToday = calculateWaterGoalFlOz(weightLb, exerciseToday);

  const prevSnapshots = goalSnapshots$.peek();
  const needExercise = daysNeedingExercise(prevSnapshots, from, today);
  const exerciseByDay =
    needExercise.length > 0
      ? await sumExerciseMinutesByDay(needExercise[0]!, needExercise[needExercise.length - 1]!)
      : {};
  const { goalByDay, snapshots } = resolveGoals({
    snapshots: prevSnapshots,
    exerciseByDay,
    weightLb,
    from,
    today,
    goalToday,
  });

  const next = evaluateStreak(state, { now, intakeByDay, goalByDay, fallbackGoalFlOz: goalToday });
  streakState$.set(next);
  goalSnapshots$.set(pruneGoalSnapshots(snapshots, next.judgedThrough));
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
