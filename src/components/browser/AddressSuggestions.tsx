import { useEffect, useState } from 'react';
import { Bookmark, Clock, Globe } from 'lucide-react';
import { searchBookmarks } from '../../services/bookmarks/bookmarksService';
import { search as searchHistory } from '../../services/history/historyService';
import { getDisplayHost } from '../../utils/url';
import styles from './AddressSuggestions.module.css';

interface Suggestion {
  id: string;
  url: string;
  title: string;
  isBookmark: boolean;
}

export function AddressSuggestions({ query, onSelect }: { query: string; onSelect: (url: string) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    const bookmarkMatches = searchBookmarks(trimmed)
      .slice(0, 5)
      .map((b) => ({ id: `bm-${b.id}`, url: b.url, title: b.title, isBookmark: true }));

    void searchHistory(trimmed).then((historyMatches) => {
      if (cancelled) return;
      const bookmarkedUrls = new Set(bookmarkMatches.map((b) => b.url));
      const historySuggestions = historyMatches
        .filter((h) => !bookmarkedUrls.has(h.url))
        .slice(0, 8)
        .map((h) => ({ id: `hist-${h.id}`, url: h.url, title: h.title, isBookmark: false }));
      setSuggestions([...bookmarkMatches, ...historySuggestions].slice(0, 8));
    });

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (suggestions.length === 0) return null;

  return (
    <div className={`${styles.list} px-glass`}>
      {suggestions.map((s) => (
        <button key={s.id} type="button" className={styles.row} onClick={() => onSelect(s.url)}>
          {s.isBookmark ? <Bookmark size={16} className={styles.bookmarkIcon} /> : <Clock size={16} className={styles.icon} />}
          <div className={styles.text}>
            <span className={styles.title}>{s.title}</span>
            <span className={styles.url}>
              <Globe size={10} /> {getDisplayHost(s.url)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
