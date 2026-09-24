/**
 * User-chosen pet names. The evaluator names pets from a seed and may rewind a tentative hatch
 * and re-create it, so the chosen name is kept as an override keyed by pet id (the seed) and
 * re-applied after every evaluation. Pure; persistence lives in `store.ts`.
 */
import type { StreakState } from "./evaluate";

/** Pet id → user-chosen name. */
export type NameOverrides = Record<string, string>;

export const PET_NAME_MAX_LENGTH = 20;

export type PetNameResult = { ok: true; name: string } | { ok: false; error: "empty" | "tooLong" };

/** Trim, collapse inner whitespace, and require 1–20 characters (emoji count as one). */
export function validatePetName(raw: string): PetNameResult {
  const name = raw.trim().replace(/\s+/g, " ");
  const length = [...name].length;
  if (length === 0) return { ok: false, error: "empty" };
  if (length > PET_NAME_MAX_LENGTH) return { ok: false, error: "tooLong" };
  return { ok: true, name };
}

/** Rename the living pet. With no living pet (egg), nothing changes. `name` must be validated. */
export function renamePet(
  state: StreakState,
  overrides: NameOverrides,
  name: string,
): { state: StreakState; overrides: NameOverrides } {
  const pet = state.pet;
  if (!pet) return { state, overrides };
  return {
    state: { ...state, pet: { ...pet, name } },
    overrides: { ...overrides, [pet.id]: name },
  };
}

/** Re-apply chosen names to the living pet and graves. Returns `state` itself when unchanged. */
export function applyNameOverrides(state: StreakState, overrides: NameOverrides): StreakState {
  const petName = state.pet ? overrides[state.pet.id] : undefined;
  const petChanged = petName !== undefined && petName !== state.pet?.name;
  let gravesChanged = false;
  const graveyard = state.graveyard.map((g) => {
    const n = overrides[g.id];
    if (n === undefined || n === g.name) return g;
    gravesChanged = true;
    return { ...g, name: n };
  });
  if (!petChanged && !gravesChanged) return state;
  return {
    ...state,
    pet: petChanged && state.pet ? { ...state.pet, name: petName } : state.pet,
    graveyard: gravesChanged ? graveyard : state.graveyard,
  };
}

/** Tolerant load of persisted overrides: keeps only string values. */
export function normalizeNameOverrides(raw: unknown): NameOverrides {
  if (!raw || typeof raw !== "object") return {};
  const out: NameOverrides = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === "string") out[k] = v;
  return out;
}
