import { useEffect, useRef, useState } from 'react';
import { Languages, Monitor, Moon, Share2, Smartphone, Sun } from 'lucide-react';
import { useTabs } from '../../services/tabs/TabsContext';
import { useTheme } from '../../hooks/useTheme';
import { useGoogleTranslate } from '../../hooks/useGoogleTranslate';
import { LanguageSheet } from '../common/LanguageSheet';
import styles from './BrowserMenu.module.css';

/**
 * Only lists actions that actually work end-to-end (real Android share
 * sheet, real desktop-UA reload) -- per the "no fake functionality" rule,
 * items like Find in Page or Downloads don't appear here until they do too.
 */
export function BrowserMenu({ onClose }: { onClose: () => void }) {
  const { activeTab, toggleDesktopMode, shareActiveTab } = useTabs();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, pending, error, setLanguage } = useGoogleTranslate();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [onClose]);

  if (!activeTab?.url) return null;

  return (
    <div ref={ref} className={`${styles.menu} px-glass`}>
      <button
        type="button"
        className={styles.item}
        onClick={() => {
          shareActiveTab();
          onClose();
        }}
      >
        <Share2 size={17} />
        Share page
      </button>
      <button
        type="button"
        className={styles.item}
        onClick={() => {
          toggleDesktopMode();
          onClose();
        }}
      >
        {activeTab.isDesktopMode ? <Smartphone size={17} /> : <Monitor size={17} />}
        {activeTab.isDesktopMode ? 'Mobile site' : 'Desktop site'}
      </button>
      <button type="button" className={styles.item} onClick={toggleTheme}>
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
      <button type="button" className={styles.item} onClick={() => setLanguageSheetOpen(true)}>
        <Languages size={17} />
        {language ? `Translated (${language})` : 'Translate app'}
      </button>
      <LanguageSheet
        open={languageSheetOpen}
        currentLanguage={language}
        pending={pending}
        error={error}
        onSelect={(code) => {
          void setLanguage(code).then((ok) => {
            if (ok) {
              setLanguageSheetOpen(false);
              onClose();
            }
          });
        }}
        onClose={() => setLanguageSheetOpen(false)}
      />
    </div>
  );
}
