import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as engine from '../browserEngine/browserEngineService';
import { record as recordHistory } from '../history/historyService';
import { resolveAddressBarInput } from '../../utils/url';
import { loadPersistedTabs, persistTabs } from './tabsPersistenceService';
import { createBlankTab, initialTabsState, tabsReducer } from './tabsReducer';
import type { Tab, TabsAction } from './types';

interface TabsContextValue {
  tabs: Tab[];
  activeTab: Tab | null;
  activeTabId: string | null;
  canReopenClosedTab: boolean;
  reopenClosedTab: () => void;
  isTabManagerOpen: boolean;
  isSuggestionsOpen: boolean;
  openSuggestions: () => void;
  closeSuggestions: () => void;
  isEngineAvailable: boolean;
  openNewTab: () => void;
  navigate: (tabId: string, input: string) => void;
  navigateActiveTab: (input: string) => void;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  toggleDesktopMode: () => void;
  shareActiveTab: () => void;
  openTabManager: () => void;
  closeTabManager: () => void;
  requestSnapshot: (tabId: string) => void;
  dispatch: React.Dispatch<TabsAction>;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

/** Engine calls are best-effort: on web preview (no native engine) they no-op instead of throwing into the UI. */
async function safeEngineCall<T>(fn: () => Promise<T>): Promise<T | undefined> {
  if (!engine.isEngineAvailable()) return undefined;
  try {
    return await fn();
  } catch (err) {
    console.error('[browserEngine]', err);
    return undefined;
  }
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tabsReducer, initialTabsState);
  const [isSuggestionsOpen, setSuggestionsOpen] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const { tabs, activeTabId } = loadPersistedTabs();
    if (tabs.length === 0) {
      const blank = createBlankTab();
      dispatch({ type: 'RESTORE_TABS', tabs: [blank], activeTabId: blank.id });
      return;
    }
    dispatch({ type: 'RESTORE_TABS', tabs, activeTabId });
    // Prime the native engine for whichever tab comes back active. This is
    // what makes the browser recover correctly when Android has killed the
    // whole app process while backgrounded (routine under memory pressure):
    // JS restores this tab from localStorage, but a fresh plugin instance's
    // native tab map is empty, so it needs telling again -- otherwise the
    // toolbar shows the right title/URL while the page area stays blank.
    const activeRestoredTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
    if (activeRestoredTab?.url) {
      // Deliberately deferred rather than fired immediately: creating a
      // second heavy native WebView and starting a real cross-origin
      // navigation in the very first frames of cold start -- before the
      // Activity's own layout/WebView has settled -- is asking for trouble
      // on exactly the kind of resource-constrained device this matters
      // most on. Giving the host app a moment to finish its own startup
      // first is standard practice for anything that spins up a second
      // heavyweight native surface.
      const timer = setTimeout(() => {
        void safeEngineCall(() => engine.switchToTab(activeRestoredTab.id, activeRestoredTab.url));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    persistTabs(state.tabs, state.activeTabId);
  }, [state.tabs, state.activeTabId]);

  const activeTab = useMemo(() => state.tabs.find((t) => t.id === state.activeTabId) ?? null, [state.tabs, state.activeTabId]);

  const openNewTab = useCallback(() => {
    const tab = createBlankTab();
    dispatch({ type: 'CREATE_TAB', tab, makeActive: true });
    void safeEngineCall(() => engine.createTab(tab.id));
  }, []);

  const canReopenClosedTab = state.recentlyClosed.length > 0;

  const reopenClosedTab = useCallback(() => {
    const closed = state.recentlyClosed[state.recentlyClosed.length - 1];
    if (!closed) return;
    const tab: Tab = { ...createBlankTab(), url: closed.url, title: closed.title, faviconUrl: closed.faviconUrl };
    dispatch({ type: 'REOPEN_CLOSED_TAB', tab });
    void safeEngineCall(async () => {
      await engine.createTab(tab.id);
      await engine.loadUrl(tab.id, closed.url);
      await engine.setVisible(tab.id, true);
    });
  }, [state.recentlyClosed]);

  const navigate = useCallback((tabId: string, input: string) => {
    const url = resolveAddressBarInput(input);
    dispatch({ type: 'SET_TAB_URL', tabId, url });
    dispatch({ type: 'SET_TAB_LOADING', tabId, isLoading: true, progress: 0 });
    void safeEngineCall(async () => {
      await engine.createTab(tabId).catch(() => undefined); // idempotent-ish: no-op if already created natively
      await engine.loadUrl(tabId, url);
      await engine.setVisible(tabId, true);
    });
  }, []);

  const navigateActiveTab = useCallback(
    (input: string) => {
      if (!state.activeTabId) return;
      navigate(state.activeTabId, input);
    },
    [state.activeTabId, navigate],
  );

  const switchTab = useCallback(
    (tabId: string) => {
      dispatch({ type: 'SWITCH_TAB', tabId });
      // Pass the tab's known URL as a recovery hint (see the restore effect
      // above) in case the app process was killed and restarted since this
      // tab was last created natively.
      const target = state.tabs.find((t) => t.id === tabId);
      void safeEngineCall(() => engine.switchToTab(tabId, target?.url || undefined));
    },
    [state.tabs],
  );

  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: 'CLOSE_TAB', tabId });
    void safeEngineCall(() => engine.closeTab(tabId));
  }, []);

  const goBack = useCallback(() => {
    if (!activeTab) return;
    void safeEngineCall(() => engine.goBack(activeTab.id));
  }, [activeTab]);

  const goForward = useCallback(() => {
    if (!activeTab) return;
    void safeEngineCall(() => engine.goForward(activeTab.id));
  }, [activeTab]);

  const reload = useCallback(() => {
    if (!activeTab) return;
    void safeEngineCall(() => engine.reload(activeTab.id));
  }, [activeTab]);

  const stop = useCallback(() => {
    if (!activeTab) return;
    void safeEngineCall(() => engine.stop(activeTab.id));
  }, [activeTab]);

  const toggleDesktopMode = useCallback(() => {
    if (!activeTab) return;
    const next = !activeTab.isDesktopMode;
    dispatch({ type: 'SET_TAB_DESKTOP_MODE', tabId: activeTab.id, isDesktopMode: next });
    void safeEngineCall(() => engine.setDesktopMode(activeTab.id, next));
  }, [activeTab]);

  const shareActiveTab = useCallback(() => {
    if (!activeTab?.url) return;
    void safeEngineCall(() => engine.shareUrl(activeTab.url, activeTab.title));
  }, [activeTab]);

  const openTabManager = useCallback(() => dispatch({ type: 'OPEN_TAB_MANAGER' }), []);
  const closeTabManager = useCallback(() => dispatch({ type: 'CLOSE_TAB_MANAGER' }), []);
  const openSuggestions = useCallback(() => setSuggestionsOpen(true), []);
  const closeSuggestions = useCallback(() => setSuggestionsOpen(false), []);

  const requestSnapshot = useCallback((tabId: string) => {
    void safeEngineCall(async () => {
      const thumbnailBase64 = await engine.getTabSnapshot(tabId);
      dispatch({ type: 'SET_TAB_SNAPSHOT', tabId, thumbnailBase64: thumbnailBase64 ?? null });
    });
  }, []);

  // Record history once a page finishes loading (isLoading flips false with a real URL).
  const recordedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const tab of state.tabs) {
      const key = `${tab.id}:${tab.url}:${tab.isLoading}`;
      if (tab.url && !tab.isLoading && !recordedRef.current.has(key)) {
        recordedRef.current.add(key);
        void recordHistory({ url: tab.url, title: tab.title, faviconUrl: tab.faviconUrl });
      }
    }
  }, [state.tabs]);

  const value = useMemo<TabsContextValue>(
    () => ({
      tabs: state.tabs,
      activeTab,
      activeTabId: state.activeTabId,
      canReopenClosedTab,
      reopenClosedTab,
      isTabManagerOpen: state.isTabManagerOpen,
      isSuggestionsOpen,
      openSuggestions,
      closeSuggestions,
      isEngineAvailable: engine.isEngineAvailable(),
      openNewTab,
      navigate,
      navigateActiveTab,
      switchTab,
      closeTab,
      goBack,
      goForward,
      reload,
      stop,
      toggleDesktopMode,
      shareActiveTab,
      openTabManager,
      closeTabManager,
      requestSnapshot,
      dispatch,
    }),
    [
      state.tabs,
      state.activeTabId,
      canReopenClosedTab,
      reopenClosedTab,
      state.isTabManagerOpen,
      isSuggestionsOpen,
      openSuggestions,
      closeSuggestions,
      activeTab,
      openNewTab,
      navigate,
      navigateActiveTab,
      switchTab,
      closeTab,
      goBack,
      goForward,
      reload,
      stop,
      toggleDesktopMode,
      shareActiveTab,
      openTabManager,
      closeTabManager,
      requestSnapshot,
    ],
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook are colocated by design
export function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('useTabs must be used within TabsProvider');
  return ctx;
}
