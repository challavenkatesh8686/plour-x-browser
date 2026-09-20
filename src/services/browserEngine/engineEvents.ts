/**
 * The set of per-tab engine events that exist on BOTH platforms, mirrored
 * 1:1 from what PlourxBrowserEnginePlugin.java already emits on Android.
 * Desktop-only concerns (keyboard accelerators, find-in-page results,
 * download progress) deliberately do NOT live here -- they have no Android
 * analog, so folding them into this map would blur what "platform-agnostic
 * engine event" actually means. See desktopBridgeTypes.ts for those.
 */
export interface EngineEventMap {
  pageStarted: { tabId: string; url: string; title: string; canGoBack: boolean; canGoForward: boolean };
  pageFinished: { tabId: string; url: string; title: string; canGoBack: boolean; canGoForward: boolean };
  progressChanged: { tabId: string; progress: number };
  titleChanged: { tabId: string; title: string };
  faviconChanged: { tabId: string; faviconBase64Png: string };
  navigationStateChanged: { tabId: string; canGoBack: boolean; canGoForward: boolean };
  newWindowRequested: { tabId: string; url: string };
  downloadRequested: { tabId: string; url: string; mimeType: string; contentDisposition: string; contentLength: number };
  permissionRequested: { tabId: string; resources: string[] };
  errorReceived: { tabId: string; errorCode: number; description: string; failingUrl: string };
  tabCrashed: { tabId: string };
}

export type EngineEventName = keyof EngineEventMap;
