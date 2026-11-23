import { TOGGLE_CATEGORIES, TOGGLE_DEFS, TOGGLE_IDS, type ToggleCategory, type ToggleDef, type ToggleId } from './types';

const BY_ID = new Map<ToggleId, ToggleDef>(TOGGLE_DEFS.map((d) => [d.id, d]));

export function isToggleId(v: unknown): v is ToggleId {
  return typeof v === 'string' && (TOGGLE_IDS as readonly string[]).includes(v);
}

export function getToggleDef(id: ToggleId): ToggleDef {
  return BY_ID.get(id) as ToggleDef;
}

/** Designs grouped by category, in registry order. */
export const TOGGLES_BY_CATEGORY: Record<ToggleCategory, ToggleDef[]> = Object.fromEntries(
  TOGGLE_CATEGORIES.map((c) => [c, TOGGLE_DEFS.filter((d) => d.category === c)]),
) as Record<ToggleCategory, ToggleDef[]>;
