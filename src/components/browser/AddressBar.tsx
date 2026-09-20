import { useRef, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import { useTabs } from '../../services/tabs/TabsContext';
import { getDisplayHost } from '../../utils/url';
import { AddressSuggestions } from './AddressSuggestions';
import styles from './AddressBar.module.css';

export function AddressBar() {
  const { activeTab, navigateActiveTab, isSuggestionsOpen, openSuggestions, closeSuggestions } = useTabs();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const url = activeTab?.url ?? '';
  const isSecure = url.startsWith('https://');

  const startEditing = () => {
    setDraft(url);
    openSuggestions();
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commit = (value: string) => {
    const input = value.trim();
    if (input) navigateActiveTab(input);
    closeSuggestions();
    inputRef.current?.blur();
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.bar} ${isSuggestionsOpen ? styles.focused : ''}`}>
        {isSuggestionsOpen ? (
          <>
            <Search size={15} className={styles.leadingIcon} />
            <input
              ref={inputRef}
              className={styles.input}
              value={draft}
              autoFocus
              placeholder="Search or enter web address"
              onChange={(e) => setDraft(e.target.value)}
              onFocus={openSuggestions}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit(draft);
                if (e.key === 'Escape') {
                  closeSuggestions();
                  inputRef.current?.blur();
                }
              }}
              onBlur={() => {
                // Let a suggestion's onClick fire before we tear the list down.
                setTimeout(closeSuggestions, 120);
              }}
            />
          </>
        ) : (
          <button type="button" className={styles.collapsed} onClick={startEditing}>
            {url ? (
              <>
                {isSecure && <Lock size={12} className={styles.lockIcon} />}
                <span className={styles.collapsedText}>{activeTab?.title || getDisplayHost(url)}</span>
              </>
            ) : (
              <>
                <Search size={15} className={styles.leadingIcon} />
                <span className={styles.placeholder}>Search or enter web address</span>
              </>
            )}
          </button>
        )}
      </div>
      {isSuggestionsOpen && <AddressSuggestions query={draft} onSelect={commit} />}
    </div>
  );
}
