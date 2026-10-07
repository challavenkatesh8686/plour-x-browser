import { useCallback, useEffect, useState } from 'react';
import { setFullscreen as applyFullscreen } from '../services/browserEngine/browserEngineService';

/**
 * Module-level + event-bus state (same idiom as useTheme/useAccentColor),
 * not persisted -- fullscreen is a per-session UI mode, not a saved
 * preference. Shared across every component that calls this hook (AppShell
 * hides its chrome, HomePage hides the Toolbar, useHardwareBackButton exits
 * it on the Android back button) without prop drilling.
 */
const FULLSCREEN_EVENT = 'plourx-browser:fullscreen-changed';
let sharedIsFullscreen = false;

function setShared(next: boolean) {
  if (sharedIsFullscreen === next) return;
  sharedIsFullscreen = next;
  window.dispatchEvent(new Event(FULLSCREEN_EVENT));
  void applyFullscreen(next);
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(sharedIsFullscreen);

  useEffect(() => {
    const sync = () => setIsFullscreen(sharedIsFullscreen);
    window.addEventListener(FULLSCREEN_EVENT, sync);
    return () => window.removeEventListener(FULLSCREEN_EVENT, sync);
  }, []);

  const enterFullscreen = useCallback(() => setShared(true), []);
  const exitFullscreen = useCallback(() => setShared(false), []);
  const toggleFullscreen = useCallback(() => setShared(!sharedIsFullscreen), []);

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
