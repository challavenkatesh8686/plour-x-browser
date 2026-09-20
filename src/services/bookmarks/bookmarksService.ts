import type { Bookmark } from './types';

const STORAGE_KEY = 'plourx-browser-bookmarks';
const CHANGE_EVENT = 'plourx-browser:bookmarks-changed';

function readAll(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Bookmark[]) : [];
  } catch {
    return [];
  }
}

function writeAll(bookmarks: Bookmark[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function listBookmarks(): Bookmark[] {
  return [...readAll()].sort((a, b) => b.createdAt - a.createdAt);
}

export function isBookmarked(url: string): boolean {
  return readAll().some((b) => b.url === url);
}

export function findBookmarkByUrl(url: string): Bookmark | undefined {
  return readAll().find((b) => b.url === url);
}

export function addBookmark(input: { url: string; title: string; faviconUrl: string | null }): Bookmark {
  const existing = findBookmarkByUrl(input.url);
  if (existing) return existing;
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    url: input.url,
    title: input.title || input.url,
    faviconUrl: input.faviconUrl,
    createdAt: Date.now(),
  };
  writeAll([...readAll(), bookmark]);
  return bookmark;
}

export function removeBookmark(id: string) {
  writeAll(readAll().filter((b) => b.id !== id));
}

export function removeBookmarkByUrl(url: string) {
  writeAll(readAll().filter((b) => b.url !== url));
}

export function updateBookmark(id: string, updates: Partial<Pick<Bookmark, 'title' | 'url'>>) {
  writeAll(readAll().map((b) => (b.id === id ? { ...b, ...updates } : b)));
}

export function searchBookmarks(query: string): Bookmark[] {
  const q = query.trim().toLowerCase();
  if (!q) return listBookmarks();
  return listBookmarks().filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
}

export function onBookmarksChanged(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
