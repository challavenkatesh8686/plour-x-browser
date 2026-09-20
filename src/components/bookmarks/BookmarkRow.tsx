import { Trash2 } from 'lucide-react';
import type { Bookmark } from '../../services/bookmarks/types';
import { getDisplayHost } from '../../utils/url';
import styles from './BookmarkRow.module.css';

export function BookmarkRow({ bookmark, onOpen, onDelete }: { bookmark: Bookmark; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className={styles.row}>
      <button type="button" className={styles.main} onClick={onOpen}>
        {bookmark.faviconUrl ? (
          <img src={bookmark.faviconUrl} alt="" className={styles.favicon} />
        ) : (
          <img src="/plourx-logo.png" alt="" className={styles.faviconPlaceholder} />
        )}
        <div className={styles.text}>
          <span className={styles.title}>{bookmark.title}</span>
          <span className={styles.url}>{getDisplayHost(bookmark.url)}</span>
        </div>
      </button>
      <button type="button" className={styles.delete} aria-label="Remove bookmark" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
