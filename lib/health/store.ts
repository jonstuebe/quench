import { subscribeToChanges } from "@kingstinct/react-native-healthkit";
import { observable, syncState } from "@legendapp/state";
import { synced } from "@legendapp/state/sync";

import { HK_APPLE_EXERCISE_TIME, HK_BODY_MASS, HK_WATER } from "@/lib/health/ids";
import { getWeightLb, sumExerciseMinutesForDay, sumWaterFlOzForDay } from "@/lib/health/queries";

/** Calendar day used by Day screen + shared day metrics */
export const dayDate$ = observable(new Date());

export const todayWaterFlOz$ = observable(
  synced({
    initial: 0,
    get: async () => {
      try {
        return await sumWaterFlOzForDay(new Date());
      } catch {
        return 0;
      }
    },
    subscribe: ({ refresh }) => {
      const sub = subscribeToChanges(HK_WATER, () => {
        refresh();
      });
      return () => {
        sub.remove();
      };
    },
  }),
);

export const todayExerciseMin$ = observable(
  synced({
    initial: 0,
    get: async () => {
      try {
        return await sumExerciseMinutesForDay(new Date());
      } catch {
        return 0;
      }
    },
    subscribe: ({ refresh }) => {
      const sub = subscribeToChanges(HK_APPLE_EXERCISE_TIME, () => {
        refresh();
      });
      return () => {
        sub.remove();
      };
    },
  }),
);

export const weightLb$ = observable(
  synced({
    initial: 160,
    get: async () => {
      try {
        const w = await getWeightLb();
        return w ?? 160;
      } catch {
        return 160;
      }
    },
    subscribe: ({ refresh }) => {
      const sub = subscribeToChanges(HK_BODY_MASS, () => {
        refresh();
      });
      return () => {
        sub.remove();
      };
    },
  }),
);

export const waterDayFlOz$ = observable(
  synced({
    initial: 0,
    get: async () => {
      try {
        const d = dayDate$.get();
        return await sumWaterFlOzForDay(d);
      } catch {
        return 0;
      }
    },
    subscribe: ({ refresh }) => {
      const sub = subscribeToChanges(HK_WATER, () => {
        refresh();
      });
      return () => {
        sub.remove();
      };
    },
  }),
);

export const exerciseDayMin$ = observable(
  synced({
    initial: 0,
    get: async () => {
      try {
        const d = dayDate$.get();
        return await sumExerciseMinutesForDay(d);
      } catch {
        return 0;
      }
    },
    subscribe: ({ refresh }) => {
      const sub = subscribeToChanges(HK_APPLE_EXERCISE_TIME, () => {
        refresh();
      });
      return () => {
        sub.remove();
      };
    },
  }),
);

export const todayWaterSync$ = syncState(todayWaterFlOz$);
export const todayExerciseSync$ = syncState(todayExerciseMin$);
export const weightSync$ = syncState(weightLb$);
export const waterDaySync$ = syncState(waterDayFlOz$);
export const exerciseDaySync$ = syncState(exerciseDayMin$);

export async function refreshDayMetrics() {
  await Promise.all([syncState(waterDayFlOz$).sync(), syncState(exerciseDayMin$).sync()]);
}

export async function refreshTodayMetrics() {
  await Promise.all([
    syncState(todayWaterFlOz$).sync(),
    syncState(todayExerciseMin$).sync(),
    syncState(weightLb$).sync(),
  ]);
}
