import { addDays, set, startOfDay } from "date-fns";

export type TimeOfDay = { hour: number; minute: number };

/** Living-pet moods. The egg state has no mood (see `PetMood` in `./view`). */
export type Mood = "celebrating" | "happy" | "content" | "thirsty" | "parched" | "last-chance";

/** paceRatio >= this -> "happy" (on or ahead of an even drinking pace). */
export const HAPPY_PACE_RATIO = 1;
/** paceRatio >= this -> "content". */
export const CONTENT_PACE_RATIO = 0.75;
/** paceRatio >= this -> "thirsty"; below -> "parched". */
export const THIRSTY_PACE_RATIO = 0.5;
/**
 * Behind pace (ratio < HAPPY_PACE_RATIO) with the goal unmet inside this many minutes
 * before bedtime (or any time after bedtime) -> "last-chance": midnight will kill the pet.
 */
export const LAST_CHANCE_WINDOW_MINUTES = 120;

export type PaceInput = {
  intakeFlOz: number;
  goalFlOz: number;
  now: Date;
  wake: TimeOfDay;
  bed: TimeOfDay;
};

export type PaceResult = {
  mood: Mood;
  /** Amount expected by `now` if drinking evenly from wake to bed. */
  expectedFlOz: number;
  /** intake / expected; Infinity when nothing is expected yet. */
  paceRatio: number;
};

const at = (now: Date, t: TimeOfDay) =>
  set(now, { hours: t.hour, minutes: t.minute, seconds: 0, milliseconds: 0 });

/**
 * Pace-based mood for today. Times are wall-clock on `now`'s calendar day; a bedtime at or
 * before wake (i.e. past midnight) is clamped to the end of the day, since the day is judged
 * at local midnight regardless.
 */
export function computePace({ intakeFlOz, goalFlOz, now, wake, bed }: PaceInput): PaceResult {
  const wakeAt = at(now, wake);
  const bedRaw = at(now, bed);
  const bedAt = bedRaw.getTime() > wakeAt.getTime() ? bedRaw : addDays(startOfDay(now), 1);
  const t = now.getTime();

  let expectedFlOz: number;
  if (t <= wakeAt.getTime()) expectedFlOz = 0;
  else if (t >= bedAt.getTime()) expectedFlOz = goalFlOz;
  else {
    const frac = (t - wakeAt.getTime()) / (bedAt.getTime() - wakeAt.getTime());
    expectedFlOz = goalFlOz * frac;
  }
  const paceRatio = expectedFlOz > 0 ? intakeFlOz / expectedFlOz : Infinity;

  let mood: Mood;
  if (intakeFlOz >= goalFlOz) mood = "celebrating";
  else if (
    paceRatio < HAPPY_PACE_RATIO &&
    t >= bedAt.getTime() - LAST_CHANCE_WINDOW_MINUTES * 60_000
  )
    mood = "last-chance";
  else if (paceRatio >= HAPPY_PACE_RATIO) mood = "happy";
  else if (paceRatio >= CONTENT_PACE_RATIO) mood = "content";
  else if (paceRatio >= THIRSTY_PACE_RATIO) mood = "thirsty";
  else mood = "parched";

  return { mood, expectedFlOz, paceRatio };
}
