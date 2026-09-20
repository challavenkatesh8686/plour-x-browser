import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNativeAndroid } from '../utils/platform';
import { useTabs } from '../services/tabs/TabsContext';

/**
 * Real hardware back-button semantics for a browser (dialer/camera don't
 * need this -- their default Capacitor back-press behavior is adequate for
 * their shallow nesting): close an open overlay, else go back in the active
 * tab's page history, else go back among chrome routes, else minimize.
 */
export function useHardwareBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { activeTab, isTabManagerOpen, closeTabManager, isSuggestionsOpen, closeSuggestions, goBack } = useTabs();

  useEffect(() => {
    if (!isNativeAndroid()) return;
    const sub = App.addListener('backButton', () => {
      if (isSuggestionsOpen) {
        closeSuggestions();
        return;
      }
      if (isTabManagerOpen) {
        closeTabManager();
        return;
      }
      if (activeTab?.canGoBack) {
        goBack();
        return;
      }
      if (pathname !== '/') {
        navigate('/');
        return;
      }
      void App.exitApp();
    });
    return () => {
      void sub.then((handle) => handle.remove());
    };
  }, [isSuggestionsOpen, closeSuggestions, isTabManagerOpen, closeTabManager, activeTab, goBack, pathname, navigate]);
}
