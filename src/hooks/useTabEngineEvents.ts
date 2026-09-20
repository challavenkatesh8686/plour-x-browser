import { useEffect } from 'react';
import * as engine from '../services/browserEngine/browserEngineService';
import { showToast } from '../services/toast/toastService';
import { useTabs } from '../services/tabs/TabsContext';
import { createBlankTab } from '../services/tabs/tabsReducer';
import { usePreferences } from './usePreferences';

/**
 * Mounted once near the app root. Subscribes to every platform-agnostic
 * engine event (via browserEngineService's onEngineEvent, never the raw
 * Capacitor plugin or window.plourxDesktop directly) and routes it into
 * TabsContext's reducer by tabId -- the single place native/desktop engine
 * state (navigation, progress, title, favicon, crashes, downloads,
 * permission requests) becomes React state.
 */
export function useTabEngineEvents() {
  const { dispatch } = useTabs();
  const { preferences } = usePreferences();

  useEffect(() => {
    if (!engine.isEngineAvailable()) return;

    const unsubscribers = [
      engine.onEngineEvent('pageStarted', (data) => {
        dispatch({ type: 'SET_TAB_LOADING', tabId: data.tabId, isLoading: true, progress: 0 });
        dispatch({ type: 'SET_TAB_ERROR', tabId: data.tabId, error: null });
      }),
      engine.onEngineEvent('pageFinished', (data) => {
        dispatch({ type: 'SET_TAB_LOADING', tabId: data.tabId, isLoading: false, progress: 100 });
        dispatch({
          type: 'SET_TAB_NAV_STATE',
          tabId: data.tabId,
          canGoBack: data.canGoBack,
          canGoForward: data.canGoForward,
          url: data.url,
          title: data.title,
        });
      }),
      engine.onEngineEvent('progressChanged', (data) => {
        dispatch({ type: 'SET_TAB_LOADING', tabId: data.tabId, isLoading: data.progress < 100, progress: data.progress });
      }),
      engine.onEngineEvent('titleChanged', (data) => {
        dispatch({ type: 'SET_TAB_META', tabId: data.tabId, title: data.title });
      }),
      engine.onEngineEvent('faviconChanged', (data) => {
        dispatch({ type: 'SET_TAB_META', tabId: data.tabId, faviconUrl: `data:image/png;base64,${data.faviconBase64Png}` });
      }),
      engine.onEngineEvent('navigationStateChanged', (data) => {
        dispatch({ type: 'SET_TAB_NAV_STATE', tabId: data.tabId, canGoBack: data.canGoBack, canGoForward: data.canGoForward });
      }),
      engine.onEngineEvent('newWindowRequested', (data) => {
        const tab = createBlankTab();
        dispatch({ type: 'CREATE_TAB', tab, makeActive: preferences.openLinksInNewTab });
        dispatch({ type: 'SET_TAB_URL', tabId: tab.id, url: data.url });
        dispatch({ type: 'SET_TAB_LOADING', tabId: tab.id, isLoading: true, progress: 0 });
        void engine
          .createTab(tab.id)
          .then(() => engine.loadUrl(tab.id, data.url))
          .then(() => engine.setVisible(tab.id, preferences.openLinksInNewTab))
          .catch((err) => console.error('[browserEngine] newWindowRequested', err));
      }),
      engine.onEngineEvent('downloadRequested', (data) => {
        showToast('Downloads aren’t supported yet in PlourX Browser.', {
          label: 'Open in system browser',
          onPress: () =>
            void engine.openInSystemBrowser(data.url).catch((err) => console.error('[browserEngine] openInSystemBrowser', err)),
        });
      }),
      engine.onEngineEvent('permissionRequested', (data) => {
        showToast(`This site asked for ${data.resources.join(', ')} access. Site permissions aren’t supported yet.`);
      }),
      engine.onEngineEvent('errorReceived', (data) => {
        dispatch({
          type: 'SET_TAB_ERROR',
          tabId: data.tabId,
          error: { code: data.errorCode, description: data.description, failingUrl: data.failingUrl },
        });
      }),
      engine.onEngineEvent('tabCrashed', (data) => {
        dispatch({ type: 'MARK_TAB_CRASHED', tabId: data.tabId });
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [dispatch, preferences.openLinksInNewTab]);
}
