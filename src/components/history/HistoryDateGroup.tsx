import type { HistoryEntry } from '../../services/history/types';
import { HistoryRow } from './HistoryRow';
import styles from './HistoryDateGroup.module.css';

export function HistoryDateGroup({
  label,
  entries,
  onOpen,
  onDelete,
}: {
  label: string;
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
}) {
  return (
    <section className={styles.group}>
      <h2 className={styles.label}>{label}</h2>
      <div className={styles.rows}>
        {entries.map((entry) => (
          <HistoryRow key={entry.id} entry={entry} onOpen={() => onOpen(entry)} onDelete={() => onDelete(entry)} />
        ))}
      </div>
    </section>
  );
}
