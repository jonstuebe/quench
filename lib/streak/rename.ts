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

/** Trim, collapse inner whitespace, and require 1–20 user-perceived characters. */
export function validatePetName(raw: string): PetNameResult {
  const name = raw.trim().replace(/\s+/g, " ");
  const length = countCharacters(name);
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

const hasSegmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";

/**
 * User-perceived characters: grapheme clusters via `Intl.Segmenter` (a ZWJ family or a flag is
 * one), falling back to code points where the engine lacks it (older Hermes).
 */
export function countCharacters(s: string, useSegmenter: boolean = hasSegmenter): number {
  if (!useSegmenter) return [...s].length;
  let n = 0;
  for (const _ of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)) n++;
  return n;
}

/**
 * Drop names for pets that are gone for good: not the living pet, not buried, and not a
 * tentative hatch after `judgedThrough` that an undone drink rewound (it re-hatches with the
 * same id, so its name must survive). Returns `overrides` itself when nothing is dropped.
 */
export function pruneNameOverrides(state: StreakState, overrides: NameOverrides): NameOverrides {
  const keep = new Set(state.graveyard.map((g) => g.id));
  if (state.pet) keep.add(state.pet.id);
  const stillTentative = (id: string) => {
    const day = id.split("#")[0] ?? "";
    return state.judgedThrough === null || day > state.judgedThrough;
  };
  const ids = Object.keys(overrides);
  const kept = ids.filter((id) => keep.has(id) || stillTentative(id));
  if (kept.length === ids.length) return overrides;
  return Object.fromEntries(kept.map((id) => [id, overrides[id]!]));
}
