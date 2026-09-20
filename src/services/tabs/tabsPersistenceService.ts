import type { Tab } from './types';

const STORAGE_KEY = 'plourx-browser-tabs';

interface PersistedTab {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  createdAt: number;
}

interface PersistedState {
  tabs: PersistedTab[];
  activeTabId: string | null;
}

export function loadPersistedTabs(): { tabs: Tab[]; activeTabId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tabs: [], activeTabId: null };
    const parsed = JSON.parse(raw) as PersistedState;
    const tabs: Tab[] = parsed.tabs.map((t) => ({
      ...t,
      isLoading: false,
      progress: 0,
      canGoBack: false,
      canGoForward: false,
      // Every restored tab starts suspended -- its native engine is only
      // (re)created lazily when it becomes active, so relaunching the app
      // doesn't eagerly spin up one WebView per remembered tab.
      isSuspended: true,
      isCrashed: false,
      isDesktopMode: false,
      thumbnailBase64: null,
      error: null,
    }));
    const activeTabId = parsed.activeTabId && tabs.some((t) => t.id === parsed.activeTabId) ? parsed.activeTabId : (tabs[0]?.id ?? null);
    return { tabs, activeTabId };
  } catch {
    return { tabs: [], activeTabId: null };
  }
}

export function persistTabs(tabs: Tab[], activeTabId: string | null) {
  try {
    const state: PersistedState = {
      tabs: tabs.map(({ id, url, title, faviconUrl, createdAt }) => ({ id, url, title, faviconUrl, createdAt })),
      activeTabId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best effort only -- tab restoration is a convenience, not critical data
  }
}
