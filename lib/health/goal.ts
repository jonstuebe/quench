/** Weight in lb; exercise minutes from Apple Exercise Time */
export function calculateWaterGoalFlOz(weightLb: number, exerciseMinutes: number): number {
  let amount = weightLb * 0.67;
  if (exerciseMinutes > 0) {
    amount += 0.4 * exerciseMinutes;
  }
  return Math.round(amount);
}
