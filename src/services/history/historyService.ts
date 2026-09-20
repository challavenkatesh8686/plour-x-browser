import * as db from './historyDb';
import type { HistoryDeleteRange, HistoryEntry } from './types';

const CHANGE_EVENT = 'plourx-browser:history-changed';

export async function record(entry: { url: string; title: string; faviconUrl: string | null }): Promise<void> {
  await db.addEntry({
    id: crypto.randomUUID(),
    url: entry.url,
    title: entry.title || entry.url,
    faviconUrl: entry.faviconUrl,
    visitedAt: Date.now(),
  });
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export async function search(query: string): Promise<HistoryEntry[]> {
  const all = await db.getAllEntries();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((entry) => entry.title.toLowerCase().includes(q) || entry.url.toLowerCase().includes(q));
}

export interface HistoryDateGroup {
  label: 'Today' | 'Yesterday' | 'Older';
  entries: HistoryEntry[];
}

export async function listGroupedByDate(): Promise<HistoryDateGroup[]> {
  const all = await db.getAllEntries();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const groups: Record<'Today' | 'Yesterday' | 'Older', HistoryEntry[]> = { Today: [], Yesterday: [], Older: [] };
  for (const entry of all) {
    if (entry.visitedAt >= startOfToday) groups.Today.push(entry);
    else if (entry.visitedAt >= startOfYesterday) groups.Yesterday.push(entry);
    else groups.Older.push(entry);
  }

  return (['Today', 'Yesterday', 'Older'] as const)
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, entries: groups[label] }));
}

export async function deleteEntry(id: string): Promise<void> {
  await db.deleteEntry(id);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export async function deleteRange(range: HistoryDeleteRange): Promise<void> {
  if (range === 'all') {
    await db.clearAll();
  } else {
    const now = Date.now();
    const since =
      range === 'lastHour'
        ? now - 60 * 60 * 1000
        : new Date(new Date(now).getFullYear(), new Date(now).getMonth(), new Date(now).getDate()).getTime();
    await db.deleteEntriesSince(since);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onHistoryChanged(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
