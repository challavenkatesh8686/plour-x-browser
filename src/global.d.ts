import type { PlourxDesktopBridge } from './services/browserEngine/desktopBridgeTypes';

export {};

declare global {
  interface Window {
    /** Injected by electron/preload.cjs's contextBridge; absent in every other context (Android WebView, plain web preview). */
    plourxDesktop?: PlourxDesktopBridge;
  }

  /** Baked in at build time by vite.config.ts's `define` from package.json's version. */
  const __APP_VERSION__: string;
}
