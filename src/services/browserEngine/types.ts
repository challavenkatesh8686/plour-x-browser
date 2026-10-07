export interface ViewportBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface TabIdArg {
  tabId: string;
}

export interface NavigationState {
  tabId: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface ProgressEvent {
  tabId: string;
  progress: number;
}

export interface TitleChangedEvent {
  tabId: string;
  title: string;
}

export interface FaviconChangedEvent {
  tabId: string;
  faviconBase64Png: string;
}

export interface NewWindowRequestedEvent {
  tabId: string;
  url: string;
}

export interface DownloadRequestedEvent {
  tabId: string;
  url: string;
  mimeType: string;
  contentDisposition: string;
  contentLength: number;
}

export interface PermissionRequestedEvent {
  tabId: string;
  resources: string[];
}

export interface ErrorReceivedEvent {
  tabId: string;
  errorCode: number;
  description: string;
  failingUrl: string;
}

export interface TabCrashedEvent {
  tabId: string;
}

export interface FindResultChangedEvent {
  tabId: string;
  activeMatchOrdinal: number;
  matches: number;
}

export interface TabSnapshotResult {
  thumbnailBase64: string | null;
}

/** Shaped identically to desktop's DesktopDownloadItem (see desktopBridgeTypes.ts) so downloadsService.ts/DownloadsPage.tsx work unmodified across platforms. */
export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  savePath: string;
  receivedBytes: number;
  totalBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
}

export interface PlourxBrowserEnginePlugin {
  createTab(args: TabIdArg): Promise<void>;
  loadUrl(args: TabIdArg & { url: string }): Promise<void>;
  goBack(args: TabIdArg): Promise<void>;
  goForward(args: TabIdArg): Promise<void>;
  reload(args: TabIdArg): Promise<void>;
  stop(args: TabIdArg): Promise<void>;
  setViewportBounds(args: TabIdArg & ViewportBounds): Promise<void>;
  setVisible(args: TabIdArg & { visible: boolean }): Promise<void>;
  switchToTab(args: TabIdArg & { url?: string }): Promise<void>;
  closeTab(args: TabIdArg): Promise<void>;
  suspendTab(args: TabIdArg): Promise<TabSnapshotResult>;
  resumeTab(args: TabIdArg & { url: string }): Promise<void>;
  getTabSnapshot(args: TabIdArg): Promise<TabSnapshotResult>;
  evaluateJavascript(args: TabIdArg & { script: string }): Promise<{ result: string | null }>;
  openInSystemBrowser(args: { url: string }): Promise<void>;
  shareUrl(args: { url: string; title?: string }): Promise<void>;
  setDesktopMode(args: TabIdArg & { desktop: boolean }): Promise<void>;
  listDownloads(): Promise<{ downloads: DownloadItem[] }>;
  cancelDownload(args: { downloadId: string }): Promise<void>;
  openDownload(args: { downloadId: string }): Promise<void>;
  showDownloadInFolder(args: { downloadId: string }): Promise<void>;
  clearAllDownloads(): Promise<void>;
  clearBrowsingData(args: { cookies: boolean; cache: boolean }): Promise<void>;
  setZoom(args: TabIdArg & { percent: number }): Promise<void>;
  startFindInPage(args: TabIdArg & { query: string }): Promise<void>;
  findNext(args: TabIdArg & { forward: boolean }): Promise<void>;
  stopFindInPage(args: TabIdArg): Promise<void>;
  setFullscreen(args: { fullscreen: boolean }): Promise<void>;
  printTab(args: TabIdArg): Promise<void>;

  addListener(eventName: 'pageStarted', listenerFunc: (data: NavigationState) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'pageFinished', listenerFunc: (data: NavigationState) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'progressChanged', listenerFunc: (data: ProgressEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'titleChanged', listenerFunc: (data: TitleChangedEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'faviconChanged', listenerFunc: (data: FaviconChangedEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'navigationStateChanged', listenerFunc: (data: NavigationState) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'newWindowRequested', listenerFunc: (data: NewWindowRequestedEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'downloadRequested', listenerFunc: (data: DownloadRequestedEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'permissionRequested', listenerFunc: (data: PermissionRequestedEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'errorReceived', listenerFunc: (data: ErrorReceivedEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'tabCrashed', listenerFunc: (data: TabCrashedEvent) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'downloadStateChanged', listenerFunc: (data: DownloadItem) => void): Promise<{ remove: () => void }>;
  addListener(eventName: 'findResultChanged', listenerFunc: (data: FindResultChangedEvent) => void): Promise<{ remove: () => void }>;
}
