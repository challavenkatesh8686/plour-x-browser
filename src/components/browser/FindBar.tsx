import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { findInPage, onFindResult, stopFindInPage } from '../../services/browserEngine/browserEngineService';
import { IconButton } from '../common/IconButton';
import styles from './FindBar.module.css';

/** Desktop-only (Ctrl+F): drives Electron's native webContents.findInPage via the browserEngineService bridge. No Android equivalent exists yet. */
export function FindBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ activeMatchOrdinal: number; matches: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => onFindResult(setResult), []);

  useEffect(() => {
    inputRef.current?.focus();
    return () => stopFindInPage();
  }, []);

  const runFind = (value: string, forward = true) => {
    setQuery(value);
    if (value) findInPage(value, forward);
    else {
      stopFindInPage();
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
          if (e.key === 'Enter') findInPage(query, !e.shiftKey);
          if (e.key === 'Escape') onClose();
        }}
      />
      {result && (
        <span className={styles.count}>
          {result.matches > 0 ? `${result.activeMatchOrdinal}/${result.matches}` : '0/0'}
        </span>
      )}
      <IconButton icon={<ChevronUp size={16} />} label="Previous match" size="sm" variant="plain" onClick={() => findInPage(query, false)} />
      <IconButton icon={<ChevronDown size={16} />} label="Next match" size="sm" variant="plain" onClick={() => findInPage(query, true)} />
      <IconButton icon={<X size={16} />} label="Close find bar" size="sm" variant="plain" onClick={onClose} />
    </div>
  );
}
