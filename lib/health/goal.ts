/** Weight in lb; exercise minutes from Apple Exercise Time */
export function calculateWaterGoalFlOz(weightLb: number, exerciseMinutes: number): number {
  let amount = weightLb * 0.67;
  if (exerciseMinutes > 0) {
    amount += 0.4 * exerciseMinutes;
  }
  return Math.round(amount);
}

export type GoalBreakdown = { fromWeightFlOz: number; fromExerciseFlOz: number; totalFlOz: number };

/** Split the goal into its weight base and exercise bonus; the parts always sum to the goal. */
export function goalBreakdown(weightLb: number, exerciseMinutes: number): GoalBreakdown {
  const totalFlOz = calculateWaterGoalFlOz(weightLb, exerciseMinutes);
  const fromWeightFlOz = calculateWaterGoalFlOz(weightLb, 0);
  return { fromWeightFlOz, fromExerciseFlOz: totalFlOz - fromWeightFlOz, totalFlOz };
}
