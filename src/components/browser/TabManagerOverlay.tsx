import { Plus, X } from 'lucide-react';
import { useTabs } from '../../services/tabs/TabsContext';
import { IconButton } from '../common/IconButton';
import { TabThumbnailCard } from './TabThumbnailCard';
import styles from './TabManagerOverlay.module.css';

export function TabManagerOverlay() {
  const { tabs, activeTabId, closeTabManager, openNewTab } = useTabs();

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span className={styles.count}>{tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}</span>
        <IconButton icon={<X size={20} />} label="Close" size="sm" onClick={closeTabManager} />
      </div>

      <div className={styles.grid}>
        {tabs.map((tab) => (
          <TabThumbnailCard key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
        ))}
      </div>

      <button type="button" className={styles.newTabButton} onClick={openNewTab}>
        <Plus size={18} /> New tab
      </button>
    </div>
  );
}
