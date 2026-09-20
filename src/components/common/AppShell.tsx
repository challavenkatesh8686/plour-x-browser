import { useState } from 'react';
import type { ReactNode } from 'react';
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

export function AppShell({ children }: { children: ReactNode }) {
  const { isTabManagerOpen } = useTabs();
  const [isFindBarOpen, setFindBarOpen] = useState(false);
  useTabEngineEvents();
  useHardwareBackButton();
  useSyncEngineVisibility();
  useDesktopKeyboardShortcuts(() => setFindBarOpen((open) => !open));

  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        <div className={styles.desktopTabStripSlot}>
          <DesktopTabStrip />
        </div>
        <div className={styles.content}>{children}</div>
        <div className={styles.mobileBottomNavSlot}>
          <BottomNav />
        </div>
        <Toast />
        {isTabManagerOpen && <TabManagerOverlay />}
        {isFindBarOpen && <FindBar onClose={() => setFindBarOpen(false)} />}
      </div>
    </div>
  );
}
