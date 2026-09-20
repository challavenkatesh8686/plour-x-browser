import { useState } from 'react';
import { Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth/AuthContext';
import { useTabs } from '../../services/tabs/TabsContext';
import { ShortcutGrid } from './ShortcutGrid';
import styles from './NewTabHome.module.css';

export function NewTabHome() {
  const { navigateActiveTab } = useTabs();
  const { isAuthenticated, user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

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

      <button
        type="button"
        className={styles.accountRow}
        onClick={() => (isAuthenticated ? void signOut() : navigate('/login', { state: { from: '/' } }))}
      >
        <User size={14} />
        {isAuthenticated ? `Signed in as ${profile?.name || user?.email} · Sign out` : 'Sign in to sync your PlourX account'}
      </button>
    </div>
  );
}
