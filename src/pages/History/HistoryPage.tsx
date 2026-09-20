import { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { HistoryDateGroup } from '../../components/history/HistoryDateGroup';
import * as historyService from '../../services/history/historyService';
import type { HistoryDateGroup as HistoryDateGroupType } from '../../services/history/historyService';
import type { HistoryDeleteRange, HistoryEntry } from '../../services/history/types';
import { useTabs } from '../../services/tabs/TabsContext';
import styles from './HistoryPage.module.css';

const RANGE_OPTIONS: { value: HistoryDeleteRange; label: string }[] = [
  { value: 'lastHour', label: 'Last hour' },
  { value: 'today', label: 'Today' },
  { value: 'all', label: 'All time' },
];

export function HistoryPage() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<HistoryDateGroupType[]>([]);
  const [searchResults, setSearchResults] = useState<HistoryEntry[] | null>(null);
  const [showClearSheet, setShowClearSheet] = useState(false);
  const { navigateActiveTab } = useTabs();
  const navigate = useNavigate();

  const refresh = async () => {
    if (query.trim()) {
      setSearchResults(await historyService.search(query));
    } else {
      setSearchResults(null);
      setGroups(await historyService.listGroupedByDate());
    }
  };

  useEffect(() => {
    // Intentional fetch-on-dependency-change: query changes and history
    // mutations both require re-reading from IndexedDB, which is async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    return historyService.onHistoryChanged(() => void refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openEntry = (entry: HistoryEntry) => {
    navigateActiveTab(entry.url);
    navigate('/');
  };

  const isEmpty = searchResults ? searchResults.length === 0 : groups.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>History</h1>
          <button type="button" className={styles.clearButton} onClick={() => setShowClearSheet(true)} aria-label="Clear browsing data">
            <Trash2 size={16} />
          </button>
        </div>
        {!isEmpty || query ? (
          <input className={styles.search} placeholder="Search history" value={query} onChange={(e) => setQuery(e.target.value)} />
        ) : null}
      </div>

      <div className={styles.list}>
        {isEmpty ? (
          <EmptyState icon={Clock} message="Your browsing history will appear here." />
        ) : searchResults ? (
          <HistoryDateGroup
            label="Results"
            entries={searchResults}
            onOpen={openEntry}
            onDelete={(entry) => void historyService.deleteEntry(entry.id)}
          />
        ) : (
          groups.map((group) => (
            <HistoryDateGroup
              key={group.label}
              label={group.label}
              entries={group.entries}
              onOpen={openEntry}
              onDelete={(entry) => void historyService.deleteEntry(entry.id)}
            />
          ))
        )}
      </div>

      {showClearSheet && (
        <div className={styles.sheetBackdrop} onClick={() => setShowClearSheet(false)}>
          <div className={`${styles.sheet} px-glass`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.sheetTitle}>Clear browsing data</h2>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.sheetOption}
                onClick={async () => {
                  await historyService.deleteRange(option.value);
                  setShowClearSheet(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
