import { getDisplayHost } from '../../utils/url';

const STORAGE_KEY = 'plourx-browser-desktop-sites';

function readAll(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Remembers whether a site should load in desktop mode, keyed by hostname (not full URL -- the preference is site-wide, not page-specific). */
export function isDesktopSite(url: string): boolean {
  const host = getDisplayHost(url);
  return host ? Boolean(readAll()[host]) : false;
}

export function setDesktopSite(url: string, enabled: boolean) {
  const host = getDisplayHost(url);
  if (!host) return;
  const all = readAll();
  if (enabled) {
    all[host] = true;
  } else {
    delete all[host];
  }
  writeAll(all);
}
