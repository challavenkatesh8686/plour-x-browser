import { Bookmark, Clock, Home, Layers, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTabs } from '../../services/tabs/TabsContext';
import styles from './BottomNav.module.css';

const ROUTE_TABS = [
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const { tabs, openTabManager, isTabManagerOpen } = useTabs();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav} aria-label="Primary">
      <NavLink
        to="/"
        end
        className={({ isActive }) => [styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
      >
        {({ isActive }) => (
          <>
            <Home size={22} strokeWidth={isActive ? 2.4 : 1.8} />
            <span className={styles.label}>Home</span>
          </>
        )}
      </NavLink>

      <button
        type="button"
        className={[styles.tab, isTabManagerOpen ? styles.active : ''].filter(Boolean).join(' ')}
        onClick={() => {
          navigate('/');
          openTabManager();
        }}
      >
        <span className={styles.tabsIconWrap}>
          <Layers size={22} strokeWidth={isTabManagerOpen ? 2.4 : 1.8} />
          <span className={styles.tabsCount}>{tabs.length}</span>
        </span>
        <span className={styles.label}>Tabs</span>
      </button>

      {ROUTE_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => [styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className={styles.label}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
