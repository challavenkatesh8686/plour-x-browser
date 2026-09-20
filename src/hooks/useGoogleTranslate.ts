import { useCallback, useEffect, useState } from 'react';
import { getCurrentPageLanguage, setPageLanguage } from '../services/googleTranslate/googleTranslateService';
import { TRANSLATE_INCLUDED_LANGUAGES } from '../data/translateLanguages';

export function useGoogleTranslate() {
  const [language, setLanguageState] = useState<string | null>(() => getCurrentPageLanguage());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLanguage = useCallback(async (code: string | null): Promise<boolean> => {
    setPending(true);
    setError(null);
    try {
      await setPageLanguage(code, TRANSLATE_INCLUDED_LANGUAGES);
      setLanguageState(code);
      return true;
    } catch {
      setError('Unable to reach the translation service.');
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  // The widget only translates the DOM present when it runs. Since each
  // screen in this app mounts fresh on navigation, silently re-apply an
  // already-chosen language to the newly-mounted page's text.
  useEffect(() => {
    const active = getCurrentPageLanguage();
    if (active) void setPageLanguage(active, TRANSLATE_INCLUDED_LANGUAGES).catch(() => {});
  }, []);

  return { language, pending, error, setLanguage };
}
