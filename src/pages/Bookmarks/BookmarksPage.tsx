import { useEffect, useState } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookmarkRow } from '../../components/bookmarks/BookmarkRow';
import { EmptyState } from '../../components/common/EmptyState';
import { listBookmarks, onBookmarksChanged, removeBookmark, searchBookmarks } from '../../services/bookmarks/bookmarksService';
import type { Bookmark } from '../../services/bookmarks/types';
import { useTabs } from '../../services/tabs/TabsContext';
import styles from './BookmarksPage.module.css';

export function BookmarksPage() {
  const [query, setQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => listBookmarks());
  const { navigateActiveTab } = useTabs();
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => setBookmarks(query ? searchBookmarks(query) : listBookmarks());
    refresh();
    return onBookmarksChanged(refresh);
  }, [query]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bookmarks</h1>
        {bookmarks.length > 0 || query ? (
          <input
            className={styles.search}
            placeholder="Search bookmarks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : null}
      </div>

      <div className={styles.list}>
        {bookmarks.length === 0 ? (
          <EmptyState icon={BookmarkIcon} message="Your saved places will appear here." />
        ) : (
          bookmarks.map((bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              bookmark={bookmark}
              onOpen={() => {
                navigateActiveTab(bookmark.url);
                navigate('/');
              }}
              onDelete={() => removeBookmark(bookmark.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
