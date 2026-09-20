export interface BrowserPreferences {
  defaultSearchEngineId: string;
  openLinksInNewTab: boolean;
  confirmBeforeClosingMultipleTabs: boolean;
}

const STORAGE_KEY = 'plourx-browser-preferences';
const CHANGE_EVENT = 'plourx-browser:preferences-changed';

export const DEFAULTS: BrowserPreferences = {
  defaultSearchEngineId: 'google',
  openLinksInNewTab: false,
  confirmBeforeClosingMultipleTabs: true,
};

export function getPreferences(): BrowserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<BrowserPreferences>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setPreference<K extends keyof BrowserPreferences>(key: K, value: BrowserPreferences[K]) {
  try {
    const next = { ...getPreferences(), [key]: value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // best effort only -- these are cosmetic device-local preferences
  }
}

export function onPreferencesChanged(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
