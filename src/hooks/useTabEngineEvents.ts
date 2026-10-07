import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as engine from '../services/browserEngine/browserEngineService';
import { showToast } from '../services/toast/toastService';
import { useTabs } from '../services/tabs/TabsContext';
import { createBlankTab } from '../services/tabs/tabsReducer';
import { isDesktopSite } from '../services/sitePreferences/desktopSiteService';
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
  const { tabs, dispatch } = useTabs();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  // Read inside the pageFinished handler without making it a dependency of
  // the main effect below -- that effect only needs to (re)subscribe when
  // openLinksInNewTab/navigate actually change, not on every tab state update.
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

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
        // Auto-apply a remembered per-domain "Desktop site" preference, even
        // in a tab that's never had it toggled manually before -- see
        // TabsContext.toggleDesktopMode, which is what saves it.
        const tab = tabsRef.current.find((t) => t.id === data.tabId);
        const wantsDesktop = isDesktopSite(data.url);
        if (tab && wantsDesktop !== tab.isDesktopMode) {
          dispatch({ type: 'SET_TAB_DESKTOP_MODE', tabId: data.tabId, isDesktopMode: wantsDesktop });
          void engine.setDesktopMode(data.tabId, wantsDesktop).catch((err) => console.error('[browserEngine] setDesktopMode', err));
        }
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
      engine.onEngineEvent('downloadRequested', () => {
        // The native side (PlourxBrowserEnginePlugin#startDownload) already
        // enqueues the real download off this same event -- this toast is
        // just user feedback that something is happening, not a trigger.
        showToast('Download started', {
          label: 'View',
          onPress: () => navigate('/downloads'),
        });
      }),
      // No listener for 'permissionRequested' -- camera/mic/location requests
      // are now handled for real by the native Android system permission
      // dialog (see PlourxBrowserChromeClient), so there's nothing left for
      // the chrome UI to do here; the event still fires for any future use
      // (e.g. a per-site permission log).
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
  }, [dispatch, preferences.openLinksInNewTab, navigate]);
}
