import { useState } from 'react';
import { ArrowLeft, ArrowRight, MoreVertical, Plus, RotateCw, Star, X } from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { useTabs } from '../../services/tabs/TabsContext';
import { useBookmarkToggle } from '../../services/bookmarks/useBookmarkToggle';
import { AddressBar } from './AddressBar';
import { BrowserMenu } from './BrowserMenu';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const { activeTab, goBack, goForward, reload, stop, openNewTab } = useTabs();
  const { bookmarked, toggle: toggleBookmark } = useBookmarkToggle(activeTab);
  const [menuOpen, setMenuOpen] = useState(false);

  const url = activeTab?.url ?? '';

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <IconButton
          icon={<ArrowLeft size={18} />}
          label="Back"
          size="sm"
          variant="plain"
          disabled={!activeTab?.canGoBack}
          onClick={goBack}
        />
        <IconButton
          icon={<ArrowRight size={18} />}
          label="Forward"
          size="sm"
          variant="plain"
          disabled={!activeTab?.canGoForward}
          onClick={goForward}
        />

        <AddressBar />

        {url && (
          <IconButton
            icon={<Star size={18} fill={bookmarked ? 'currentColor' : 'none'} />}
            label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            size="sm"
            variant="plain"
            className={bookmarked ? styles.bookmarked : undefined}
            onClick={toggleBookmark}
          />
        )}

        <IconButton
          icon={activeTab?.isLoading ? <X size={18} /> : <RotateCw size={16} />}
          label={activeTab?.isLoading ? 'Stop' : 'Reload'}
          size="sm"
          variant="plain"
          disabled={!url}
          onClick={activeTab?.isLoading ? stop : reload}
        />

        <IconButton icon={<Plus size={18} />} label="New tab" size="sm" variant="plain" onClick={openNewTab} />

        {url && (
          <div className={styles.menuAnchor}>
            <IconButton
              icon={<MoreVertical size={18} />}
              label="More options"
              size="sm"
              variant="plain"
              onClick={() => setMenuOpen((open) => !open)}
            />
            {menuOpen && <BrowserMenu onClose={() => setMenuOpen(false)} />}
          </div>
        )}
      </div>

      {activeTab?.isLoading && (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${Math.max(8, activeTab.progress)}%` }} />
        </div>
      )}
    </div>
  );
}
