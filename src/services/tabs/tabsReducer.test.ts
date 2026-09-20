import { describe, expect, it } from 'vitest';
import { createBlankTab, initialTabsState, tabsReducer } from './tabsReducer';
import type { Tab, TabsState } from './types';

function withUrl(tab: Tab, url: string, title = 'Example'): Tab {
  return { ...tab, url, title };
}

describe('tabsReducer', () => {
  it('creates a tab and makes it active when requested', () => {
    const tab = createBlankTab();
    const state = tabsReducer(initialTabsState, { type: 'CREATE_TAB', tab, makeActive: true });
    expect(state.tabs).toHaveLength(1);
    expect(state.activeTabId).toBe(tab.id);
  });

  it('creates a background tab without changing the active tab', () => {
    const active = createBlankTab();
    const background = createBlankTab();
    let state: TabsState = tabsReducer(initialTabsState, { type: 'CREATE_TAB', tab: active, makeActive: true });
    state = tabsReducer(state, { type: 'CREATE_TAB', tab: background, makeActive: false });
    expect(state.tabs).toHaveLength(2);
    expect(state.activeTabId).toBe(active.id);
  });

  it('activates the neighboring tab when the active tab is closed', () => {
    const first = createBlankTab();
    const second = createBlankTab();
    const third = createBlankTab();
    let state: TabsState = { ...initialTabsState, tabs: [first, second, third], activeTabId: second.id };
    state = tabsReducer(state, { type: 'CLOSE_TAB', tabId: second.id });
    expect(state.tabs.map((t) => t.id)).toEqual([first.id, third.id]);
    // second was at index 1; after removal the tab now at index 1 (third) becomes active.
    expect(state.activeTabId).toBe(third.id);
  });

  it('leaves activeTabId untouched when closing a non-active tab', () => {
    const first = createBlankTab();
    const second = createBlankTab();
    const state = tabsReducer(
      { ...initialTabsState, tabs: [first, second], activeTabId: second.id },
      { type: 'CLOSE_TAB', tabId: first.id },
    );
    expect(state.activeTabId).toBe(second.id);
  });

  it('records a real, navigated tab into recentlyClosed but not a blank New Tab', () => {
    const blank = createBlankTab();
    const real = withUrl(createBlankTab(), 'https://example.com');
    let state: TabsState = { ...initialTabsState, tabs: [blank, real], activeTabId: real.id };

    state = tabsReducer(state, { type: 'CLOSE_TAB', tabId: real.id });
    expect(state.recentlyClosed).toHaveLength(1);
    expect(state.recentlyClosed[0].url).toBe('https://example.com');

    state = tabsReducer(state, { type: 'CLOSE_TAB', tabId: blank.id });
    expect(state.recentlyClosed).toHaveLength(1); // unchanged -- blank tabs aren't worth reopening
  });

  it('does not record a crashed tab as reopenable', () => {
    const crashed = { ...withUrl(createBlankTab(), 'https://example.com'), isCrashed: true };
    const state = tabsReducer(
      { ...initialTabsState, tabs: [crashed], activeTabId: crashed.id },
      { type: 'CLOSE_TAB', tabId: crashed.id },
    );
    expect(state.recentlyClosed).toHaveLength(0);
  });

  it('reopens the most recently closed tab and makes it active', () => {
    const closedEntry = { url: 'https://example.com', title: 'Example', faviconUrl: null };
    const revived: Tab = { ...createBlankTab(), ...closedEntry };
    const state = tabsReducer(
      { ...initialTabsState, tabs: [], activeTabId: null, recentlyClosed: [closedEntry] },
      { type: 'REOPEN_CLOSED_TAB', tab: revived },
    );
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].url).toBe('https://example.com');
    expect(state.activeTabId).toBe(revived.id);
    expect(state.recentlyClosed).toHaveLength(0);
  });

  it('caps recentlyClosed at 10 entries, dropping the oldest', () => {
    let state: TabsState = initialTabsState;
    const tabs = Array.from({ length: 12 }, (_, i) => withUrl(createBlankTab(), `https://example.com/${i}`));
    state = { ...state, tabs, activeTabId: null };
    for (const tab of tabs) {
      state = tabsReducer(state, { type: 'CLOSE_TAB', tabId: tab.id });
    }
    expect(state.recentlyClosed).toHaveLength(10);
    expect(state.recentlyClosed[0].url).toBe('https://example.com/2'); // the two oldest were dropped
    expect(state.recentlyClosed[9].url).toBe('https://example.com/11');
  });

  it('switching tabs closes the tab manager overlay', () => {
    const tab = createBlankTab();
    const state = tabsReducer(
      { ...initialTabsState, tabs: [tab], isTabManagerOpen: true },
      { type: 'SWITCH_TAB', tabId: tab.id },
    );
    expect(state.activeTabId).toBe(tab.id);
    expect(state.isTabManagerOpen).toBe(false);
  });

  it('clears a tab error when it starts a new navigation', () => {
    const tab = createBlankTab();
    let state: TabsState = {
      ...initialTabsState,
      tabs: [{ ...tab, error: { code: -2, description: 'net error', failingUrl: tab.url } }],
    };
    state = tabsReducer(state, { type: 'SET_TAB_URL', tabId: tab.id, url: 'https://example.com' });
    expect(state.tabs[0].error).toBeNull();
  });
});
