import { Bookmark, Clock, Download, Plus, Settings, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTabs } from '../../../services/tabs/TabsContext';
import { getDisplayHost } from '../../../utils/url';
import styles from './DesktopTabStrip.module.css';

const NAV_LINKS = [
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/history', label: 'History', icon: Clock },
  // Real downloads (actual files via Electron's session API) only exist on
  // desktop this pass -- Android keeps its "open in system browser"
  // fallback instead of a half-built downloads UI, so this entry isn't
  // shown there (see isDownloadsAvailable in downloadsService.ts).
  { to: '/downloads', label: 'Downloads', icon: Download },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Shown only at wide viewports (see the media query in AppShell.module.css
 * that hides BottomNav and reveals this instead) -- a horizontal strip of
 * open tabs above the toolbar, the desktop-conventional layout, instead of
 * forcing the mobile bottom navigation onto a desktop-sized window.
 */
export function DesktopTabStrip() {
  const { tabs, activeTabId, switchTab, closeTab, openNewTab } = useTabs();
  const navigate = useNavigate();

  const selectTab = (tabId: string) => {
    switchTab(tabId);
    navigate('/');
  };

  return (
    <div className={styles.strip} role="tablist" aria-label="Open tabs">
      <div className={styles.scroller}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.faviconUrl ? (
              <img src={tab.faviconUrl} alt="" className={styles.favicon} />
            ) : (
              <img src="/plourx-logo.png" alt="" className={styles.faviconPlaceholder} />
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
              <X size={13} />
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.newTab}
        aria-label="New tab"
        onClick={() => {
          openNewTab();
          navigate('/');
        }}
      >
        <Plus size={16} />
      </button>

      <div className={styles.navLinks}>
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            title={label}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <Icon size={17} />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
