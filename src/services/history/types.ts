export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  visitedAt: number;
}

export type HistoryDeleteRange = 'lastHour' | 'today' | 'all';
