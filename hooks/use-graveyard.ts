import { useValue } from "@legendapp/state/react";
import { useMemo } from "react";

import { DEV_SAMPLE_GRAVES, SAMPLE_GRAVES } from "@/lib/dev/sample-graves";
import { gravesNewestFirst, type LivingPetSummary } from "@/lib/graveyard/graveyard";
import type { Grave } from "@/lib/streak/evaluate";
import { graveyard$, longestStreak$, streakState$ } from "@/lib/streak/store";

const useSamples = __DEV__ && DEV_SAMPLE_GRAVES;

/** Graveyard read model for the UI: graves newest first, the record, and the living pet. */
export function useGraveyard(): {
  graves: Grave[];
  longest: number;
  pet: LivingPetSummary | null;
} {
  const real = useValue(graveyard$);
  const realLongest = useValue(longestStreak$);
  const livePet = useValue(streakState$.pet);
  const source = useSamples ? SAMPLE_GRAVES : real;
  const graves = useMemo(() => gravesNewestFirst(source), [source]);
  const pet = livePet ? { name: livePet.name, streakLength: livePet.streakLength } : null;
  const longest = useSamples
    ? Math.max(realLongest, ...SAMPLE_GRAVES.map((g) => g.streakLength))
    : realLongest;
  return { graves, longest, pet };
}
