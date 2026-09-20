import { useState } from 'react';
import { Search, User } from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { useTabs } from '../../services/tabs/TabsContext';
import { AuthSheet } from '../auth/AuthSheet';
import { ShortcutGrid } from './ShortcutGrid';
import styles from './NewTabHome.module.css';

export function NewTabHome() {
  const { navigateActiveTab } = useTabs();
  const { isAuthenticated, user, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.brand}>PlourX Browser</h1>

      <form
        className={styles.searchForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) navigateActiveTab(query);
        }}
      >
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search the web or enter a URL"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <ShortcutGrid />

      <button type="button" className={styles.accountRow} onClick={() => (isAuthenticated ? void signOut() : setShowAuth(true))}>
        <User size={14} />
        {isAuthenticated ? `Signed in as ${user?.email} · Sign out` : 'Sign in to sync your PlourX account'}
      </button>

      {showAuth && <AuthSheet onClose={() => setShowAuth(false)} />}
    </div>
  );
}
