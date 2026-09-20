import { useTabs } from '../../services/tabs/TabsContext';
import { getSelectedSearchEngine } from '../../services/search/searchEngineService';
import styles from './ShortcutGrid.module.css';

interface Shortcut {
  name: string;
  url: string;
  faviconUrl: string;
}

function shortcuts(): Shortcut[] {
  const engine = getSelectedSearchEngine();
  return [
    { name: engine.name, url: engine.homeUrl, faviconUrl: engine.faviconUrl },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org', faviconUrl: 'https://www.google.com/s2/favicons?sz=64&domain=wikipedia.org' },
    { name: 'YouTube', url: 'https://www.youtube.com', faviconUrl: 'https://www.google.com/s2/favicons?sz=64&domain=youtube.com' },
  ];
}

export function ShortcutGrid() {
  const { navigateActiveTab } = useTabs();

  return (
    <div className={styles.grid}>
      {shortcuts().map((shortcut) => (
        <button key={shortcut.url} type="button" className={styles.tile} onClick={() => navigateActiveTab(shortcut.url)}>
          <span className={styles.iconWrap}>
            <img src={shortcut.faviconUrl} alt="" className={styles.icon} />
          </span>
          <span className={styles.label}>{shortcut.name}</span>
        </button>
      ))}
    </div>
  );
}
