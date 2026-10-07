import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTabs } from '../../services/tabs/TabsContext';
import { useHardwareBackButton } from '../../hooks/useHardwareBackButton';
import { useTabEngineEvents } from '../../hooks/useTabEngineEvents';
import { useSyncEngineVisibility } from '../../hooks/useSyncEngineVisibility';
import { useDesktopKeyboardShortcuts } from '../../hooks/useDesktopKeyboardShortcuts';
import { useAccentColor } from '../../hooks/useAccentColor';
import { useFontStyle } from '../../hooks/useFontStyle';
import { useFindBar } from '../../hooks/useFindBar';
import { useFullscreen } from '../../hooks/useFullscreen';
import { isElectronDesktop } from '../../utils/platform';
import { TabManagerOverlay } from '../browser/TabManagerOverlay';
import { DesktopTabStrip } from '../browser/DesktopTabStrip/DesktopTabStrip';
import { FindBar } from '../browser/FindBar';
import { IconButton } from './IconButton';
import { BottomNav } from './BottomNav';
import { Toast } from './Toast';
import styles from './AppShell.module.css';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function AppShell({ children }: { children: ReactNode }) {
  const { isTabManagerOpen } = useTabs();
  const { pathname } = useLocation();
  const { isOpen: isFindBarOpen, close: closeFindBar } = useFindBar();
  useTabEngineEvents();
  useHardwareBackButton();
  useSyncEngineVisibility();
  useDesktopKeyboardShortcuts();
  // Mounted once here (not just on the Appearance settings page) so a saved
  // accent/font preference applies immediately on launch, the same way
  // useTheme already does via its own early mount points (ThemeToggle).
  useAccentColor();
  useFontStyle();
  const { isFullscreen, exitFullscreen } = useFullscreen();

  // Escape only reaches here while the chrome window itself (not a loaded
  // page's native WebView/WebContentsView) has input focus -- an honest
  // scoping limit, not a silently broken feature; see electron/main.cjs for
  // why Escape isn't globally intercepted the way other accelerators are.
  useEffect(() => {
    if (!isFullscreen || !isElectronDesktop()) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitFullscreen();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, exitFullscreen]);

  // Auth pages (ported from plour-x-website) are a distraction-free, full-
  // screen centered card -- no browser chrome around them, same as the
  // source app.
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        {!isAuthRoute && !isFullscreen && (
          <div className={styles.desktopTabStripSlot}>
            <DesktopTabStrip />
          </div>
        )}
        <div className={styles.content}>{children}</div>
        {!isAuthRoute && !isFullscreen && (
          <div className={styles.mobileBottomNavSlot}>
            <BottomNav />
          </div>
        )}
        {isFullscreen && (
          <div className={styles.exitFullscreenSlot}>
            <IconButton icon={<Minimize2 size={16} />} label="Exit fullscreen" size="sm" onClick={exitFullscreen} />
          </div>
        )}
        <Toast />
        {isTabManagerOpen && <TabManagerOverlay />}
        {isFindBarOpen && <FindBar onClose={closeFindBar} />}
      </div>
    </div>
  );
}
