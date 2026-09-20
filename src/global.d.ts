import type { PlourxDesktopBridge } from './services/browserEngine/desktopBridgeTypes';

export {};

declare global {
  interface Window {
    /** Injected by electron/preload.cjs's contextBridge; absent in every other context (Android WebView, plain web preview). */
    plourxDesktop?: PlourxDesktopBridge;
  }
}
