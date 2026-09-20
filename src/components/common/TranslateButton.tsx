import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { IconButton } from './IconButton';
import { LanguageSheet } from './LanguageSheet';
import { useGoogleTranslate } from '../../hooks/useGoogleTranslate';

/**
 * Same mechanism as plour-x-website's language switcher (Google's free
 * Website Translate widget) -- translates this app's own chrome UI text,
 * not the separately-rendered content of a browsed page.
 */
export function TranslateButton() {
  const { language, pending, error, setLanguage } = useGoogleTranslate();
  const [open, setOpen] = useState(false);

  async function handleSelect(code: string | null) {
    const ok = await setLanguage(code);
    if (ok) setOpen(false);
  }

  return (
    <>
      <IconButton
        icon={pending ? <Loader2 size={18} className="px-spin" /> : <Languages size={18} />}
        label={language ? `Translated (${language})` : 'Translate this app'}
        size="sm"
        variant="plain"
        onClick={() => setOpen(true)}
      />
      <LanguageSheet
        open={open}
        currentLanguage={language}
        pending={pending}
        error={error}
        onSelect={(code) => void handleSelect(code)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
