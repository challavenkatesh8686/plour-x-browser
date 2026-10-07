import { useCallback, useEffect, useState } from 'react';
import { FONT_OPTIONS, type FONT_SIZES, type FONT_WEIGHTS, type TEXT_CASES } from '../data/fontOptions';

export type FontWeight = (typeof FONT_WEIGHTS)[number];
export type FontSize = (typeof FONT_SIZES)[number];
export type TextCase = (typeof TEXT_CASES)[number];

export interface FontStyle {
  /** A FontOption.value; 'default' means "use the system stack, load nothing." */
  family: string;
  weight: FontWeight;
  size: FontSize;
  textCase: TextCase;
}

export const DEFAULT_FONT_STYLE: FontStyle = { family: 'default', weight: '400', size: '16px', textCase: 'none' };

/** Maps the chosen size label to a whole-chrome scale factor -- see applyFontStyle for why this uses `zoom` rather than a root font-size. */
const FONT_SIZE_SCALE: Record<FontSize, number> = {
  '14px': 0.875,
  '16px': 1,
  '18px': 1.125,
  '20px': 1.25,
};

const FONT_STYLE_KEY = 'plourx-browser-font-style';
const FONT_STYLE_EVENT = 'plourx-browser:font-style-changed';

const loadedGoogleFonts = new Set<string>();

function ensureFontLoaded(googleFont: string) {
  if (loadedGoogleFonts.has(googleFont)) return;
  loadedGoogleFonts.add(googleFont);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleFont)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function readStoredFontStyle(): FontStyle {
  try {
    const raw = localStorage.getItem(FONT_STYLE_KEY);
    if (!raw) return DEFAULT_FONT_STYLE;
    return { ...DEFAULT_FONT_STYLE, ...(JSON.parse(raw) as Partial<FontStyle>) };
  } catch {
    return DEFAULT_FONT_STYLE;
  }
}

/**
 * Family is applied by overriding the browser's own existing --px-sans token
 * (theme.css already defines `font-family: var(--px-sans)` on :root) rather
 * than introducing a parallel variable.
 *
 * Size is applied via the non-standard but Chromium-universal `zoom`
 * property, not a root font-size override: almost every font-size in this
 * codebase's CSS Modules is a literal px value, not rem, so changing the
 * root's rem base alone would have no visible effect. `zoom` scales the
 * whole chrome UI (text, icons, spacing) proportionally instead -- the same
 * trade-off a device-level "display size" setting makes. This doesn't desync
 * native WebView positioning: useViewportBounds reads getBoundingClientRect()
 * on the content host div, which already reflects the zoomed, real on-screen
 * geometry.
 */
function applyFontStyle(style: FontStyle) {
  const option = FONT_OPTIONS.find((f) => f.value === style.family);
  if (option?.googleFont) ensureFontLoaded(option.googleFont);

  const root = document.documentElement;
  if (style.family === 'default') {
    root.style.removeProperty('--px-sans');
  } else {
    root.style.setProperty('--px-sans', style.family);
  }
  root.style.setProperty('zoom', String(FONT_SIZE_SCALE[style.size]));
  document.body.style.fontWeight = style.weight;
  document.body.style.textTransform = style.textCase === 'none' ? '' : style.textCase;
}

export function useFontStyle() {
  const [fontStyle, setFontStyleState] = useState<FontStyle>(() => {
    const stored = readStoredFontStyle();
    applyFontStyle(stored);
    return stored;
  });

  useEffect(() => {
    const sync = () => {
      const stored = readStoredFontStyle();
      setFontStyleState(stored);
      applyFontStyle(stored);
    };
    window.addEventListener('storage', sync);
    window.addEventListener(FONT_STYLE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(FONT_STYLE_EVENT, sync);
    };
  }, []);

  const updateFontStyle = useCallback((patch: Partial<FontStyle>) => {
    setFontStyleState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(FONT_STYLE_KEY, JSON.stringify(next));
      applyFontStyle(next);
      return next;
    });
    queueMicrotask(() => window.dispatchEvent(new Event(FONT_STYLE_EVENT)));
  }, []);

  const resetFontStyle = useCallback(() => {
    localStorage.removeItem(FONT_STYLE_KEY);
    applyFontStyle(DEFAULT_FONT_STYLE);
    setFontStyleState(DEFAULT_FONT_STYLE);
    queueMicrotask(() => window.dispatchEvent(new Event(FONT_STYLE_EVENT)));
  }, []);

  return { fontStyle, updateFontStyle, resetFontStyle };
}
