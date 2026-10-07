import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useTabs } from '../../services/tabs/TabsContext';
import { usePreferences } from '../../hooks/usePreferences';
import { ConfirmSheet } from '../common/ConfirmSheet';
import { IconButton } from '../common/IconButton';
import { TabThumbnailCard } from './TabThumbnailCard';
import styles from './TabManagerOverlay.module.css';

export function TabManagerOverlay() {
  const { tabs, activeTabId, closeTabManager, openNewTab, closeAllTabs } = useTabs();
  const { preferences } = usePreferences();
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);

  const handleCloseAll = () => {
    if (preferences.confirmBeforeClosingMultipleTabs) {
      setShowCloseAllConfirm(true);
    } else {
      closeAllTabs();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span className={styles.count}>{tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}</span>
        <div className={styles.headerActions}>
          {tabs.length > 1 ? (
            <IconButton icon={<Trash2 size={18} />} label="Close all tabs" size="sm" onClick={handleCloseAll} />
          ) : null}
          <IconButton icon={<X size={20} />} label="Close" size="sm" onClick={closeTabManager} />
        </div>
      </div>

      <ConfirmSheet
        open={showCloseAllConfirm}
        title={`Close all ${tabs.length} tabs?`}
        options={[{ value: 'confirm', label: 'Close all tabs', destructive: true }]}
        cancelLabel="Cancel"
        onClose={() => setShowCloseAllConfirm(false)}
        onSelect={() => {
          closeAllTabs();
          setShowCloseAllConfirm(false);
        }}
      />

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
