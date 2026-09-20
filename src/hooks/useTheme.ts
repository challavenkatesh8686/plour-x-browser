import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const THEME_KEY = 'plourx-browser-theme';
const THEME_EVENT = 'plourx-browser:theme-changed';
const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(theme: Theme) {
  // Only stamp data-theme for an explicit choice; 'system' clears it so the
  // CSS media-query branch (not the attribute branch) drives the palette.
  if (theme === 'system') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = readStoredTheme();
    applyTheme(stored);
    return stored;
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));

  useEffect(() => {
    const sync = () => {
      const stored = readStoredTheme();
      setThemeState(stored);
      applyTheme(stored);
      setResolvedTheme(resolveTheme(stored));
    };
    window.addEventListener('storage', sync);
    window.addEventListener(THEME_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(THEME_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia(SYSTEM_QUERY);
    const onChange = () => setResolvedTheme(resolveTheme('system'));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    setThemeState(next);
    setResolvedTheme(resolveTheme(next));
    queueMicrotask(() => window.dispatchEvent(new Event(THEME_EVENT)));
  }, []);

  return { theme, resolvedTheme, setTheme };
}
