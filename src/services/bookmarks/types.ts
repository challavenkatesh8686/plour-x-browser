export interface Bookmark {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  createdAt: number;
  /** Unused this pass -- reserved so folder support can be added without a data migration. */
  folderId?: string;
}
