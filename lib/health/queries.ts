import {
  deleteObjects,
  getMostRecentQuantitySample,
  queryQuantitySamples,
  saveQuantitySample,
} from "@kingstinct/react-native-healthkit";
import { endOfDay, isSameDay, startOfDay } from "date-fns";

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

export async function saveWaterFlOz(valueFlOz: number, at: Date) {
  await saveQuantitySample(HK_WATER, "fl_oz_us", valueFlOz, at, at);
}

export async function deleteWaterSampleByUuid(uuid: string) {
  await deleteObjects(HK_WATER, { uuid });
}
