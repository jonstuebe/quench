import type { PetMood } from "@/lib/streak/view";

/**
 * DEV only. The Home pet can be long-pressed in development builds to cycle through every
 * mood (egg → celebrating → … → last-chance → live). Set a mood here to start on it.
 */
export const DEV_START_MOOD: PetMood | null = null;

export const DEV_PREVIEW_MOODS: readonly PetMood[] = [
  "egg",
  "celebrating",
  "happy",
  "content",
  "thirsty",
  "parched",
  "last-chance",
];
