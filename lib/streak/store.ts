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
import { initialStreakState, normalizeStreakState, type StreakState } from "./evaluate";
import {
  applyNameOverrides,
  normalizeNameOverrides,
  pruneNameOverrides,
  renamePet,
  type NameOverrides,
} from "./rename";
import { derivePetView } from "./view";

const persistPlugin = observablePersistMMKV({ id: "quench-mmkv" });

/** Pets, graveyard, longest streak and judging progress. Written only by the engine. */
export const streakState$ = observable<StreakState>({ ...initialStreakState });
syncObservable(streakState$, { persist: { name: "quench-streak", plugin: persistPlugin } });
// MMKV loads synchronously: normalize whatever was persisted (older/partial shapes).
streakState$.set(normalizeStreakState(streakState$.peek()));

/** User-chosen pet names by pet id; re-applied after every evaluation (see `rename.ts`). */
export const petNameOverrides$ = observable<NameOverrides>({});
syncObservable(petNameOverrides$, {
  persist: { name: "quench-pet-names", plugin: persistPlugin },
});
petNameOverrides$.set(normalizeNameOverrides(petNameOverrides$.peek()));

/** Write evaluated state, keeping any user-chosen names. */
export function setStreakState(next: StreakState): void {
  const overrides = petNameOverrides$.peek();
  const named = applyNameOverrides(next, overrides);
  streakState$.set(named);
  const pruned = pruneNameOverrides(named, overrides);
  if (pruned !== overrides) petNameOverrides$.set(pruned);
}

/** Rename the living pet (no-op for an egg). `name` must already be validated. */
export function renameCurrentPet(name: string): void {
  const result = renamePet(streakState$.peek(), petNameOverrides$.peek(), name);
  petNameOverrides$.set(result.overrides);
  streakState$.set(result.state);
}

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
