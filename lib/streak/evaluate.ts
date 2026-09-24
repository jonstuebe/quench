import { addDaysToKey, dayKeyRange, daysBetween, type DayKey } from "./day";
import { createSeededRng, generateAxolotlName } from "./names";

export type Pet = {
  id: string;
  name: string;
  hatchedOn: DayKey;
  lastCountedDay: DayKey;
  streakLength: number;
};
export type Grave = {
  id: string;
  name: string;
  hatchedOn: DayKey;
  lastCountedDay: DayKey;
  diedOn: DayKey;
  streakLength: number;
};
export type StreakState = {
  trackingSince: DayKey | null;
  judgedThrough: DayKey | null;
  pet: Pet | null;
  graveyard: Grave[];
  longestStreak: number;
};
export const initialStreakState: StreakState = {
  trackingSince: null,
  judgedThrough: null,
  pet: null,
  graveyard: [],
  longestStreak: 0,
};
export type EvaluateInput = {
  today: DayKey;
  intakeByDay: Record<DayKey, number>;
  goalByDay: Record<DayKey, number>;
  fallbackGoalFlOz: number;
};
/**
 * Pure streak evaluator. Re-running with the same inputs returns an equal state.
 *
 * Rules:
 * - Days before `trackingSince` (first evaluation / install) are never judged.
 * - Fully completed past days (< today) are judged once: met (intake >= that day's goal)
 *   extends the living pet or hatches a new one; missed kills the living pet (one death per
 *   break; misses with no living pet do nothing).
 * - Today is tentative: meeting its goal counts it immediately (streak day N), but it is
 *   never judged as a miss. Tentative counts (days after `judgedThrough`) are rewound and
 *   re-judged on every run, so undoing a drink, or a day whose final total dropped, is honored.
 * - Missing intake for a day = 0. Missing goal for a day = `fallbackGoalFlOz`.
 */
export function evaluateStreak(state: StreakState, input: EvaluateInput): StreakState {
  const { today, intakeByDay, goalByDay, fallbackGoalFlOz } = input;
  const trackingSince = state.trackingSince ?? today;
  const graveyard = [...state.graveyard];
  let pet = rewindTentative(state.pet, state.judgedThrough);

  const isMet = (day: DayKey) => (intakeByDay[day] ?? 0) >= (goalByDay[day] ?? fallbackGoalFlOz);
  const count = (day: DayKey) => {
    if (pet) {
      pet = { ...pet, lastCountedDay: day, streakLength: pet.streakLength + 1 };
    } else {
      const seed = `${day}#${graveyard.length}`;
      pet = {
        id: seed,
        name: generateAxolotlName(createSeededRng(seed)),
        hatchedOn: day,
        lastCountedDay: day,
        streakLength: 1,
      };
    }
  };

  const firstUnjudged = state.judgedThrough ? addDaysToKey(state.judgedThrough, 1) : trackingSince;
  const yesterday = addDaysToKey(today, -1);
  let judgedThrough = state.judgedThrough;
  for (const day of dayKeyRange(firstUnjudged, yesterday)) {
    if (isMet(day)) count(day);
    else if (pet) {
      graveyard.push({ ...pet, diedOn: day });
      pet = null;
    }
    judgedThrough = day;
  }

  const todayUnjudged = judgedThrough === null || daysBetween(judgedThrough, today) > 0;
  if (todayUnjudged && daysBetween(trackingSince, today) >= 0 && isMet(today)) count(today);

  const longestStreak = Math.max(
    0,
    (pet as Pet | null)?.streakLength ?? 0,
    ...graveyard.map((g) => g.streakLength),
  );
  return { trackingSince, judgedThrough, pet, graveyard, longestStreak };
}

/** Drop counts for days after `judgedThrough` (tentative "today" counts from a previous run). */
function rewindTentative(pet: Pet | null, judgedThrough: DayKey | null): Pet | null {
  if (!pet) return null;
  if (judgedThrough === null || daysBetween(judgedThrough, pet.hatchedOn) > 0) return null;
  const tentative = daysBetween(judgedThrough, pet.lastCountedDay);
  if (tentative <= 0) return pet;
  return { ...pet, lastCountedDay: judgedThrough, streakLength: pet.streakLength - tentative };
}

/** Inclusive day range whose intake (and goals) the caller must supply to `evaluateStreak`. */
export function daysToFetch(state: StreakState, today: DayKey): { from: DayKey; to: DayKey } {
  const from = state.judgedThrough
    ? addDaysToKey(state.judgedThrough, 1)
    : (state.trackingSince ?? today);
  return { from, to: today };
}
