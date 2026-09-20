import { Capacitor } from '@capacitor/core';

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/** Detects the Electron desktop shell via the preload-injected bridge global, never user-agent sniffing. */
export function isElectronDesktop(): boolean {
  return typeof window !== 'undefined' && typeof window.plourxDesktop !== 'undefined';
}
