/* eslint-disable react-refresh/only-export-components -- vendored toggle library: files export both components and helpers */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_TOGGLE_ID, TOGGLE_IDS, type ToggleConfig, type ToggleId } from './types';

export interface ToggleSettings {
  /** Design used by <Toggle> when no `type` is given. */
  defaultType: ToggleId;
  /** Designs available to pick from (the default falls back to the first enabled one if it is not in here). */
  enabled: ToggleId[];
  /** Per-design config overrides. */
  configs: Partial<Record<ToggleId, ToggleConfig>>;
  /** Config applied to every design. */
  defaults: ToggleConfig;
}

export const DEFAULT_TOGGLE_SETTINGS: ToggleSettings = {
  defaultType: DEFAULT_TOGGLE_ID,
  enabled: [...TOGGLE_IDS],
  configs: {},
  defaults: {},
};

const ToggleSettingsContext = createContext<ToggleSettings>(DEFAULT_TOGGLE_SETTINGS);

export function ToggleSettingsProvider({ value, children }: { value?: Partial<ToggleSettings>; children: ReactNode }) {
  const merged = useMemo<ToggleSettings>(() => ({ ...DEFAULT_TOGGLE_SETTINGS, ...value }), [value]);
  return <ToggleSettingsContext.Provider value={merged}>{children}</ToggleSettingsContext.Provider>;
}

/** Settings from the nearest provider, or the built-in defaults when there is none. */
export function useToggleSettings(): ToggleSettings {
  return useContext(ToggleSettingsContext);
}

/** The design to render: an explicit valid `type`, else the global default (or the first enabled design). */
export function pickToggleType(type: ToggleId | undefined, s: ToggleSettings): ToggleId {
  if (type && (TOGGLE_IDS as readonly string[]).includes(type)) return type;
  if (s.enabled.includes(s.defaultType)) return s.defaultType;
  return s.enabled[0] ?? DEFAULT_TOGGLE_ID;
}
