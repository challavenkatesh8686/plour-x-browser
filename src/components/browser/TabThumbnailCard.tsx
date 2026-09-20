import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Tab } from '../../services/tabs/types';
import { getDisplayHost } from '../../utils/url';
import { useTabs } from '../../services/tabs/TabsContext';
import styles from './TabThumbnailCard.module.css';

export function TabThumbnailCard({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const { switchTab, closeTab, requestSnapshot } = useTabs();

  useEffect(() => {
    if (tab.url && !tab.thumbnailBase64) requestSnapshot(tab.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id]);

  return (
    <button
      type="button"
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      onClick={() => switchTab(tab.id)}
    >
      <div className={styles.header}>
        {tab.faviconUrl ? (
          <img src={tab.faviconUrl} alt="" className={styles.favicon} />
        ) : (
          <div className={styles.faviconPlaceholder} />
        )}
        <span className={styles.title}>{tab.url ? tab.title || getDisplayHost(tab.url) : 'New Tab'}</span>
        <span
          role="button"
          aria-label="Close tab"
          className={styles.close}
          onClick={(e) => {
            e.stopPropagation();
            closeTab(tab.id);
          }}
        >
          <X size={14} />
        </span>
      </div>
      <div className={styles.preview}>
        {tab.thumbnailBase64 ? (
          <img src={`data:image/png;base64,${tab.thumbnailBase64}`} alt="" className={styles.previewImage} />
        ) : tab.isCrashed ? (
          <div className={styles.crashed}>
            <AlertTriangle size={22} />
            <span>Tab crashed -- tap to reload</span>
          </div>
        ) : (
          <span className={styles.previewFallback}>{tab.url ? getDisplayHost(tab.url) : 'Search or enter web address'}</span>
        )}
      </div>
    </button>
  );
}
