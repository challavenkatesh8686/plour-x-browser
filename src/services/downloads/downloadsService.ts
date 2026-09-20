import { isElectronDesktop } from '../../utils/platform';
import type { DesktopDownloadItem } from '../browserEngine/desktopBridgeTypes';

export type { DesktopDownloadItem };

/**
 * Real downloads (actual files landing in the OS Downloads folder via
 * Electron's session.on('will-download')) exist only on desktop this pass --
 * Android keeps its current "open in system browser" fallback (see
 * useTabEngineEvents.ts's downloadRequested handler) rather than a half
 * implementation. isDownloadsAvailable() lets UI decide whether to show a
 * Downloads entry at all.
 */
export function isDownloadsAvailable(): boolean {
  return isElectronDesktop();
}

export async function listDownloads(): Promise<DesktopDownloadItem[]> {
  if (!isElectronDesktop() || !window.plourxDesktop) return [];
  return window.plourxDesktop.listDownloads();
}

export async function cancelDownload(id: string): Promise<void> {
  await window.plourxDesktop?.cancelDownload(id);
}

export async function openDownload(id: string): Promise<void> {
  await window.plourxDesktop?.openDownload(id);
}

export async function showDownloadInFolder(id: string): Promise<void> {
  await window.plourxDesktop?.showDownloadInFolder(id);
}

export function onDownloadUpdated(handler: (item: DesktopDownloadItem) => void): () => void {
  if (!isElectronDesktop() || !window.plourxDesktop) return () => {};
  return window.plourxDesktop.onDownloadUpdated(handler);
}
