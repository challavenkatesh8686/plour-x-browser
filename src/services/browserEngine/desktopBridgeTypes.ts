import type { EngineEventMap } from './engineEvents';

export interface DesktopDownloadItem {
  id: string;
  filename: string;
  url: string;
  savePath: string;
  receivedBytes: number;
  totalBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
}

export interface DesktopFindResult {
  activeMatchOrdinal: number;
  matches: number;
}

/**
 * The API electron/preload.cjs exposes via contextBridge.exposeInMainWorld('plourxDesktop', ...).
 * Method names deliberately mirror PlourxBrowserEnginePlugin's (see browserEngine/types.ts) so
 * browserEngineService.ts's desktopBackend is a near 1:1 transcription, not a redesign.
 */
export interface PlourxDesktopBridge {
  createTab(tabId: string): Promise<void>;
  loadUrl(tabId: string, url: string): Promise<void>;
  goBack(tabId: string): Promise<void>;
  goForward(tabId: string): Promise<void>;
  reload(tabId: string): Promise<void>;
  stop(tabId: string): Promise<void>;
  setViewportBounds(tabId: string, bounds: { top: number; left: number; right: number; bottom: number }): Promise<void>;
  setVisible(tabId: string, visible: boolean): Promise<void>;
  switchToTab(tabId: string, url?: string): Promise<void>;
  closeTab(tabId: string): Promise<void>;
  getTabSnapshot(tabId: string): Promise<string | null>;
  evaluateJavascript(tabId: string, script: string): Promise<string | null>;
  openInSystemBrowser(url: string): Promise<void>;
  copyLink(url: string): Promise<void>;

  onEngineEvent<K extends keyof EngineEventMap>(event: K, handler: (payload: EngineEventMap[K]) => void): () => void;
  onAccelerator(handler: (combo: string) => void): () => void;
  onFindResult(handler: (result: DesktopFindResult) => void): () => void;

  findInPage(query: string, forward: boolean): void;
  stopFindInPage(): void;

  onDownloadUpdated(handler: (item: DesktopDownloadItem) => void): () => void;
  listDownloads(): Promise<DesktopDownloadItem[]>;
  cancelDownload(id: string): Promise<void>;
  openDownload(id: string): Promise<void>;
  showDownloadInFolder(id: string): Promise<void>;
}
