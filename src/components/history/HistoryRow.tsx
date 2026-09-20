import { Trash2 } from 'lucide-react';
import type { HistoryEntry } from '../../services/history/types';
import { getDisplayHost } from '../../utils/url';
import styles from './HistoryRow.module.css';

export function HistoryRow({ entry, onOpen, onDelete }: { entry: HistoryEntry; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className={styles.row}>
      <button type="button" className={styles.main} onClick={onOpen}>
        {entry.faviconUrl ? (
          <img src={entry.faviconUrl} alt="" className={styles.favicon} />
        ) : (
          <img src="/plourx-logo.png" alt="" className={styles.faviconPlaceholder} />
        )}
        <div className={styles.text}>
          <span className={styles.title}>{entry.title}</span>
          <span className={styles.url}>{getDisplayHost(entry.url)}</span>
        </div>
        <span className={styles.time}>
          {new Date(entry.visitedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </span>
      </button>
      <button type="button" className={styles.delete} aria-label="Remove from history" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
