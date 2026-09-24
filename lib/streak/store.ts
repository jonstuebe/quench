/**
 * Persisted streak state + read API for UI layers. React Native only (mmkv); the pure logic
 * it wraps lives in the sibling modules and is what `bun test` covers.
 */
import { observable } from "@legendapp/state";
import { observablePersistMMKV } from "@legendapp/state/persist-plugins/mmkv";
import { syncObservable } from "@legendapp/state/sync";

import { now$, todayKey$ } from "@/lib/clock";
import { calculateWaterGoalFlOz } from "@/lib/health/goal";
import { todayExerciseMin$, todayWaterFlOz$, weightLb$ } from "@/lib/health/store";
import { prefs$ } from "@/lib/prefs";

import type { DayKey } from "./day";
import { initialStreakState, type StreakState } from "./evaluate";
import { derivePetView } from "./view";

const persistPlugin = observablePersistMMKV({ id: "quench-mmkv" });

/** Pets, graveyard, longest streak and judging progress. Written only by the engine. */
export const streakState$ = observable<StreakState>({ ...initialStreakState });
syncObservable(streakState$, { persist: { name: "quench-streak", plugin: persistPlugin } });

/**
 * Goal in effect per day, recorded whenever the engine runs on that day (last write of the
 * day wins). Past days are judged against these; see `engine.ts` for the fallback.
 */
export const goalSnapshots$ = observable<Record<DayKey, number>>({});
syncObservable(goalSnapshots$, {
  persist: { name: "quench-goal-snapshots", plugin: persistPlugin },
});

/** Today's live goal (same formula the home screen uses). */
export const todayGoalFlOz$ = observable(() =>
  calculateWaterGoalFlOz(weightLb$.get(), todayExerciseMin$.get()),
);

/** Current streak length in days (0 when there's no living pet). */
export const streak$ = observable(() => streakState$.pet.get()?.streakLength ?? 0);

export const longestStreak$ = observable(() => streakState$.longestStreak.get());

/** Dead pets, oldest first. */
export const graveyard$ = observable(() => streakState$.graveyard.get());

/** Egg, or the living pet with its pace-based mood. Re-derives as water/goal/clock change. */
export const currentPet$ = observable(() =>
  derivePetView(streakState$.get(), {
    today: todayKey$.get(),
    intakeTodayFlOz: todayWaterFlOz$.get(),
    goalTodayFlOz: todayGoalFlOz$.get(),
    now: new Date(now$.get()),
    wake: prefs$.wakeUp.get(),
    bed: prefs$.bedtime.get(),
  }),
);
