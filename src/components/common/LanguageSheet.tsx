import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { TRANSLATE_LANGUAGES } from '../../data/translateLanguages';
import styles from './LanguageSheet.module.css';

interface LanguageSheetProps {
  open: boolean;
  currentLanguage: string | null;
  pending: boolean;
  error: string | null;
  onSelect: (code: string | null) => void;
  onClose: () => void;
}

export function LanguageSheet({ open, currentLanguage, pending, error, onSelect, onClose }: LanguageSheetProps) {
  const [query, setQuery] = useState('');

  if (!open) return null;

  const filtered = TRANSLATE_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div className={styles.card} role="dialog" aria-label="Choose a language" onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>Translate this app</div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="search"
            autoFocus
            placeholder="Search language..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.list}>
          <button
            type="button"
            className={`${styles.row} ${!currentLanguage ? styles.rowActive : ''}`}
            disabled={pending}
            onClick={() => onSelect(null)}
          >
            <span className={styles.rowNames}>
              <span className={styles.rowName}>Original</span>
              <span className={styles.rowNative}>English</span>
            </span>
            {!currentLanguage && <Check size={16} className={styles.check} />}
          </button>
          {filtered.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`${styles.row} ${currentLanguage === lang.code ? styles.rowActive : ''}`}
              disabled={pending}
              onClick={() => onSelect(lang.code)}
            >
              <span className={styles.rowNames}>
                <span className={styles.rowName}>{lang.name}</span>
                <span className={styles.rowNative}>{lang.nativeName}</span>
              </span>
              {currentLanguage === lang.code && <Check size={16} className={styles.check} />}
            </button>
          ))}
          {filtered.length === 0 && <p className={styles.empty}>No matching languages.</p>}
        </div>
      </div>
    </div>
  );
}
