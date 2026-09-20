import { useEffect } from 'react';
import { onAccelerator } from '../services/browserEngine/browserEngineService';
import { useBookmarkToggle } from '../services/bookmarks/useBookmarkToggle';
import { useTabs } from '../services/tabs/TabsContext';
import { isElectronDesktop } from '../utils/platform';

/**
 * Desktop-only (no-op on Android/web): reacts to accelerator combos the
 * main process intercepted via before-input-event (see electron/main.cjs --
 * a renderer-side keydown listener alone would miss most keystrokes, since
 * OS input focus is usually inside a loaded page's WebContentsView, not the
 * chrome renderer).
 */
export function useDesktopKeyboardShortcuts(onToggleFindBar: () => void) {
  const {
    tabs,
    activeTab,
    activeTabId,
    openNewTab,
    closeTab,
    switchTab,
    reopenClosedTab,
    goBack,
    goForward,
    reload,
    openSuggestions,
  } = useTabs();
  const { toggle: toggleBookmark } = useBookmarkToggle(activeTab);

  useEffect(() => {
    if (!isElectronDesktop()) return;

    return onAccelerator((combo) => {
      switch (combo) {
        case 'CmdOrCtrl+L':
          openSuggestions();
          break;
        case 'CmdOrCtrl+T':
          openNewTab();
          break;
        case 'CmdOrCtrl+W':
          if (activeTabId) closeTab(activeTabId);
          break;
        case 'CmdOrCtrl+Shift+T':
          reopenClosedTab();
          break;
        case 'CmdOrCtrl+R':
          reload();
          break;
        case 'CmdOrCtrl+F':
          onToggleFindBar();
          break;
        case 'CmdOrCtrl+D':
          toggleBookmark();
          break;
        case 'CmdOrCtrl+Tab':
        case 'CmdOrCtrl+Shift+Tab': {
          if (tabs.length < 2) break;
          const index = tabs.findIndex((tab) => tab.id === activeTabId);
          const delta = combo === 'CmdOrCtrl+Tab' ? 1 : -1;
          const next = tabs[(index + delta + tabs.length) % tabs.length];
          switchTab(next.id);
          break;
        }
        case 'Alt+ArrowLeft':
          goBack();
          break;
        case 'Alt+ArrowRight':
          goForward();
          break;
        default:
          break;
      }
    });
  }, [
    tabs,
    activeTabId,
    openNewTab,
    closeTab,
    switchTab,
    reopenClosedTab,
    goBack,
    goForward,
    reload,
    openSuggestions,
    toggleBookmark,
    onToggleFindBar,
  ]);
}
