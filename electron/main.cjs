// Plain CommonJS (not TypeScript) so this needs no separate build step --
// the root package.json's "type": "module" doesn't apply to .cjs files.
const { app, BrowserWindow, WebContentsView, ipcMain, session, shell, Menu, clipboard, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const channels = require('./ipcChannels.cjs');

// Without this, Electron falls back to the generic "Electron" userData
// folder name when unpackaged, which is confusing to find on disk and would
// collide with any other Electron app being developed on the same machine.
app.setName('PlourX Browser');

const isDev = Boolean(process.env.ELECTRON_START_URL);
const DEV_URL = process.env.ELECTRON_START_URL;

// Desktop RAM budgets are much larger than a phone's -- this is a generous
// insurance cap, not Android's tight MAX_ALIVE_ENGINES=4 pool. Only tabs
// that are neither active nor currently attached are ever evicted.
const MAX_ALIVE_TABS = 20;
const ALLOWED_NAV_SCHEMES = new Set(['http:', 'https:']);
const ALLOWED_EXTERNAL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** tabId -> { view, lastUrl, progressTimer, attached, lastActiveAt } */
const tabs = new Map();
let visibleTabId = null;
/** downloadId -> record (incl. the live DownloadItem, stripped before sending to the renderer) */
const downloads = new Map();

const windowStatePath = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(windowStatePath, 'utf-8'));
  } catch {
    return null;
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    fs.writeFileSync(windowStatePath, JSON.stringify(mainWindow.getBounds()));
  } catch {
    // best-effort only -- window position/size is a convenience, not critical data
  }
}

function sendEngineEvent(eventName, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channels.ENGINE_EVENT, { event: eventName, data });
  }
}

function sendAccelerator(combo) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channels.ACCELERATOR, combo);
}

function sendFindResult(result) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channels.FIND_RESULT, result);
}

function sendDownloadUpdate(record) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { item: _item, ...serializable } = record;
  mainWindow.webContents.send(channels.DOWNLOADS_UPDATED, serializable);
}

/**
 * Applied to BOTH the chrome window and every per-tab WebContentsView.
 * sandbox+contextIsolation+no-nodeIntegration+no-webviewTag on the CONTENT
 * views (which get no `preload` at all) means arbitrary loaded pages have
 * zero path to Node or to the plourxDesktop bridge -- the bridge only ever
 * exists in the chrome window's isolated preload context.
 */
function lockedDownWebPreferences(extra) {
  return { contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: false, ...extra };
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts -- intercepted in the MAIN process via before-input-event
// on every webContents (chrome window AND every tab), so they fire
// regardless of which one currently has OS input focus. A renderer-side
// `keydown` listener would only ever see these while the chrome UI itself
// (e.g. the address bar) happens to be focused, which is not the common
// case while actually browsing a loaded page.
// ---------------------------------------------------------------------------

const ACCELERATORS = new Set([
  'CmdOrCtrl+L',
  'CmdOrCtrl+T',
  'CmdOrCtrl+W',
  'CmdOrCtrl+Shift+T',
  'CmdOrCtrl+R',
  'CmdOrCtrl+F',
  'CmdOrCtrl+D',
  'CmdOrCtrl+Tab',
  'CmdOrCtrl+Shift+Tab',
  'Alt+ArrowLeft',
  'Alt+ArrowRight',
  'F5',
]);

function comboFromInput(input) {
  if (input.type !== 'keyDown') return null;
  const parts = [];
  if (input.control || input.meta) parts.push('CmdOrCtrl');
  if (input.shift) parts.push('Shift');
  if (input.alt) parts.push('Alt');
  parts.push(input.key.length === 1 ? input.key.toUpperCase() : input.key);
  return parts.join('+');
}

function registerAccelerators(webContents) {
  webContents.on('before-input-event', (event, input) => {
    const combo = comboFromInput(input);
    if (!combo || !ACCELERATORS.has(combo)) return;
    event.preventDefault();
    // F5 is just a reload synonym; normalize so the renderer only has to handle one shortcut for it.
    sendAccelerator(combo === 'F5' ? 'CmdOrCtrl+R' : combo);
  });
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createMainWindow() {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    width: state?.width ?? 1280,
    height: state?.height ?? 800,
    x: state?.x,
    y: state?.y,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: '#f4f4f7',
    autoHideMenuBar: true,
    webPreferences: lockedDownWebPreferences({ preload: path.join(__dirname, 'preload.cjs') }),
  });

  // No default Electron menu -- avoids double-handling the accelerators
  // above, and looks more like a first-party app than a generic Electron shell.
  Menu.setApplicationMenu(null);

  // The chrome UI must never navigate away from its own bundle/dev server --
  // only per-tab WebContentsViews render arbitrary content.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev && DEV_URL && url.startsWith(DEV_URL)) return;
    event.preventDefault();
  });
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {});

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error('[preload-error]', preloadPath, error);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    // The chrome UI's own renderer crashing is far more serious than a
    // per-tab crash (which tabCrashed already handles) -- there's no
    // sensible in-app recovery, so log it clearly for diagnosis.
    console.error('[chrome-window-crashed]', details);
  });

  registerAccelerators(mainWindow.webContents);

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev && DEV_URL) {
    loadDevUrlWithRetry();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Dev-only, opt-in via env var: periodically dumps the actual rendered
  // chrome frame to disk via capturePage(). Screenshotting only (no script
  // execution capability, unlike a debugger/eval hook), so it's safe to
  // leave in -- useful for verifying UI state in headless/CI environments
  // where OS-level window capture is unreliable (window focus/z-order).
  if (isDev && process.env.PLOURX_DEBUG_CAPTURE) {
    setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.webContents
        .capturePage()
        .then((image) => fs.writeFileSync(process.env.PLOURX_DEBUG_CAPTURE, image.toPNG()))
        .catch(() => {});
    }, 1500);
  }
}

function loadDevUrlWithRetry(attempt = 0) {
  if (!mainWindow) return;
  mainWindow.loadURL(DEV_URL).catch(() => {
    if (attempt > 50) return; // ~15s of retrying, generous for a cold `vite` start
    setTimeout(() => loadDevUrlWithRetry(attempt + 1), 300);
  });
}

// ---------------------------------------------------------------------------
// Tab lifecycle -- mirrors PlourxBrowserEnginePlugin.java's shape closely so
// the two are easy to compare: one native view per tab, attached/detached
// from the chrome window instead of Android's setVisibility(VISIBLE/GONE)
// (WebContentsView has no reliable setVisible of its own).
// ---------------------------------------------------------------------------

function createTabInternal(tabId) {
  let tab = tabs.get(tabId);
  if (tab) return tab;

  const view = new WebContentsView({ webPreferences: lockedDownWebPreferences() });
  tab = { view, lastUrl: '', progressTimer: null, attached: false, lastActiveAt: Date.now() };
  tabs.set(tabId, tab);

  const wc = view.webContents;

  wc.setWindowOpenHandler(({ url }) => {
    sendEngineEvent('newWindowRequested', { tabId, url });
    return { action: 'deny' };
  });

  wc.on('did-start-navigation', (_e, url, isInPlace, isMainFrame) => {
    if (!isMainFrame || isInPlace) return;
    sendEngineEvent('pageStarted', {
      tabId,
      url,
      title: wc.getTitle(),
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
    });
  });
  wc.on('did-start-loading', () => startProgress(tabId));
  wc.on('dom-ready', () => bumpProgress(tabId, 0.55));
  wc.on('did-stop-loading', () => finishProgress(tabId));
  wc.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 /* ERR_ABORTED: a real cancel/redirect, not a failure */) return;
    stopProgressTimer(tabId);
    sendEngineEvent('errorReceived', { tabId, errorCode, description: errorDescription, failingUrl: validatedURL });
  });
  wc.on('did-navigate', () => emitNavState(tabId));
  wc.on('did-navigate-in-page', () => emitNavState(tabId));
  wc.on('did-finish-load', () => {
    const url = wc.getURL();
    tab.lastUrl = url;
    sendEngineEvent('pageFinished', {
      tabId,
      url,
      title: wc.getTitle(),
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
    });
  });
  wc.on('page-title-updated', (_e, title) => sendEngineEvent('titleChanged', { tabId, title }));
  wc.on('page-favicon-updated', (_e, favicons) => {
    if (favicons && favicons[0]) void emitFavicon(tabId, favicons[0]);
  });
  wc.on('found-in-page', (_e, result) => {
    sendFindResult({ activeMatchOrdinal: result.activeMatchOrdinal, matches: result.matches });
  });
  wc.on('render-process-gone', () => {
    stopProgressTimer(tabId);
    tabs.delete(tabId);
    sendEngineEvent('tabCrashed', { tabId });
  });

  registerAccelerators(wc);

  return tab;
}

function emitNavState(tabId) {
  const tab = tabs.get(tabId);
  if (!tab) return;
  const wc = tab.view.webContents;
  tab.lastUrl = wc.getURL();
  sendEngineEvent('navigationStateChanged', {
    tabId,
    canGoBack: wc.navigationHistory.canGoBack(),
    canGoForward: wc.navigationHistory.canGoForward(),
  });
}

/** Fetches and re-encodes the favicon as base64 PNG bytes so the payload shape matches Android's faviconChanged exactly -- best-effort, matching Android's own "skip if unavailable" behavior. */
async function emitFavicon(tabId, faviconUrl) {
  try {
    const response = await net.fetch(faviconUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    sendEngineEvent('faviconChanged', { tabId, faviconBase64Png: buffer.toString('base64') });
  } catch {
    // favicon 404s, redirects to non-image content, etc. -- not worth surfacing as an error
  }
}

// ---- Progress heuristic (Electron has no native onProgressChanged) ----

function startProgress(tabId) {
  const tab = tabs.get(tabId);
  if (!tab) return;
  stopProgressTimer(tabId);
  let progress = 0.08;
  sendEngineEvent('progressChanged', { tabId, progress: Math.round(progress * 100) });
  tab.progressTimer = setInterval(() => {
    progress += (0.9 - progress) * 0.1;
    sendEngineEvent('progressChanged', { tabId, progress: Math.round(progress * 100) });
  }, 200);
}

function bumpProgress(tabId, value) {
  const tab = tabs.get(tabId);
  if (!tab || !tab.progressTimer) return;
  sendEngineEvent('progressChanged', { tabId, progress: Math.round(value * 100) });
}

function finishProgress(tabId) {
  stopProgressTimer(tabId);
  sendEngineEvent('progressChanged', { tabId, progress: 100 });
}

function stopProgressTimer(tabId) {
  const tab = tabs.get(tabId);
  if (tab?.progressTimer) {
    clearInterval(tab.progressTimer);
    tab.progressTimer = null;
  }
}

// ---- Attach/detach/bounds/close ----

function setBoundsForTab(tabId, bounds) {
  const tab = tabs.get(tabId);
  if (!tab || !mainWindow) return;
  // Electron View bounds are already in the window's own DIP/CSS-px
  // coordinate space (same units as getBoundingClientRect()) -- unlike
  // Android there is no device-density multiplication step here.
  const [contentWidth, contentHeight] = mainWindow.getContentSize();
  const width = Math.max(0, Math.round(contentWidth - bounds.left - bounds.right));
  const height = Math.max(0, Math.round(contentHeight - bounds.top - bounds.bottom));
  tab.view.setBounds({ x: Math.round(bounds.left), y: Math.round(bounds.top), width, height });
}

function setVisibleInternal(tabId, visible) {
  const tab = tabs.get(tabId);
  if (!tab || !mainWindow) return;
  if (visible) {
    if (!tab.attached) {
      mainWindow.contentView.addChildView(tab.view);
      tab.attached = true;
    }
    visibleTabId = tabId;
  } else if (tab.attached) {
    mainWindow.contentView.removeChildView(tab.view);
    tab.attached = false;
  }
}

function switchToTabInternal(tabId, urlHint) {
  if (!mainWindow) return;
  let tab = tabs.get(tabId);
  if (!tab) {
    tab = createTabInternal(tabId);
    if (urlHint) {
      tab.lastUrl = urlHint;
      tab.view.webContents.loadURL(urlHint).catch(() => {});
    }
  }
  for (const [id, other] of tabs) {
    if (id !== tabId && other.attached) {
      mainWindow.contentView.removeChildView(other.view);
      other.attached = false;
    }
  }
  if (!tab.attached) {
    mainWindow.contentView.addChildView(tab.view);
    tab.attached = true;
  }
  visibleTabId = tabId;
  tab.lastActiveAt = Date.now();
  enforceSoftCap(tabId);
}

function closeTabInternal(tabId) {
  const tab = tabs.get(tabId);
  if (!tab) return;
  stopProgressTimer(tabId);
  if (tab.attached && mainWindow) mainWindow.contentView.removeChildView(tab.view);
  tab.view.webContents.close();
  tabs.delete(tabId);
  if (visibleTabId === tabId) visibleTabId = null;
}

/** Generous soft cap, not Android's tight suspend pool -- only evicts tabs that are neither active nor currently visible. */
function enforceSoftCap(activeTabId) {
  if (tabs.size <= MAX_ALIVE_TABS) return;
  const evictable = [...tabs.entries()].filter(([id, tab]) => id !== activeTabId && !tab.attached).sort((a, b) => a[1].lastActiveAt - b[1].lastActiveAt);
  for (const [id] of evictable) {
    if (tabs.size <= MAX_ALIVE_TABS) break;
    closeTabInternal(id);
  }
}

// ---------------------------------------------------------------------------
// Downloads -- real files on disk via the OS's actual Downloads folder.
// ---------------------------------------------------------------------------

function setupDownloads(sess) {
  sess.on('will-download', (_event, item) => {
    const id = crypto.randomUUID();
    const filename = item.getFilename();
    const savePath = path.join(app.getPath('downloads'), filename);
    item.setSavePath(savePath);

    const record = {
      id,
      filename,
      url: item.getURL(),
      savePath,
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      state: 'progressing',
      item,
    };
    downloads.set(id, record);
    sendDownloadUpdate(record);

    item.on('updated', (_e, state) => {
      record.receivedBytes = item.getReceivedBytes();
      record.totalBytes = item.getTotalBytes();
      record.state = state === 'interrupted' ? 'interrupted' : 'progressing';
      sendDownloadUpdate(record);
    });
    item.once('done', (_e, state) => {
      record.state = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted';
      sendDownloadUpdate(record);
    });
  });
}

function setupPermissions(sess) {
  sess.setPermissionRequestHandler((webContents, permission, callback) => {
    const tabId = [...tabs.entries()].find(([, tab]) => tab.view.webContents === webContents)?.[0];
    if (tabId) sendEngineEvent('permissionRequested', { tabId, resources: [permission] });
    callback(false);
  });
}

// ---------------------------------------------------------------------------
// IPC -- every handler validates its own inputs; the main process never
// trusts renderer-supplied data blindly.
// ---------------------------------------------------------------------------

function isValidTabId(tabId) {
  return typeof tabId === 'string' && tabId.length > 0;
}

ipcMain.handle(channels.TAB_CREATE, (_e, tabId) => {
  if (isValidTabId(tabId)) createTabInternal(tabId);
});

ipcMain.handle(channels.TAB_LOAD_URL, (_e, tabId, url) => {
  if (!isValidTabId(tabId) || typeof url !== 'string') return;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  // Matches Android's shouldOverrideUrlLoading scheme allowlist: only http(s)
  // navigates in a tab view; anything else is simply not actioned here.
  if (!ALLOWED_NAV_SCHEMES.has(parsed.protocol)) return;
  const tab = createTabInternal(tabId);
  tab.lastUrl = url;
  tab.view.webContents.loadURL(url).catch(() => {});
});

ipcMain.handle(channels.TAB_GO_BACK, (_e, tabId) => tabs.get(tabId)?.view.webContents.navigationHistory.goBack());
ipcMain.handle(channels.TAB_GO_FORWARD, (_e, tabId) => tabs.get(tabId)?.view.webContents.navigationHistory.goForward());
ipcMain.handle(channels.TAB_RELOAD, (_e, tabId) => tabs.get(tabId)?.view.webContents.reload());
ipcMain.handle(channels.TAB_STOP, (_e, tabId) => tabs.get(tabId)?.view.webContents.stop());
ipcMain.handle(channels.TAB_SET_VIEWPORT_BOUNDS, (_e, tabId, bounds) => setBoundsForTab(tabId, bounds));
ipcMain.handle(channels.TAB_SET_VISIBLE, (_e, tabId, visible) => setVisibleInternal(tabId, Boolean(visible)));
ipcMain.handle(channels.TAB_SWITCH_TO, (_e, tabId, url) => {
  if (isValidTabId(tabId)) switchToTabInternal(tabId, typeof url === 'string' ? url : undefined);
});
ipcMain.handle(channels.TAB_CLOSE, (_e, tabId) => closeTabInternal(tabId));
ipcMain.handle(channels.TAB_GET_SNAPSHOT, async (_e, tabId) => {
  const tab = tabs.get(tabId);
  if (!tab) return null;
  const image = await tab.view.webContents.capturePage();
  return image.toPNG().toString('base64');
});
ipcMain.handle(channels.TAB_EVALUATE_JS, async (_e, tabId, script) => {
  const tab = tabs.get(tabId);
  if (!tab || typeof script !== 'string') return null;
  try {
    const result = await tab.view.webContents.executeJavaScript(script);
    return result == null ? null : String(result);
  } catch {
    return null;
  }
});

ipcMain.handle(channels.SHELL_OPEN_EXTERNAL, (_e, url) => {
  if (typeof url !== 'string') return;
  try {
    const parsed = new URL(url);
    if (!ALLOWED_EXTERNAL_SCHEMES.has(parsed.protocol)) return;
  } catch {
    return;
  }
  return shell.openExternal(url);
});
ipcMain.handle(channels.SHELL_COPY_LINK, (_e, url) => {
  if (typeof url === 'string') clipboard.writeText(url);
});

ipcMain.on(channels.FIND_START, (_e, query, forward) => {
  if (!visibleTabId || typeof query !== 'string') return;
  const tab = tabs.get(visibleTabId);
  if (!tab) return;
  if (!query) {
    tab.view.webContents.stopFindInPage('clearSelection');
    return;
  }
  tab.view.webContents.findInPage(query, { forward: forward !== false });
});
ipcMain.on(channels.FIND_STOP, () => {
  if (!visibleTabId) return;
  tabs.get(visibleTabId)?.view.webContents.stopFindInPage('clearSelection');
});

ipcMain.handle(channels.DOWNLOADS_LIST, () => [...downloads.values()].map(({ item: _item, ...rest }) => rest));
ipcMain.handle(channels.DOWNLOADS_CANCEL, (_e, id) => downloads.get(id)?.item.cancel());
ipcMain.handle(channels.DOWNLOADS_OPEN, (_e, id) => {
  const record = downloads.get(id);
  if (record) return shell.openPath(record.savePath);
});
ipcMain.handle(channels.DOWNLOADS_SHOW_IN_FOLDER, (_e, id) => {
  const record = downloads.get(id);
  if (record) shell.showItemInFolder(record.savePath);
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createMainWindow();
  setupDownloads(session.defaultSession);
  setupPermissions(session.defaultSession);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
