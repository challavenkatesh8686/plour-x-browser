import { useCallback, useEffect, useState } from 'react';

export type AccentColor = 'pink' | 'purple' | 'blue' | 'teal' | 'amber';

export const ACCENT_COLORS: AccentColor[] = ['pink', 'purple', 'blue', 'teal', 'amber'];

/** Swatch hex per accent -- kept separate from the CSS variants in theme.css (used only to paint the picker itself; the actual UI recolor comes from the --px-accent-* tokens those [data-accent] blocks set). */
export const ACCENT_SWATCH_HEX: Record<AccentColor, string> = {
  pink: '#e8489e',
  purple: '#9333ea',
  blue: '#3b82f6',
  teal: '#14b8a6',
  amber: '#f59e0b',
};

const ACCENT_KEY = 'plourx-browser-accent';
const ACCENT_EVENT = 'plourx-browser:accent-changed';

function readStoredAccent(): AccentColor {
  const stored = localStorage.getItem(ACCENT_KEY);
  return stored && (ACCENT_COLORS as string[]).includes(stored) ? (stored as AccentColor) : 'pink';
}

function applyAccent(accent: AccentColor) {
  // Pink is the baseline defined directly on :root in theme.css -- clearing
  // the attribute (rather than stamping data-accent="pink") is how a reset
  // to the default works, same pattern as useTheme's 'system' case.
  if (accent === 'pink') {
    delete document.documentElement.dataset.accent;
  } else {
    document.documentElement.dataset.accent = accent;
  }
}

export function useAccentColor() {
  const [accent, setAccentState] = useState<AccentColor>(() => {
    const stored = readStoredAccent();
    applyAccent(stored);
    return stored;
  });

  useEffect(() => {
    const sync = () => {
      const stored = readStoredAccent();
      setAccentState(stored);
      applyAccent(stored);
    };
    window.addEventListener('storage', sync);
    window.addEventListener(ACCENT_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(ACCENT_EVENT, sync);
    };
  }, []);

  const setAccent = useCallback((next: AccentColor) => {
    localStorage.setItem(ACCENT_KEY, next);
    applyAccent(next);
    setAccentState(next);
    queueMicrotask(() => window.dispatchEvent(new Event(ACCENT_EVENT)));
  }, []);

  return { accent, setAccent };
}
