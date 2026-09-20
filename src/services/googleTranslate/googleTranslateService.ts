/**
 * Ported from plour-x-dialer's src/services/googleTranslate/googleTranslateService.ts
 * (itself porting plour-x-website's src/lib/googleTranslate.ts): Google's
 * free client-side "Website Translate" widget -- no API key, no backend.
 * It injects a hidden container, loads Google's script, and drives the
 * `<select class="goog-te-combo">` the widget renders asynchronously.
 *
 * Deliberately NOT loaded at app startup: the script is only injected the
 * first time the user opens the language picker, so no third-party request
 * happens until they opt in. This translates PlourX Browser's own chrome UI
 * text -- it has nothing to do with (and cannot reach into) the separate
 * native WebView/WebContentsView that renders an actual browsed page.
 */

const CONTAINER_ID = 'google_translate_element';
const SCRIPT_SRC = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
const COOKIE_NAME = 'googtrans';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          containerId: string,
        ) => unknown;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function ensureContainer(): void {
  if (document.getElementById(CONTAINER_ID)) return;
  const el = document.createElement('div');
  el.id = CONTAINER_ID;
  el.style.position = 'absolute';
  el.style.top = '-9999px';
  el.style.left = '-9999px';
  document.body.appendChild(el);
}

export function loadGoogleTranslate(includedLanguages: string): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    ensureContainer();
    window.googleTranslateElementInit = () => {
      try {
        new window.google!.translate.TranslateElement(
          { pageLanguage: 'en', includedLanguages, autoDisplay: false },
          CONTAINER_ID,
        );
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to initialize Google Translate.'));
      }
    };

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load the translation service.'));
    document.body.appendChild(script);
  });

  return loadPromise;
}

function findCombo(): HTMLSelectElement | null {
  return document.querySelector<HTMLSelectElement>('select.goog-te-combo');
}

/** Waits for the widget's <select> to appear (it renders asynchronously after init). */
function waitForCombo(timeoutMs = 8000): Promise<HTMLSelectElement> {
  const existing = findCombo();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const combo = findCombo();
      if (combo) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(combo);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error('The translation service did not respond in time.'));
    }, timeoutMs);
  });
}

/**
 * 'en' (or null) clears translation and restores the original text. Note:
 * the reset case must select the literal 'en' option, not '' -- an empty
 * value isn't a real option the widget's change handler recognizes as a
 * language, so it silently no-ops instead of reverting. Selecting 'en'
 * (matching the declared pageLanguage) is what the widget treats as "no
 * translation."
 */
export async function setPageLanguage(code: string | null, includedLanguages: string): Promise<void> {
  await loadGoogleTranslate(includedLanguages);
  const combo = await waitForCombo();
  combo.value = code && code !== 'en' ? code : 'en';
  combo.dispatchEvent(new Event('change'));
}

export function getCurrentPageLanguage(): string | null {
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  // Cookie value looks like "/en/es" (from/to).
  const parts = decodeURIComponent(match[1]!).split('/');
  const to = parts[2];
  return to && to !== 'en' ? to : null;
}
