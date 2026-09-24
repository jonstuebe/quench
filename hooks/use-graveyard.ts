import { useValue } from "@legendapp/state/react";
import { useMemo } from "react";

import { DEV_SAMPLE_GRAVES, SAMPLE_GRAVES } from "@/lib/dev/sample-graves";
import { gravesNewestFirst } from "@/lib/graveyard/graveyard";
import type { Grave } from "@/lib/streak/evaluate";
import { graveyard$ } from "@/lib/streak/store";

const useSamples = __DEV__ && DEV_SAMPLE_GRAVES;

/** Graveyard read model for the UI: graves, newest first. */
export function useGraveyard(): Grave[] {
  const real = useValue(graveyard$);
  const source = useSamples ? SAMPLE_GRAVES : real;
  return useMemo(() => gravesNewestFirst(source), [source]);
}
