import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SettingsSubpageHeader } from '../../components/settings/SettingsSubpageHeader';
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsSection';
import { SettingsActionButton } from '../../components/settings/SettingsActionButton';
import { Switch } from '../../components/common/Switch';
import * as historyService from '../../services/history/historyService';
import type { HistoryDeleteRange } from '../../services/history/types';
import * as downloadsService from '../../services/downloads/downloadsService';
import { clearBrowsingData } from '../../services/browserEngine/browserEngineService';
import styles from './PrivacySettingsPage.module.css';

const TIME_RANGES: { value: HistoryDeleteRange; label: string }[] = [
  { value: 'lastHour', label: 'Last hour' },
  { value: 'last24Hours', label: 'Last 24 hours' },
  { value: 'last7Days', label: 'Last 7 days' },
  { value: 'last4Weeks', label: 'Last 4 weeks' },
  { value: 'all', label: 'All time' },
];

interface DataTypeSelection {
  history: boolean;
  siteData: boolean;
  cache: boolean;
  downloads: boolean;
}

const DEFAULT_SELECTION: DataTypeSelection = { history: true, siteData: false, cache: false, downloads: false };

export function PrivacySettingsPage() {
  const [showSheet, setShowSheet] = useState(false);
  const [range, setRange] = useState<HistoryDeleteRange>('all');
  const [selection, setSelection] = useState<DataTypeSelection>(DEFAULT_SELECTION);
  const [clearing, setClearing] = useState(false);

  const toggle = (key: keyof DataTypeSelection) => setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  const nothingSelected = !selection.history && !selection.siteData && !selection.cache && !selection.downloads;

  const handleClear = async () => {
    setClearing(true);
    try {
      if (selection.history) await historyService.deleteRange(range);
      if (selection.siteData || selection.cache) {
        await clearBrowsingData({ cookies: selection.siteData, cache: selection.cache });
      }
      if (selection.downloads) await downloadsService.clearAllDownloads();
      setShowSheet(false);
      setSelection(DEFAULT_SELECTION);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      <SettingsSubpageHeader title="Privacy" />

      <SettingsSection title="Browsing data" icon={Trash2}>
        <SettingsRow
          label="Clear browsing data"
          description="Bookmarks are never affected by this -- remove a bookmark from the Bookmarks page instead"
          control={<SettingsActionButton label="Clear data" onClick={() => setShowSheet(true)} />}
        />
      </SettingsSection>

      {showSheet && (
        <div className={styles.backdrop} onClick={() => !clearing && setShowSheet(false)}>
          <div className={`${styles.sheet} px-glass`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.title}>Clear browsing data</h2>

            <div className={styles.rangeRow}>
              {TIME_RANGES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.rangeChip} ${range === option.value ? styles.rangeChipActive : ''}`}
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={styles.typeRow}>
              <span className={styles.typeLabel}>Browsing history</span>
              <Switch checked={selection.history} onChange={() => toggle('history')} label="Browsing history" />
            </div>
            <div className={styles.typeRow}>
              <span className={styles.typeLabel}>Cookies and site data</span>
              <Switch checked={selection.siteData} onChange={() => toggle('siteData')} label="Cookies and site data" />
            </div>
            <div className={styles.typeRow}>
              <span className={styles.typeLabel}>Cached images and files</span>
              <Switch checked={selection.cache} onChange={() => toggle('cache')} label="Cached images and files" />
            </div>
            <div className={styles.typeRow}>
              <span className={styles.typeLabel}>Download history</span>
              <Switch checked={selection.downloads} onChange={() => toggle('downloads')} label="Download history" />
            </div>

            <button type="button" className={styles.clearButton} disabled={nothingSelected || clearing} onClick={() => void handleClear()}>
              {clearing ? 'Clearing…' : 'Clear data'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={() => setShowSheet(false)} disabled={clearing}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
