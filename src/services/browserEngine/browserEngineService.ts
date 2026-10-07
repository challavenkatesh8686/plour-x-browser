import { isElectronDesktop, isNativeAndroid } from '../../utils/platform';
import { BrowserEngine } from './browserEnginePlugin';
import type { ViewportBounds } from './types';
import type { EngineEventMap, EngineEventName } from './engineEvents';

export class BrowserEngineUnavailableError extends Error {
  constructor() {
    super('The PlourX Browser rendering engine is only available in the Android app or the desktop app.');
    this.name = 'BrowserEngineUnavailableError';
  }
}

/**
 * One method per capability, implemented once per platform. Every exported
 * function below is a thin one-liner delegating to whichever backend
 * resolveBackend() picks -- this keeps the public API identical to before
 * the desktop work started (Android call sites are unaffected) and makes it
 * easy to eyeball that no platform-specific logic leaked into the public
 * surface.
 */
interface EngineBackend {
  createTab(tabId: string): Promise<void>;
  loadUrl(tabId: string, url: string): Promise<void>;
  goBack(tabId: string): Promise<void>;
  goForward(tabId: string): Promise<void>;
  reload(tabId: string): Promise<void>;
  stop(tabId: string): Promise<void>;
  setViewportBounds(tabId: string, bounds: ViewportBounds): Promise<void>;
  setVisible(tabId: string, visible: boolean): Promise<void>;
  switchToTab(tabId: string, url?: string): Promise<void>;
  closeTab(tabId: string): Promise<void>;
  suspendTab(tabId: string): Promise<string | null>;
  resumeTab(tabId: string, url: string): Promise<void>;
  getTabSnapshot(tabId: string): Promise<string | null>;
  evaluateJavascript(tabId: string, script: string): Promise<string | null>;
  openInSystemBrowser(url: string): Promise<void>;
  shareUrl(url: string, title?: string): Promise<void>;
  setDesktopMode(tabId: string, desktop: boolean): Promise<void>;
  setZoom(tabId: string, percent: number): Promise<void>;
  printTab(tabId: string): Promise<void>;
  onEngineEvent<K extends EngineEventName>(event: K, handler: (payload: EngineEventMap[K]) => void): () => void;
}

/** Wraps the existing Capacitor plugin. Bodies are unchanged from before the desktop work -- this is a pure relocation. */
const androidBackend: EngineBackend = {
  async createTab(tabId) {
    await BrowserEngine.createTab({ tabId });
  },
  async loadUrl(tabId, url) {
    await BrowserEngine.loadUrl({ tabId, url });
  },
  async goBack(tabId) {
    await BrowserEngine.goBack({ tabId });
  },
  async goForward(tabId) {
    await BrowserEngine.goForward({ tabId });
  },
  async reload(tabId) {
    await BrowserEngine.reload({ tabId });
  },
  async stop(tabId) {
    await BrowserEngine.stop({ tabId });
  },
  async setViewportBounds(tabId, bounds) {
    await BrowserEngine.setViewportBounds({ tabId, ...bounds });
  },
  async setVisible(tabId, visible) {
    await BrowserEngine.setVisible({ tabId, visible });
  },
  async switchToTab(tabId, url) {
    await BrowserEngine.switchToTab({ tabId, url });
  },
  async closeTab(tabId) {
    await BrowserEngine.closeTab({ tabId });
  },
  async suspendTab(tabId) {
    const { thumbnailBase64 } = await BrowserEngine.suspendTab({ tabId });
    return thumbnailBase64;
  },
  async resumeTab(tabId, url) {
    await BrowserEngine.resumeTab({ tabId, url });
  },
  async getTabSnapshot(tabId) {
    const { thumbnailBase64 } = await BrowserEngine.getTabSnapshot({ tabId });
    return thumbnailBase64;
  },
  async evaluateJavascript(tabId, script) {
    const { result } = await BrowserEngine.evaluateJavascript({ tabId, script });
    return result;
  },
  async openInSystemBrowser(url) {
    await BrowserEngine.openInSystemBrowser({ url });
  },
  async shareUrl(url, title) {
    await BrowserEngine.shareUrl({ url, title });
  },
  async setDesktopMode(tabId, desktop) {
    await BrowserEngine.setDesktopMode({ tabId, desktop });
  },
  async setZoom(tabId, percent) {
    await BrowserEngine.setZoom({ tabId, percent });
  },
  async printTab(tabId) {
    await BrowserEngine.printTab({ tabId });
  },
  onEngineEvent<K extends EngineEventName>(event: K, handler: (payload: EngineEventMap[K]) => void) {
    // Capacitor's addListener is async (Promise<{remove}>); if the caller
    // unsubscribes before it resolves we must not drop the eventual handle
    // on the floor (that would leak a live native listener), so the removal
    // is chained onto the same promise rather than only firing "if still
    // subscribed."
    let cancelled = false;
    let handle: { remove: () => void } | undefined;
    // Capacitor's addListener overloads are declared per literal event name
    // (see browserEngine/types.ts), so they don't match a generic `K`
    // parameter -- this narrow, local-only cast is safe because the runtime
    // behavior is identical for every event name (it's the same underlying
    // Capacitor call either way).
    const addListener = BrowserEngine.addListener as unknown as (
      event: EngineEventName,
      handler: (data: EngineEventMap[K]) => void,
    ) => Promise<{ remove: () => void }>;
    void addListener(event, handler).then((h) => {
      if (cancelled) h.remove();
      else handle = h;
    });
    return () => {
      cancelled = true;
      handle?.remove();
    };
  },
};

/** Wraps the preload-injected desktop bridge. Throws if called when it doesn't exist -- resolveBackend() only selects this when isElectronDesktop() is true, so that should never happen in practice. */
function desktopBridge() {
  const bridge = window.plourxDesktop;
  if (!bridge) throw new BrowserEngineUnavailableError();
  return bridge;
}

const desktopBackend: EngineBackend = {
  createTab: (tabId) => desktopBridge().createTab(tabId),
  loadUrl: (tabId, url) => desktopBridge().loadUrl(tabId, url),
  goBack: (tabId) => desktopBridge().goBack(tabId),
  goForward: (tabId) => desktopBridge().goForward(tabId),
  reload: (tabId) => desktopBridge().reload(tabId),
  stop: (tabId) => desktopBridge().stop(tabId),
  setViewportBounds: (tabId, bounds) => desktopBridge().setViewportBounds(tabId, bounds),
  setVisible: (tabId, visible) => desktopBridge().setVisible(tabId, visible),
  switchToTab: (tabId, url) => desktopBridge().switchToTab(tabId, url),
  closeTab: (tabId) => desktopBridge().closeTab(tabId),
  // Desktop doesn't run Android's tight 4-tab suspend pool (RAM budgets are
  // much larger); these are harmless no-ops so shared callers don't need to
  // branch on platform.
  suspendTab: async () => null,
  resumeTab: async () => undefined,
  getTabSnapshot: (tabId) => desktopBridge().getTabSnapshot(tabId),
  evaluateJavascript: (tabId, script) => desktopBridge().evaluateJavascript(tabId, script),
  openInSystemBrowser: (url) => desktopBridge().openInSystemBrowser(url),
  // Windows has no universal share-sheet equivalent to Android's ACTION_SEND;
  // "copy link" is the honest desktop equivalent, not a lesser version of
  // the same feature. BrowserMenu.tsx labels this differently per platform.
  shareUrl: (url) => desktopBridge().copyLink(url),
  // "Desktop site" doesn't apply to a desktop browser; BrowserMenu.tsx hides
  // this entry entirely on desktop, so this body should never actually run.
  setDesktopMode: async () => undefined,
  setZoom: (tabId, percent) => desktopBridge().setZoom(tabId, percent),
  printTab: (tabId) => desktopBridge().printTab(tabId),
  onEngineEvent: (event, handler) => desktopBridge().onEngineEvent(event, handler),
};

let cachedBackend: EngineBackend | null | undefined;

function resolveBackend(): EngineBackend | null {
  if (cachedBackend !== undefined) return cachedBackend;
  cachedBackend = isNativeAndroid() ? androidBackend : isElectronDesktop() ? desktopBackend : null;
  return cachedBackend;
}

/**
 * Real page rendering requires either the native PlourxBrowserEngine plugin
 * (Android) or the Electron desktop bridge -- there is deliberately no
 * iframe-based web fallback: most real sites block iframing
 * (X-Frame-Options/CSP), and an iframe gives no back/forward, title, or
 * favicon events -- it would be a fake browsing surface. Callers should
 * check this first and render an honest placeholder otherwise (the plain
 * `npm run dev` web-preview build, with neither backend present).
 */
export function isEngineAvailable(): boolean {
  return resolveBackend() !== null;
}

function requireEngine(): EngineBackend {
  const backend = resolveBackend();
  if (!backend) throw new BrowserEngineUnavailableError();
  return backend;
}

export async function createTab(tabId: string): Promise<void> {
  await requireEngine().createTab(tabId);
}

export async function loadUrl(tabId: string, url: string): Promise<void> {
  await requireEngine().loadUrl(tabId, url);
}

export async function goBack(tabId: string): Promise<void> {
  await requireEngine().goBack(tabId);
}

export async function goForward(tabId: string): Promise<void> {
  await requireEngine().goForward(tabId);
}

export async function reload(tabId: string): Promise<void> {
  await requireEngine().reload(tabId);
}

export async function stop(tabId: string): Promise<void> {
  await requireEngine().stop(tabId);
}

export async function setViewportBounds(tabId: string, bounds: ViewportBounds): Promise<void> {
  await requireEngine().setViewportBounds(tabId, bounds);
}

export async function setVisible(tabId: string, visible: boolean): Promise<void> {
  await requireEngine().setVisible(tabId, visible);
}

/**
 * `url` is a recovery hint, not a navigation: if the backend has never seen
 * this tabId (on Android, most commonly because the OS killed the whole app
 * process while backgrounded and this is a fresh plugin instance), it
 * lazily creates the tab entry using this URL instead of rejecting and
 * leaving the browser on a blank page. Always pass the tab's current known
 * URL here so process-death restarts recover correctly.
 */
export async function switchToTab(tabId: string, url?: string): Promise<void> {
  await requireEngine().switchToTab(tabId, url);
}

export async function closeTab(tabId: string): Promise<void> {
  await requireEngine().closeTab(tabId);
}

export async function suspendTab(tabId: string): Promise<string | null> {
  return requireEngine().suspendTab(tabId);
}

export async function resumeTab(tabId: string, url: string): Promise<void> {
  await requireEngine().resumeTab(tabId, url);
}

export async function getTabSnapshot(tabId: string): Promise<string | null> {
  return requireEngine().getTabSnapshot(tabId);
}

export async function evaluateJavascript(tabId: string, script: string): Promise<string | null> {
  return requireEngine().evaluateJavascript(tabId, script);
}

/** Honest fallback offered when a feature (e.g. Android downloads) isn't implemented yet. */
export async function openInSystemBrowser(url: string): Promise<void> {
  await requireEngine().openInSystemBrowser(url);
}

export async function shareUrl(url: string, title?: string): Promise<void> {
  await requireEngine().shareUrl(url, title);
}

/**
 * Swaps the User-Agent string and reloads -- the only thing a stock WebView
 * actually lets an app do for "desktop site" on Android. Not applicable on
 * the desktop app itself (see BrowserMenu.tsx, which hides this entry there).
 */
export async function setDesktopMode(tabId: string, desktop: boolean): Promise<void> {
  await requireEngine().setDesktopMode(tabId, desktop);
}

/** Android: WebView's own text-zoom scaling. Desktop: Electron's webContents.zoomFactor. Both take a percentage (100 = default). */
export async function setZoom(tabId: string, percent: number): Promise<void> {
  await requireEngine().setZoom(tabId, percent);
}

export async function printTab(tabId: string): Promise<void> {
  await requireEngine().printTab(tabId);
}

/** Platform-agnostic subscription to the per-tab engine events both backends emit. Use this instead of touching BrowserEngine/window.plourxDesktop directly. */
export function onEngineEvent<K extends EngineEventName>(event: K, handler: (payload: EngineEventMap[K]) => void): () => void {
  const backend = resolveBackend();
  if (!backend) return () => {};
  return backend.onEngineEvent(event, handler);
}

// ---------------------------------------------------------------------------
// Find in page: real on both platforms now (Android via WebView's own
// findAllAsync/findNext/FindListener, desktop via Electron's
// webContents.findInPage). Kept outside EngineBackend/EngineEventMap because
// the two platforms' native result-delivery shapes differ enough (Android
// fires through the normal Capacitor event bus, desktop over its own
// FIND_RESULT ipc channel) that forcing them into the same generic map would
// obscure more than it simplifies, not because either platform lacks it.
// ---------------------------------------------------------------------------

export function findInPage(tabId: string, query: string, forward: boolean): void {
  if (isNativeAndroid()) {
    void BrowserEngine.startFindInPage({ tabId, query });
  } else if (isElectronDesktop()) {
    window.plourxDesktop?.findInPage(tabId, query, forward);
  }
}

/**
 * Moves to the next/previous match of an ALREADY-STARTED search, without
 * resetting it. Android has a dedicated native call for this (WebView's
 * findNext -- re-calling findAllAsync instead would reset to the first
 * match every time, breaking repeated "next" presses). Electron has no such
 * distinction: calling webContents.findInPage again with the same query is
 * itself how you move to the next/previous match, so `query` is only used
 * on that branch.
 */
export function findNextInPage(tabId: string, forward: boolean, query: string): void {
  if (isNativeAndroid()) {
    void BrowserEngine.findNext({ tabId, forward });
  } else if (isElectronDesktop()) {
    window.plourxDesktop?.findInPage(tabId, query, forward);
  }
}

export function stopFindInPage(tabId: string): void {
  if (isNativeAndroid()) void BrowserEngine.stopFindInPage({ tabId });
  else if (isElectronDesktop()) window.plourxDesktop?.stopFindInPage(tabId);
}

export function onFindResult(handler: (result: { activeMatchOrdinal: number; matches: number }) => void): () => void {
  if (isNativeAndroid()) {
    // Same async-addListener-with-a-possibly-early-unsubscribe pattern as
    // downloadsService.ts's onDownloadUpdated -- this event is Android-only
    // (desktop's find result arrives over its own FIND_RESULT ipc channel
    // below instead), so it's not part of the shared EngineEventMap/
    // onEngineEvent plumbing, consistent with how downloadStateChanged is handled.
    let cancelled = false;
    let handle: { remove: () => void } | undefined;
    void BrowserEngine.addListener('findResultChanged', (data) => {
      handler({ activeMatchOrdinal: data.activeMatchOrdinal, matches: data.matches });
    }).then((h) => {
      if (cancelled) h.remove();
      else handle = h;
    });
    return () => {
      cancelled = true;
      handle?.remove();
    };
  }
  if (!isElectronDesktop() || !window.plourxDesktop) return () => {};
  return window.plourxDesktop.onFindResult(handler);
}

/** Desktop-only: Android has no OS keyboard accelerators to intercept (a hardware keyboard would just dispatch normal DOM key events the chrome UI already sees). */
export function onAccelerator(handler: (combo: string) => void): () => void {
  if (!isElectronDesktop() || !window.plourxDesktop) return () => {};
  return window.plourxDesktop.onAccelerator(handler);
}

/** Real immersive fullscreen on both platforms: Android hides the system status/nav bars, desktop uses the OS window's native fullscreen. Not tab-scoped (whole app window/activity). */
export async function setFullscreen(fullscreen: boolean): Promise<void> {
  if (isNativeAndroid()) {
    await BrowserEngine.setFullscreen({ fullscreen });
  } else if (isElectronDesktop()) {
    await window.plourxDesktop?.setFullscreen(fullscreen);
  }
}

/** Backs the Privacy settings page's "Clear browsing data." Android only for now -- desktop has no equivalent native call yet. */
export async function clearBrowsingData(options: { cookies: boolean; cache: boolean }): Promise<void> {
  if (isNativeAndroid()) {
    await BrowserEngine.clearBrowsingData(options);
  }
}

export { BrowserEngine };
