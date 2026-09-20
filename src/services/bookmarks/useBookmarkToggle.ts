import { useEffect, useState } from 'react';
import { addBookmark, isBookmarked, onBookmarksChanged, removeBookmarkByUrl } from './bookmarksService';
import type { Tab } from '../tabs/types';

/** Shared by the toolbar's star button and the Ctrl+D keyboard shortcut so both stay in sync with one implementation. */
export function useBookmarkToggle(tab: Tab | null) {
  const url = tab?.url ?? '';
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const sync = () => setBookmarked(url ? isBookmarked(url) : false);
    sync();
    return onBookmarksChanged(sync);
  }, [url]);

  const toggle = () => {
    if (!url) return;
    if (bookmarked) {
      removeBookmarkByUrl(url);
    } else {
      addBookmark({ url, title: tab?.title || url, faviconUrl: tab?.faviconUrl ?? null });
    }
  };

  return { bookmarked, toggle };
}
