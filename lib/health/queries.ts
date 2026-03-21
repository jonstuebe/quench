import {
  deleteObjects,
  getMostRecentQuantitySample,
  queryQuantitySamples,
  saveQuantitySample,
} from "@kingstinct/react-native-healthkit";
import { endOfDay, isSameDay, startOfDay } from "date-fns";

import { getHealthAppBundleIdentifier } from "@/lib/health/app-bundle-id";
import { HK_APPLE_EXERCISE_TIME, HK_BODY_MASS, HK_WATER } from "@/lib/health/ids";

export async function sumWaterFlOzForDay(date: Date): Promise<number> {
  const samples = await queryQuantitySamples(HK_WATER, {
    filter: {
      date: {
        startDate: startOfDay(date),
        endDate: endOfDay(date),
      },
    },
    limit: 0,
    ascending: true,
    unit: "fl_oz_us",
  });
  return samples.reduce((acc, s) => acc + s.quantity, 0);
}

export async function sumExerciseMinutesForDay(date: Date): Promise<number> {
  const samples = await queryQuantitySamples(HK_APPLE_EXERCISE_TIME, {
    filter: {
      date: {
        startDate: startOfDay(date),
        endDate: endOfDay(date),
      },
    },
    limit: 0,
    ascending: true,
    unit: "min",
  });
  return samples.reduce((acc, s) => acc + s.quantity, 0);
}

export async function sumWaterFlOzBetween(from: Date, to: Date): Promise<number> {
  const samples = await queryQuantitySamples(HK_WATER, {
    filter: {
      date: { startDate: from, endDate: to },
    },
    limit: 0,
    ascending: true,
    unit: "fl_oz_us",
  });
  return samples.reduce((acc, s) => acc + s.quantity, 0);
}

/** Sum water from start of `date` until the same wall-clock time as now (capped for today). */
export async function sumWaterUntilWallClock(date: Date): Promise<number> {
  const now = new Date();
  const start = startOfDay(date);
  let end = new Date(date);
  end.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  if (isSameDay(date, now)) {
    if (end > now) end = now;
  } else {
    const eod = endOfDay(date);
    if (end > eod) end = eod;
  }
  return sumWaterFlOzBetween(start, end);
}

export async function sumExerciseMinutesBetween(from: Date, to: Date): Promise<number> {
  const samples = await queryQuantitySamples(HK_APPLE_EXERCISE_TIME, {
    filter: {
      date: { startDate: from, endDate: to },
    },
    limit: 0,
    ascending: true,
    unit: "min",
  });
  return samples.reduce((acc, s) => acc + s.quantity, 0);
}

export async function getWeightLb(): Promise<number | null> {
  const s = await getMostRecentQuantitySample(HK_BODY_MASS, "lb");
  if (!s) return null;
  return Math.round(s.quantity);
}

export async function getLastWaterSampleForDay(date: Date) {
  const samples = await queryQuantitySamples(HK_WATER, {
    filter: {
      date: {
        startDate: startOfDay(date),
        endDate: endOfDay(date),
      },
    },
    limit: 0,
    ascending: true,
    unit: "fl_oz_us",
  });
  if (samples.length === 0) return null;
  return samples[samples.length - 1];
}

/**
 * Last water sample for the day that **this app** is allowed to delete in HealthKit.
 * Ignores entries from other apps or other bundle IDs (e.g. dev vs release).
 */
export async function getLastDeletableWaterSampleForDay(date: Date) {
  const samples = await queryQuantitySamples(HK_WATER, {
    filter: {
      date: {
        startDate: startOfDay(date),
        endDate: endOfDay(date),
      },
    },
    limit: 0,
    ascending: true,
    unit: "fl_oz_us",
  });
  const bundleId = getHealthAppBundleIdentifier();
  const filtered = bundleId
    ? samples.filter((s) => s.sourceRevision?.source?.bundleIdentifier === bundleId)
    : samples;
  if (filtered.length === 0) return null;
  return filtered[filtered.length - 1];
}

export async function saveWaterFlOz(valueFlOz: number, at: Date) {
  await saveQuantitySample(HK_WATER, "fl_oz_us", valueFlOz, at, at);
}

/** @returns number of samples HealthKit removed (0 if none matched or allowed). */
export async function deleteWaterSampleByUuid(uuid: string): Promise<number> {
  return await deleteObjects(HK_WATER, { uuid });
}
