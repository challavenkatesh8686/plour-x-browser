import { useEffect } from 'react';
import type { RefObject } from 'react';
import { isEngineAvailable, setViewportBounds } from '../services/browserEngine/browserEngineService';

/** Reports the content host's on-screen rect to the active tab's native WebView so it fills exactly that space (below the toolbar, above the bottom nav), tracking rotation and keyboard show/hide. */
export function useViewportBounds(hostRef: RefObject<HTMLElement | null>, activeTabId: string | null) {
  useEffect(() => {
    if (!isEngineAvailable() || !activeTabId || !hostRef.current) return;
    const element = hostRef.current;

    let frame = 0;
    const report = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        void setViewportBounds(activeTabId, {
          top: rect.top,
          left: rect.left,
          right: window.innerWidth - rect.right,
          bottom: window.innerHeight - rect.bottom,
        }).catch(() => undefined);
      });
    };

    report();
    const resizeObserver = new ResizeObserver(report);
    resizeObserver.observe(element);
    window.addEventListener('resize', report);
    window.addEventListener('orientationchange', report);
    window.visualViewport?.addEventListener('resize', report);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', report);
      window.removeEventListener('orientationchange', report);
      window.visualViewport?.removeEventListener('resize', report);
    };
  }, [hostRef, activeTabId]);
}
