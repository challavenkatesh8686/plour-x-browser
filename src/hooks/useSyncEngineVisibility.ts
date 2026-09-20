import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isEngineAvailable, setVisible } from '../services/browserEngine/browserEngineService';
import { useTabs } from '../services/tabs/TabsContext';

/**
 * The single place deciding whether the active tab's native WebView is
 * shown. Every non-home route and every overlay (tab manager, suggestions)
 * hides it automatically -- no per-page bookkeeping required elsewhere.
 */
export function useSyncEngineVisibility() {
  const { pathname } = useLocation();
  const { activeTab, isTabManagerOpen, isSuggestionsOpen } = useTabs();

  useEffect(() => {
    if (!isEngineAvailable() || !activeTab) return;
    const shouldShow = pathname === '/' && !isTabManagerOpen && !isSuggestionsOpen && activeTab.url !== '' && !activeTab.error;
    void setVisible(activeTab.id, shouldShow).catch(() => undefined);
  }, [pathname, isTabManagerOpen, isSuggestionsOpen, activeTab]);
}
