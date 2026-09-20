export interface TabError {
  code: number;
  description: string;
  failingUrl: string;
}

export interface Tab {
  id: string;
  /** Empty string means "showing the New Tab / home page", not yet navigated anywhere. */
  url: string;
  title: string;
  faviconUrl: string | null;
  createdAt: number;
  isLoading: boolean;
  progress: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isSuspended: boolean;
  isCrashed: boolean;
  isDesktopMode: boolean;
  thumbnailBase64: string | null;
  error: TabError | null;
}

export interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  isTabManagerOpen: boolean;
  /** Bounded LIFO stack of closed tabs' restorable data, most-recent last. Cross-platform (not desktop-only) -- Ctrl+Shift+T is the first UI to use it, but the capability isn't Electron-specific. */
  recentlyClosed: ClosedTab[];
}

export interface ClosedTab {
  url: string;
  title: string;
  faviconUrl: string | null;
}

export type TabsAction =
  | { type: 'RESTORE_TABS'; tabs: Tab[]; activeTabId: string | null }
  | { type: 'CREATE_TAB'; tab: Tab; makeActive: boolean }
  | { type: 'CLOSE_TAB'; tabId: string }
  | { type: 'SWITCH_TAB'; tabId: string }
  | { type: 'SET_TAB_URL'; tabId: string; url: string }
  | { type: 'SET_TAB_LOADING'; tabId: string; isLoading: boolean; progress?: number }
  | { type: 'SET_TAB_META'; tabId: string; title?: string; faviconUrl?: string }
  | { type: 'SET_TAB_NAV_STATE'; tabId: string; canGoBack: boolean; canGoForward: boolean; url?: string; title?: string }
  | { type: 'MARK_TAB_SUSPENDED'; tabId: string; thumbnailBase64: string | null }
  | { type: 'MARK_TAB_RESUMED'; tabId: string }
  | { type: 'MARK_TAB_CRASHED'; tabId: string }
  | { type: 'SET_TAB_SNAPSHOT'; tabId: string; thumbnailBase64: string | null }
  | { type: 'SET_TAB_ERROR'; tabId: string; error: TabError | null }
  | { type: 'SET_TAB_DESKTOP_MODE'; tabId: string; isDesktopMode: boolean }
  | { type: 'OPEN_TAB_MANAGER' }
  | { type: 'CLOSE_TAB_MANAGER' }
  | { type: 'REOPEN_CLOSED_TAB'; tab: Tab };
