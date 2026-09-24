import {
  deleteObjects,
  getMostRecentQuantitySample,
  queryQuantitySamples,
  saveQuantitySample,
} from "@kingstinct/react-native-healthkit";
import { endOfDay, startOfDay } from "date-fns";

import { getHealthAppBundleIdentifier } from "@/lib/health/app-bundle-id";
import { HK_APPLE_EXERCISE_TIME, HK_BODY_MASS, HK_WATER } from "@/lib/health/ids";
import { dayKeyToDate, toDayKey, type DayKey } from "@/lib/streak/day";

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

/**
 * Totals per local calendar day (keyed `yyyy-MM-dd` by sample start) for the inclusive day
 * range, in one HealthKit query. Days with no samples are absent from the result.
 */
async function sumQuantityByDay(
  identifier: typeof HK_WATER | typeof HK_APPLE_EXERCISE_TIME,
  unit: "fl_oz_us" | "min",
  from: DayKey,
  to: DayKey,
): Promise<Record<DayKey, number>> {
  const samples = await queryQuantitySamples(identifier, {
    filter: {
      date: {
        startDate: startOfDay(dayKeyToDate(from)),
        endDate: endOfDay(dayKeyToDate(to)),
      },
    },
    limit: 0,
    ascending: true,
    unit,
  });
  const out: Record<DayKey, number> = {};
  for (const s of samples) {
    const key = toDayKey(new Date(s.startDate));
    out[key] = (out[key] ?? 0) + s.quantity;
  }
  return out;
}

export function sumWaterFlOzByDay(from: DayKey, to: DayKey) {
  return sumQuantityByDay(HK_WATER, "fl_oz_us", from, to);
}

export function sumExerciseMinutesByDay(from: DayKey, to: DayKey) {
  return sumQuantityByDay(HK_APPLE_EXERCISE_TIME, "min", from, to);
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
