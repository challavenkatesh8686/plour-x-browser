import { getPreferences, setPreference } from '../preferences/preferencesService';
import { DEFAULT_SEARCH_ENGINES } from './searchEngines';
import type { SearchEngine } from './types';

/**
 * Single swap point for admin-governed search engines. Today this just
 * returns the static built-in registry; a later pass can replace the body
 * with a `supabase.from('search_engines')` read gated by the ecosystem's
 * existing `profiles.role`-based `is_admin` RLS pattern (see
 * plour-x-ai/supabase 0001_stage1_rbac.sql) without changing any call site.
 */
export function getSearchEngines(): SearchEngine[] {
  return DEFAULT_SEARCH_ENGINES;
}

export function getSelectedSearchEngine(): SearchEngine {
  const { defaultSearchEngineId } = getPreferences();
  return getSearchEngines().find((engine) => engine.id === defaultSearchEngineId) ?? getSearchEngines()[0];
}

export function setSelectedSearchEngine(engineId: string) {
  setPreference('defaultSearchEngineId', engineId);
}

export function buildSearchUrl(query: string, engine: SearchEngine = getSelectedSearchEngine()): string {
  return engine.searchUrlTemplate.replace('{query}', encodeURIComponent(query));
}
