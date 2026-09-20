import type { ClosedTab, Tab, TabsAction, TabsState } from './types';

const MAX_RECENTLY_CLOSED = 10;

export const initialTabsState: TabsState = {
  tabs: [],
  activeTabId: null,
  isTabManagerOpen: false,
  recentlyClosed: [],
};

function updateTab(tabs: Tab[], tabId: string, patch: Partial<Tab>): Tab[] {
  return tabs.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab));
}

/** Picks the next tab to activate when the given tab closes: prefer the one to its right, else its left. */
function nextActiveAfterClose(tabs: Tab[], closedTabId: string): string | null {
  const index = tabs.findIndex((tab) => tab.id === closedTabId);
  const remaining = tabs.filter((tab) => tab.id !== closedTabId);
  if (remaining.length === 0) return null;
  return remaining[Math.min(index, remaining.length - 1)].id;
}

export function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  switch (action.type) {
    case 'RESTORE_TABS':
      return { ...state, tabs: action.tabs, activeTabId: action.activeTabId };

    case 'CREATE_TAB':
      return {
        ...state,
        tabs: [...state.tabs, action.tab],
        activeTabId: action.makeActive ? action.tab.id : state.activeTabId,
        isTabManagerOpen: false,
      };

    case 'CLOSE_TAB': {
      const closedTab = state.tabs.find((tab) => tab.id === action.tabId);
      const tabs = state.tabs.filter((tab) => tab.id !== action.tabId);
      const activeTabId = state.activeTabId === action.tabId ? nextActiveAfterClose(state.tabs, action.tabId) : state.activeTabId;
      // Only real, navigated pages are worth reopening -- a closed blank New Tab has nothing to restore.
      const closedTabEntry: ClosedTab | null =
        closedTab?.url && !closedTab.isCrashed
          ? { url: closedTab.url, title: closedTab.title, faviconUrl: closedTab.faviconUrl }
          : null;
      const recentlyClosed = closedTabEntry ? [...state.recentlyClosed, closedTabEntry].slice(-MAX_RECENTLY_CLOSED) : state.recentlyClosed;
      return { ...state, tabs, activeTabId, recentlyClosed };
    }

    case 'REOPEN_CLOSED_TAB':
      return {
        ...state,
        tabs: [...state.tabs, action.tab],
        activeTabId: action.tab.id,
        recentlyClosed: state.recentlyClosed.slice(0, -1),
        isTabManagerOpen: false,
      };

    case 'SWITCH_TAB':
      return { ...state, activeTabId: action.tabId, isTabManagerOpen: false };

    case 'SET_TAB_URL':
      return { ...state, tabs: updateTab(state.tabs, action.tabId, { url: action.url, error: null }) };

    case 'SET_TAB_LOADING':
      return {
        ...state,
        tabs: updateTab(state.tabs, action.tabId, {
          isLoading: action.isLoading,
          progress: action.progress ?? (action.isLoading ? 0 : 100),
        }),
      };

    case 'SET_TAB_META':
      return {
        ...state,
        tabs: updateTab(state.tabs, action.tabId, {
          ...(action.title !== undefined ? { title: action.title } : {}),
          ...(action.faviconUrl !== undefined ? { faviconUrl: action.faviconUrl } : {}),
        }),
      };

    case 'SET_TAB_NAV_STATE':
      return {
        ...state,
        tabs: updateTab(state.tabs, action.tabId, {
          canGoBack: action.canGoBack,
          canGoForward: action.canGoForward,
          ...(action.url !== undefined ? { url: action.url } : {}),
          ...(action.title !== undefined ? { title: action.title } : {}),
        }),
      };

    case 'MARK_TAB_SUSPENDED':
      return {
        ...state,
        tabs: updateTab(state.tabs, action.tabId, { isSuspended: true, thumbnailBase64: action.thumbnailBase64 }),
      };

    case 'MARK_TAB_RESUMED':
      return { ...state, tabs: updateTab(state.tabs, action.tabId, { isSuspended: false, isCrashed: false }) };

    case 'MARK_TAB_CRASHED':
      return { ...state, tabs: updateTab(state.tabs, action.tabId, { isCrashed: true, isLoading: false }) };

    case 'SET_TAB_SNAPSHOT':
      return { ...state, tabs: updateTab(state.tabs, action.tabId, { thumbnailBase64: action.thumbnailBase64 }) };

    case 'SET_TAB_ERROR':
      return { ...state, tabs: updateTab(state.tabs, action.tabId, { error: action.error, isLoading: false }) };

    case 'SET_TAB_DESKTOP_MODE':
      return { ...state, tabs: updateTab(state.tabs, action.tabId, { isDesktopMode: action.isDesktopMode }) };

    case 'OPEN_TAB_MANAGER':
      return { ...state, isTabManagerOpen: true };

    case 'CLOSE_TAB_MANAGER':
      return { ...state, isTabManagerOpen: false };

    default:
      return state;
  }
}

export function createBlankTab(): Tab {
  return {
    id: crypto.randomUUID(),
    url: '',
    title: 'New Tab',
    faviconUrl: null,
    createdAt: Date.now(),
    isLoading: false,
    progress: 0,
    canGoBack: false,
    canGoForward: false,
    isSuspended: false,
    isCrashed: false,
    isDesktopMode: false,
    thumbnailBase64: null,
    error: null,
  };
}
