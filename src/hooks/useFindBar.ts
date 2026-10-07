import { useCallback, useEffect, useState } from 'react';

/** Shared open/close state (same module-level + event-bus idiom as useFullscreen) so AppShell (which renders <FindBar/>), BrowserMenu (mobile+desktop entry point), and the Ctrl+F accelerator can all control it without prop drilling through HomePage -> Toolbar -> BrowserMenu back up to AppShell. */
const FIND_BAR_EVENT = 'plourx-browser:findbar-changed';
let sharedIsOpen = false;

function setShared(next: boolean) {
  if (sharedIsOpen === next) return;
  sharedIsOpen = next;
  window.dispatchEvent(new Event(FIND_BAR_EVENT));
}

export function useFindBar() {
  const [isOpen, setIsOpen] = useState(sharedIsOpen);

  useEffect(() => {
    const sync = () => setIsOpen(sharedIsOpen);
    window.addEventListener(FIND_BAR_EVENT, sync);
    return () => window.removeEventListener(FIND_BAR_EVENT, sync);
  }, []);

  const open = useCallback(() => setShared(true), []);
  const close = useCallback(() => setShared(false), []);
  const toggle = useCallback(() => setShared(!sharedIsOpen), []);

  return { isOpen, open, close, toggle };
}
