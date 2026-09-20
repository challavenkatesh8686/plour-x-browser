import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTabs } from '../../services/tabs/TabsContext';
import { useHardwareBackButton } from '../../hooks/useHardwareBackButton';
import { useTabEngineEvents } from '../../hooks/useTabEngineEvents';
import { useSyncEngineVisibility } from '../../hooks/useSyncEngineVisibility';
import { useDesktopKeyboardShortcuts } from '../../hooks/useDesktopKeyboardShortcuts';
import { TabManagerOverlay } from '../browser/TabManagerOverlay';
import { DesktopTabStrip } from '../browser/DesktopTabStrip/DesktopTabStrip';
import { FindBar } from '../browser/FindBar';
import { BottomNav } from './BottomNav';
import { Toast } from './Toast';
import styles from './AppShell.module.css';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function AppShell({ children }: { children: ReactNode }) {
  const { isTabManagerOpen } = useTabs();
  const { pathname } = useLocation();
  const [isFindBarOpen, setFindBarOpen] = useState(false);
  useTabEngineEvents();
  useHardwareBackButton();
  useSyncEngineVisibility();
  useDesktopKeyboardShortcuts(() => setFindBarOpen((open) => !open));

  // Auth pages (ported from plour-x-website) are a distraction-free, full-
  // screen centered card -- no browser chrome around them, same as the
  // source app.
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        {!isAuthRoute && (
          <div className={styles.desktopTabStripSlot}>
            <DesktopTabStrip />
          </div>
        )}
        <div className={styles.content}>{children}</div>
        {!isAuthRoute && (
          <div className={styles.mobileBottomNavSlot}>
            <BottomNav />
          </div>
        )}
        <Toast />
        {isTabManagerOpen && <TabManagerOverlay />}
        {isFindBarOpen && <FindBar onClose={() => setFindBarOpen(false)} />}
      </div>
    </div>
  );
}
