import { calculateWaterGoalFlOz } from "@/lib/health/goal";
import { getWeightLb, sumExerciseMinutesForDay, sumWaterFlOzForDay } from "@/lib/health/queries";

export type DayProgress = {
  date: Date;
  waterFlOz: number;
  goalFlOz: number;
  /** 0–100 */
  pct: number;
  met: boolean;
};

const DEFAULT_WEIGHT_LB = 160;

/**
 * Full-day water vs personalized goal (weight + that day’s exercise), matching {@link WaterWidget}.
 */
export async function getDayProgress(date: Date, weightLb?: number): Promise<DayProgress> {
  const w = weightLb ?? (await getWeightLb()) ?? DEFAULT_WEIGHT_LB;
  const [water, exerciseMin] = await Promise.all([
    sumWaterFlOzForDay(date),
    sumExerciseMinutesForDay(date),
  ]);
  const goalFlOz = calculateWaterGoalFlOz(w, exerciseMin);
  const pct = goalFlOz > 0 ? Math.min(100, Math.round((water / goalFlOz) * 100)) : 0;
  const met = goalFlOz > 0 && water >= goalFlOz;
  return { date, waterFlOz: water, goalFlOz, pct, met };
}

export async function getWeightLbForGoals(): Promise<number> {
  return (await getWeightLb()) ?? DEFAULT_WEIGHT_LB;
}
