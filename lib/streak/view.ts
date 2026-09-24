import type { Pet, StreakState } from "./evaluate";
import { computePace, type Mood, type PaceResult, type TimeOfDay } from "./mood";

export type PetMood = Mood | "egg";
export type PetView =
  | { kind: "egg"; mood: "egg"; currentStreak: 0 }
  | {
      kind: "alive";
      mood: Mood;
      pet: Pet;
      currentStreak: number;
      countedToday: boolean;
      pace: PaceResult;
    };
export type PetViewInput = {
  today: string;
  intakeTodayFlOz: number;
  goalTodayFlOz: number;
  now: Date;
  wake: TimeOfDay;
  bed: TimeOfDay;
};
/** What the pet screen shows: an egg (no living pet) or a living pet with a pace mood. */
export function derivePetView(state: StreakState, input: PetViewInput): PetView {
  const { pet } = state;
  if (!pet) return { kind: "egg", mood: "egg", currentStreak: 0 };
  const pace = computePace({
    intakeFlOz: input.intakeTodayFlOz,
    goalFlOz: input.goalTodayFlOz,
    now: input.now,
    wake: input.wake,
    bed: input.bed,
  });
  return {
    kind: "alive",
    mood: pace.mood,
    pet,
    currentStreak: pet.streakLength,
    countedToday: pet.lastCountedDay === input.today,
    pace,
  };
}
