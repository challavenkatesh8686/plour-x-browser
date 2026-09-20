import { useCallback, useEffect, useState } from 'react';
import { getPreferences, onPreferencesChanged, setPreference, type BrowserPreferences } from '../services/preferences/preferencesService';

export function usePreferences() {
  const [preferences, setPreferences] = useState<BrowserPreferences>(() => getPreferences());

  useEffect(() => onPreferencesChanged(() => setPreferences(getPreferences())), []);

  const update = useCallback(<K extends keyof BrowserPreferences>(key: K, value: BrowserPreferences[K]) => {
    setPreference(key, value);
    setPreferences(getPreferences());
  }, []);

  return { preferences, update };
}
