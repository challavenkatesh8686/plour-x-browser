# PlourX Browser

A real, mobile-first Android browser **and** a real Windows desktop browser, sharing one PlourX-designed chrome UI and one browser-state core (tabs, history, bookmarks, search engines, auth). Toolbar, address bar, tab management, real navigation, bookmarks, history, a configurable search-engine system, and PlourX account sign-in all work identically on both platforms; only the actual page-rendering engine underneath is platform-specific.

## Stack

Vite + React 19 + TypeScript + React Router 7, mirroring `plour-x-dialer`'s template (CSS Modules, `lucide-react` icons, the shared `--px-*` design tokens). Two native shells sit on top of the same React app:
- **Android**: Capacitor 8 (`@capacitor/app` added for real hardware back-button semantics, which a browser needs and dialer/camera don't).
- **Desktop (Windows)**: Electron 44, packaged with `electron-builder`.

## Architecture: one browser core, two engines

Almost everything in `src/` is platform-agnostic: `TabsContext`/`tabsReducer` (tab lifecycle, including a cross-platform "recently closed" stack for Ctrl+Shift+T), bookmarks, history, search engines, auth, and every page/component only ever call the abstracted functions in `src/services/browserEngine/browserEngineService.ts` -- none of them touch Capacitor or Electron directly. That file resolves to one of two backends at runtime:

- `androidBackend` wraps the existing `PlourxBrowserEngine` Capacitor plugin (unchanged from the Android-only version of this app).
- `desktopBackend` wraps `window.plourxDesktop`, a bridge injected by `electron/preload.cjs`.

`src/utils/platform.ts` exposes `isNativeAndroid()` and `isElectronDesktop()` (the latter detects the preload-injected bridge global, never user-agent sniffing). `isEngineAvailable()` is true when either is. On a plain web preview (`npm run dev` in a normal browser tab, neither bridge present), the browsing surface shows an honest "open PlourX Browser on Android or desktop to browse" placeholder instead of faking navigation with an iframe -- most real sites block iframing via `X-Frame-Options`/CSP anyway, and an iframe gives no back/forward/title/favicon events.

`src/hooks/useTabEngineEvents.ts` subscribes to a typed, platform-agnostic `EngineEventMap` (`onEngineEvent(...)`) instead of touching either native bridge directly, so the same event-handling code drives both platforms.

## Android native browsing engine

**PlourxBrowserEngine** (`android/app/src/main/java/com/plourx/browser/`) manages one `android.webkit.WebView` per browser tab, added as an additional opaque sibling view in the same root `CoordinatorLayout` that already holds Capacitor's own WebView (confirmed by inspecting `activity_main.xml`). Only the active tab's WebView is visible at a time, positioned to the exact on-screen rect JS reports for the content area below the toolbar (`useViewportBounds`). Hiding the engine (`setVisible`) is the mechanism used for every full-screen React overlay -- the tab manager, Bookmarks, History, Settings, and the address-bar suggestions dropdown.

At most 4 tab WebViews are alive at once (`MAX_ALIVE_ENGINES`). Switching tabs, or a system memory-trim callback (`MainActivity.onTrimMemory`), suspends the least-recently-used background tabs: a thumbnail is captured and the WebView is destroyed, then recreated with a fresh load if the user switches back. In-page JS state/scroll position is lost on resume -- the same tradeoff every mobile browser makes under memory pressure, disclosed in Settings > Tabs.

**Process-death recovery**: if Android kills the whole app process while backgrounded (routine under memory pressure) and the user returns, a fresh plugin instance's native tab map is empty even though JS has restored tab metadata from `localStorage`. `switchToTab` on the native side lazily recreates the tab entry from a JS-supplied URL hint instead of rejecting -- otherwise the toolbar would show the right title while the page area stayed permanently blank. Verified by force-killing the process mid-session and confirming the page reloads correctly on relaunch.

Security: `MIXED_CONTENT_NEVER_ALLOW` (the platform's own secure default, stated explicitly so a future edit can't accidentally loosen it), `setAllowFileAccess(false)`/`setAllowContentAccess(false)` on every content WebView, no `addJavascriptInterface` anywhere (grep-verified -- no JS-to-Java bridge reachable from loaded pages), WebView remote debugging gated behind `BuildConfig.DEBUG`.

## Desktop (Windows) browsing engine

`electron/main.cjs` creates one `BrowserWindow` (stock OS frame -- this alone satisfies "Windows-conventional chrome"; no custom frameless titlebar was built) hosting the React chrome, and one `WebContentsView` per tab (Electron's current, non-deprecated per-tab native view API, replacing the deprecated `BrowserView`). Tab views are attached/detached from the window's `contentView` (`addChildView`/`removeChildView`) exactly the way Android attaches/hides its WebViews -- the two engines are conceptually the same shape. `setBounds()` is driven by the identical CSS-px rect `useViewportBounds.ts` already computes; unlike Android, **no device-density conversion is needed** (Electron view bounds are already in the window's own DIP/CSS-px space).

Electron has no native `onProgressChanged` the way Android's `WebChromeClient` does, so progress is a heuristic: `did-start-loading` resets to ~8% and creeps toward 90% on a decaying-step interval, `dom-ready` snaps to ~55%, `did-stop-loading` snaps to 100%.

**Keyboard shortcuts are intercepted in the main process** via `before-input-event` registered on every `WebContentsView`'s `webContents` *and* the chrome window's -- not a renderer-side `keydown` listener, which would only ever fire while the chrome UI itself happened to have OS input focus (the address bar), not while an actual loaded page has focus (the common case while browsing). `Menu.setApplicationMenu(null)` removes Electron's default menu so nothing double-handles the same combos. Implemented: Ctrl+L (focus address bar), Ctrl+T (new tab), Ctrl+W (close tab), Ctrl+Shift+T (reopen closed tab), Ctrl+R / F5 (reload), Ctrl+F (find in page), Ctrl+D (bookmark), Ctrl+Tab / Ctrl+Shift+Tab (next/previous tab), Alt+Left / Alt+Right (back/forward).

**Find in page** (Ctrl+F) uses Electron's native `webContents.findInPage`/`stopFindInPage`/`found-in-page` -- no custom implementation needed, unlike Android (which has no equivalent yet; `evaluateJavascript` exists as an unused extension point there).

**Downloads are real** on desktop: `session.on('will-download')` saves to the OS's actual Downloads folder (`app.getPath('downloads')`) with live progress, cancel, open-file, and show-in-folder, surfaced on a dedicated Downloads page. This is desktop-only for this pass -- Android keeps its existing "open in system browser" fallback rather than a half-built native downloads UI (Android's `DownloadManager` integration is a reasonable follow-up, not attempted here).

**Desktop UI**: a horizontal tab strip (`DesktopTabStrip`) replaces the mobile `BottomNav` at wide viewports (`min-width: 840px`, pure CSS -- so a wide web-preview window gets the same layout, not just Electron specifically), with Bookmarks/History/Downloads/Settings icons alongside it, reusing `TabsContext` with no new state.

### Security lockdown (Electron)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webviewTag: false` on **both** the chrome window and every per-tab `WebContentsView`.
- Per-tab views get **no preload at all** -- there is no code path from a loaded page to Node, to IPC, or to the `plourxDesktop` bridge (which only ever exists in the chrome window's isolated preload context).
- The chrome window's own `webContents` has `setWindowOpenHandler` deny-all and a `will-navigate` guard, so nothing can navigate the app UI itself away from its own bundle/dev server; only per-tab views render arbitrary content.
- `electron/preload.cjs` exposes only a fixed set of named functions via `contextBridge.exposeInMainWorld` -- never a generic `ipcRenderer` passthrough. (Its IPC channel constants are a small hand-duplicated copy of `electron/ipcChannels.cjs`'s, because **sandboxed preload scripts cannot `require()` arbitrary local files** -- only Electron/Node built-ins. This was discovered the hard way: the shared-constants version failed silently at runtime with "module not found" despite compiling fine. Keep the two in sync on any channel change.)
- Every IPC handler in `main.cjs` validates its own input (tabId existence, URL scheme allowlists for navigation and for `shell.openExternal`) -- the main process never trusts renderer-supplied data blindly.
- A real `Content-Security-Policy` meta tag is set in `index.html` (addresses Electron's "Insecure Content-Security-Policy" dev warning, which had none before). It's deliberately not maximally strict -- `'unsafe-inline'` is kept for script/style because Vite's dev client and HMR overlay need it, and a properly separate dev/prod CSP would need index.html templating Vite doesn't do by default. Still a real improvement: blocks `<object>`/`<embed>` plugin content and frame embedding, constrains connect/script/style origins.
- `ELECTRON_RUN_AS_NODE` (if set in the ambient shell environment) is explicitly stripped from the Electron child process's env in `scripts/desktop-dev.mjs` -- if left set, it silently makes the Electron binary behave as plain Node (no `app`/`BrowserWindow`), which is exactly what happened during development here before this fix.

## Search engines

`services/search/searchEngines.ts` is a static registry of the 7 built-in engines (Google, Bing, DuckDuckGo, Yahoo, Brave Search, Ecosia, Startpage). `searchEngineService.getSearchEngines()` is the single, deliberate swap point for a future Supabase-backed admin table (using the ecosystem's existing `profiles.role`-based `is_admin` RLS pattern) -- no other call site would need to change. Works identically on both platforms.

## History storage

Every other local data service in this app (bookmarks, preferences, tabs) uses the same `localStorage` JSON-blob pattern as every sibling PlourX app. History deliberately doesn't: it gets a write on nearly every page load, needs date-range and substring queries, and a JSON blob would mean a full synchronous parse+stringify of the *entire* history on every navigation, against a ~5MB localStorage quota. `services/history/historyDb.ts` is a small hand-rolled wrapper over the native `indexedDB` API instead -- no new dependency, indexed by `visitedAt` and `url`.

## Deliberately deferred to a later phase

- **Android downloads** -- still the "open in system browser" fallback; desktop has the real implementation (see above). A `DownloadManager`-based Android implementation is the natural next step.
- **Site permissions UI** (both platforms) -- `onPermissionRequest`/`setPermissionRequestHandler` auto-deny (so a page's `getUserMedia()` rejects cleanly instead of hanging) and emit an event a future settings screen can build on.
- **Android find-in-page** -- `evaluateJavascript` exists as a plugin method; no UI calls it yet (desktop's is fully implemented via Electron's native API).
- **Private/incognito browsing** -- not modeled in the `Tab` type yet; the reducer's action shape leaves room for it.
- **The 10-preset morphism engine** from `plour-x-website` -- unused; this app uses only the live `--px-*` tokens every shipped PlourX app already uses.
- **Cloud sync** of bookmarks/history/settings -- every local service has a narrow CRUD surface designed to be swapped for a Supabase-backed implementation later.
- **Admin RBAC UI** for search engines -- `AuthContext.isAdmin` is computed (reads `profiles.role`) but no UI consumes it yet.
- **Desktop tab suspension** -- desktop RAM budgets are much larger than a phone's; a generous soft cap (`MAX_ALIVE_TABS = 20`) exists as insurance but nothing like Android's tight 4-tab pool is needed or implemented.
- **Code signing / auto-update** for the Windows installer -- out of scope for this pass. The unsigned NSIS installer will trigger a Windows SmartScreen warning on first run; this is expected, not a bug.

## Environment variables

Copy `.env.example` to `.env` and fill in the same Supabase project every other PlourX app uses:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The app degrades gracefully without these set (auth features fail at request time instead of at boot) but PlourX account sign-in won't work until they're configured.

## Build & run

### Android
```
npm install
npm run build              # tsc -b && vite build
npx cap sync android        # after `npx cap add android` once
cd android && ./gradlew assembleDebug
# or: npx cap open android, then Run from Android Studio
```

### Desktop (Windows)
```
npm install
npm run desktop:dev         # Vite dev server + Electron, live reload
npm run desktop:build       # production build -> dist-electron/ (NSIS installer + portable exe)
```

### Web UI preview (chrome UI only, no real browsing engine)
```
npm run dev
```

## Testing note

**Automated**: `npm run test` (Vitest) -- 35 tests covering URL/search-query detection, the tabs reducer (including recently-closed-tab bookkeeping), search-engine selection, and platform detection. `npm run lint` and `npm run build` are clean.

**Verified for real, end to end (not just "the code compiles")**:
- *Android*: built and installed the debug APK on an emulator (Pixel 8, API 36) repeatedly across this work. Real navigation confirmed with actual third-party sites (Google Search with full rich snippets, YouTube, a live production site), correct title/favicon/HTTPS-lock/progress sync, the mobile tab manager, bookmarks/history persistence, and -- most importantly -- process-death recovery (force-killed the app process mid-session and confirmed the previously-open real page reloads correctly rather than showing a blank page with a stale toolbar, which is the bug this pass found and fixed).
- *Desktop*: ran the actual Electron app (both `desktop:dev` and the packaged production build from `desktop:build`) on a real Windows machine. Confirmed via Electron's own `capturePage()` (screen-region capture proved unreliable in this environment due to OS window-focus/z-order issues unrelated to the app itself) that: the New Tab home page renders correctly with the desktop tab strip and mobile bottom-nav correctly hidden at desktop width; real navigation works (a scripted address-bar submission to `example.com` produced a real "Example Domain" page); the tab manager overlay shows real page titles and a real rendered thumbnail snapshot for multiple tabs with genuinely different sites; the packaged (non-dev) `.exe` launches independently of the dev server and renders the production bundle correctly.
- Three real, non-obvious bugs were found and fixed only by actually running the desktop app rather than trusting the code: (1) `ELECTRON_RUN_AS_NODE` in the ambient environment silently turned every Electron launch into a plain-Node process with no `app`/`BrowserWindow`; (2) sandboxed preload scripts cannot `require()` arbitrary local files, so the shared `ipcChannels.cjs` had to be duplicated inline in `preload.cjs`; (3) a fixed Vite dev port was needed because Electron's dev URL is set once at process start and can't discover a fallback port Vite silently switched to.

**Not exercised in this pass**: Ctrl+F find bar and the full keyboard-shortcut table were implemented and are structurally sound (Electron's `before-input-event`/`findInPage` are well-documented, stable APIs) but not individually click-tested one by one; the same is true of the desktop downloads flow (implemented against Electron's standard `session.on('will-download')` API, not a custom/fragile mechanism, but not verified against a real download in this pass). Both should get a quick manual pass before shipping.
