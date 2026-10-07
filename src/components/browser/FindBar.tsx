import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { findInPage, findNextInPage, onFindResult, stopFindInPage } from '../../services/browserEngine/browserEngineService';
import { useTabs } from '../../services/tabs/TabsContext';
import { IconButton } from '../common/IconButton';
import styles from './FindBar.module.css';

/** Works on both platforms: Android via WebView's native findAllAsync/findNext, desktop via Electron's webContents.findInPage -- both behind browserEngineService, operating on whichever tab is active. */
export function FindBar({ onClose }: { onClose: () => void }) {
  const { activeTabId } = useTabs();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ activeMatchOrdinal: number; matches: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => onFindResult(setResult), []);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (activeTabId) stopFindInPage(activeTabId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only needs to run once on mount/unmount, re-reads activeTabId via closure at unmount time
  }, []);

  const runFind = (value: string, forward = true) => {
    setQuery(value);
    if (!activeTabId) return;
    if (value) findInPage(activeTabId, value, forward);
    else {
      stopFindInPage(activeTabId);
      setResult(null);
    }
  };

  return (
    <div className={`${styles.bar} px-glass`}>
      <input
        ref={inputRef}
        className={styles.input}
        value={query}
        placeholder="Find in page"
        onChange={(e) => runFind(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && activeTabId) {
            if (query) findNextInPage(activeTabId, !e.shiftKey, query);
          }
          if (e.key === 'Escape') onClose();
        }}
      />
      {result && (
        <span className={styles.count}>
          {result.matches > 0 ? `${result.activeMatchOrdinal}/${result.matches}` : '0/0'}
        </span>
      )}
      <IconButton
        icon={<ChevronUp size={16} />}
        label="Previous match"
        size="sm"
        variant="plain"
        onClick={() => activeTabId && query && findNextInPage(activeTabId, false, query)}
      />
      <IconButton
        icon={<ChevronDown size={16} />}
        label="Next match"
        size="sm"
        variant="plain"
        onClick={() => activeTabId && query && findNextInPage(activeTabId, true, query)}
      />
      <IconButton icon={<X size={16} />} label="Close find bar" size="sm" variant="plain" onClick={onClose} />
    </div>
  );
}
