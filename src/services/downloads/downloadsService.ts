import { isElectronDesktop, isNativeAndroid } from '../../utils/platform';
import { BrowserEngine } from '../browserEngine/browserEnginePlugin';
import type { DesktopDownloadItem } from '../browserEngine/desktopBridgeTypes';

export type { DesktopDownloadItem };

/**
 * Real downloads exist on both platforms: Electron's session.on('will-download')
 * on desktop, android.app.DownloadManager (triggered from the WebView's
 * DownloadListener) on Android -- see PlourxBrowserEnginePlugin#startDownload.
 * Both expose the identical DesktopDownloadItem/DownloadItem shape so this
 * file and DownloadsPage.tsx/useDownloads.ts need no platform branching
 * beyond what's already here.
 */
export function isDownloadsAvailable(): boolean {
  return isElectronDesktop() || isNativeAndroid();
}

export async function listDownloads(): Promise<DesktopDownloadItem[]> {
  if (isNativeAndroid()) {
    const { downloads } = await BrowserEngine.listDownloads();
    return downloads;
  }
  if (!isElectronDesktop() || !window.plourxDesktop) return [];
  return window.plourxDesktop.listDownloads();
}

export async function cancelDownload(id: string): Promise<void> {
  if (isNativeAndroid()) {
    await BrowserEngine.cancelDownload({ downloadId: id });
    return;
  }
  await window.plourxDesktop?.cancelDownload(id);
}

export async function openDownload(id: string): Promise<void> {
  if (isNativeAndroid()) {
    await BrowserEngine.openDownload({ downloadId: id });
    return;
  }
  await window.plourxDesktop?.openDownload(id);
}

export async function showDownloadInFolder(id: string): Promise<void> {
  if (isNativeAndroid()) {
    await BrowserEngine.showDownloadInFolder({ downloadId: id });
    return;
  }
  await window.plourxDesktop?.showDownloadInFolder(id);
}

/** Clears download history records only -- never deletes files already saved to disk, matching how "clear download history" works in every major browser. */
export async function clearAllDownloads(): Promise<void> {
  if (isNativeAndroid()) {
    await BrowserEngine.clearAllDownloads();
    return;
  }
  if (isElectronDesktop()) await window.plourxDesktop?.clearAllDownloads();
}

export function onDownloadUpdated(handler: (item: DesktopDownloadItem) => void): () => void {
  if (isNativeAndroid()) {
    // Mirrors browserEngineService.ts's onEngineEvent: addListener is async,
    // so an unsubscribe that races the registration must still remove the
    // eventual handle rather than leak a live native listener.
    let cancelled = false;
    let handle: { remove: () => void } | undefined;
    void BrowserEngine.addListener('downloadStateChanged', handler).then((h) => {
      if (cancelled) h.remove();
      else handle = h;
    });
    return () => {
      cancelled = true;
      handle?.remove();
    };
  }
  if (!isElectronDesktop() || !window.plourxDesktop) return () => {};
  return window.plourxDesktop.onDownloadUpdated(handler);
}
