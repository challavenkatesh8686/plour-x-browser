import { useRef } from 'react';
import { Compass } from 'lucide-react';
import { useTabs } from '../../services/tabs/TabsContext';
import { useViewportBounds } from '../../hooks/useViewportBounds';
import { isEngineAvailable } from '../../services/browserEngine/browserEngineService';
import { NewTabHome } from '../home/NewTabHome';
import { ErrorView } from './ErrorView';
import styles from './BrowserContentHost.module.css';

/**
 * This div's bounding rect is what the native WebView positions itself
 * against (see useViewportBounds). When a real page is showing, this host
 * renders nothing of its own -- the native engine layer shows through
 * beneath/above it in the Android view hierarchy.
 */
export function BrowserContentHost() {
  const { activeTab, reload, openNewTab } = useTabs();
  const hostRef = useRef<HTMLDivElement>(null);
  useViewportBounds(hostRef, activeTab?.id ?? null);

  const showHome = activeTab && activeTab.url === '' && !activeTab.error;
  const showError = activeTab?.error;
  const showUnavailablePlaceholder = activeTab && activeTab.url !== '' && !activeTab.error && !isEngineAvailable();

  return (
    <div ref={hostRef} className={styles.host}>
      {showHome && <NewTabHome />}
      {showError && <ErrorView error={activeTab.error!} onRetry={reload} onGoHome={openNewTab} />}
      {showUnavailablePlaceholder && (
        <div className={styles.placeholder}>
          <Compass size={40} className={styles.placeholderIcon} />
          <h2 className={styles.placeholderTitle}>Open PlourX Browser on Android to browse</h2>
          <p className={styles.placeholderText}>
            Real page rendering uses a native Android WebView engine, so it only runs in the Android app -- this desktop
            preview shows the chrome UI only.
          </p>
        </div>
      )}
    </div>
  );
}
