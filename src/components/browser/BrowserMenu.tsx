import { useEffect, useRef } from 'react';
import { Monitor, Share2, Smartphone } from 'lucide-react';
import { useTabs } from '../../services/tabs/TabsContext';
import styles from './BrowserMenu.module.css';

/**
 * Only lists actions that actually work end-to-end (real Android share
 * sheet, real desktop-UA reload) -- per the "no fake functionality" rule,
 * items like Find in Page or Downloads don't appear here until they do too.
 */
export function BrowserMenu({ onClose }: { onClose: () => void }) {
  const { activeTab, toggleDesktopMode, shareActiveTab } = useTabs();
  const ref = useRef<HTMLDivElement>(null);

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
    </div>
  );
}
