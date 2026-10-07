import { useEffect, useRef, useState } from 'react';
import { Languages, Maximize2, Minimize2, Minus, Monitor, Moon, Plus, Printer, Search, Share2, Smartphone, Sun } from 'lucide-react';
import { useTabs } from '../../services/tabs/TabsContext';
import { useTheme } from '../../hooks/useTheme';
import { useGoogleTranslate } from '../../hooks/useGoogleTranslate';
import { useFindBar } from '../../hooks/useFindBar';
import { useFullscreen } from '../../hooks/useFullscreen';
import { ZOOM_STEPS } from '../../services/tabs/zoomSteps';
import { LanguageSheet } from '../common/LanguageSheet';
import { IconButton } from '../common/IconButton';
import styles from './BrowserMenu.module.css';

/**
 * Only lists actions that actually work end-to-end (real Android share
 * sheet, real desktop-UA reload, real find-in-page/zoom/fullscreen/print on
 * both platforms) -- per the "no fake functionality" rule, items don't
 * appear here until they actually work.
 */
export function BrowserMenu({ onClose }: { onClose: () => void }) {
  const { activeTab, toggleDesktopMode, shareActiveTab, setActiveTabZoom, printActiveTab } = useTabs();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, pending, error, setLanguage } = useGoogleTranslate();
  const { open: openFindBar } = useFindBar();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
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

  const zoomPercent = activeTab.zoomPercent;
  const zoomOut = () => setActiveTabZoom([...ZOOM_STEPS].reverse().find((step) => step < zoomPercent) ?? ZOOM_STEPS[0]);
  const zoomIn = () => setActiveTabZoom(ZOOM_STEPS.find((step) => step > zoomPercent) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]);

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
          openFindBar();
          onClose();
        }}
      >
        <Search size={17} />
        Find in page
      </button>

      <div className={styles.zoomRow}>
        <IconButton icon={<Minus size={14} />} label="Zoom out" size="sm" variant="plain" onClick={zoomOut} />
        <button type="button" className={styles.zoomReset} onClick={() => setActiveTabZoom(100)}>
          {zoomPercent}%
        </button>
        <IconButton icon={<Plus size={14} />} label="Zoom in" size="sm" variant="plain" onClick={zoomIn} />
      </div>

      <button
        type="button"
        className={styles.item}
        onClick={() => {
          toggleFullscreen();
          onClose();
        }}
      >
        {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      </button>
      <button
        type="button"
        className={styles.item}
        onClick={() => {
          printActiveTab();
          onClose();
        }}
      >
        <Printer size={17} />
        Print
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
