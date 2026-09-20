// Runs in an isolated context (contextIsolation: true) with Node access,
// but exposes ONLY this named, typed surface to the chrome renderer via
// contextBridge -- never a generic ipcRenderer passthrough. Per-tab
// WebContentsViews (the ones rendering arbitrary web content) get NO
// preload at all, so this bridge is unreachable from any loaded page.
const { contextBridge, ipcRenderer } = require('electron');
// Sandboxed preload scripts (sandbox: true) can only require Electron/Node
// built-ins, NOT arbitrary local files -- `require('./ipcChannels.cjs')`
// fails with "module not found" at runtime despite looking fine statically.
// These are duplicated from ipcChannels.cjs (which main.cjs, running
// unsandboxed, requires normally) -- keep the two in sync on any change.
const channels = {
  TAB_CREATE: 'tab:create',
  TAB_LOAD_URL: 'tab:loadUrl',
  TAB_GO_BACK: 'tab:goBack',
  TAB_GO_FORWARD: 'tab:goForward',
  TAB_RELOAD: 'tab:reload',
  TAB_STOP: 'tab:stop',
  TAB_SET_VIEWPORT_BOUNDS: 'tab:setViewportBounds',
  TAB_SET_VISIBLE: 'tab:setVisible',
  TAB_SWITCH_TO: 'tab:switchTo',
  TAB_CLOSE: 'tab:close',
  TAB_GET_SNAPSHOT: 'tab:getSnapshot',
  TAB_EVALUATE_JS: 'tab:evaluateJavascript',
  SHELL_OPEN_EXTERNAL: 'shell:openExternal',
  SHELL_COPY_LINK: 'shell:copyLink',
  FIND_START: 'find:start',
  FIND_STOP: 'find:stop',
  DOWNLOADS_LIST: 'downloads:list',
  DOWNLOADS_CANCEL: 'downloads:cancel',
  DOWNLOADS_OPEN: 'downloads:open',
  DOWNLOADS_SHOW_IN_FOLDER: 'downloads:showInFolder',
  ENGINE_EVENT: 'engine:event',
  ACCELERATOR: 'accelerator',
  FIND_RESULT: 'find:result',
  DOWNLOADS_UPDATED: 'downloads:updated',
};

function invoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

/** Subscribes to a main->renderer event channel, returns a synchronous unsubscribe function. */
function subscribe(channel, handler) {
  const listener = (_event, payload) => handler(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

// useTabEngineEvents.ts subscribes to ~11 distinct engine event names, all
// carried over the single ENGINE_EVENT ipc channel -- registering a
// separate ipcRenderer.on() per event name would put 11 raw listeners on
// that one channel and trip Node's default max-listeners warning. Instead,
// one shared listener fans out to per-event-name handler sets.
const engineEventHandlers = new Map(); // eventName -> Set<handler>
ipcRenderer.on(channels.ENGINE_EVENT, (_event, payload) => {
  const handlers = payload && engineEventHandlers.get(payload.event);
  if (handlers) handlers.forEach((handler) => handler(payload.data));
});

function subscribeEngineEvent(eventName, handler) {
  let handlers = engineEventHandlers.get(eventName);
  if (!handlers) {
    handlers = new Set();
    engineEventHandlers.set(eventName, handlers);
  }
  handlers.add(handler);
  return () => handlers.delete(handler);
}

contextBridge.exposeInMainWorld('plourxDesktop', {
  createTab: (tabId) => invoke(channels.TAB_CREATE, tabId),
  loadUrl: (tabId, url) => invoke(channels.TAB_LOAD_URL, tabId, url),
  goBack: (tabId) => invoke(channels.TAB_GO_BACK, tabId),
  goForward: (tabId) => invoke(channels.TAB_GO_FORWARD, tabId),
  reload: (tabId) => invoke(channels.TAB_RELOAD, tabId),
  stop: (tabId) => invoke(channels.TAB_STOP, tabId),
  setViewportBounds: (tabId, bounds) => invoke(channels.TAB_SET_VIEWPORT_BOUNDS, tabId, bounds),
  setVisible: (tabId, visible) => invoke(channels.TAB_SET_VISIBLE, tabId, visible),
  switchToTab: (tabId, url) => invoke(channels.TAB_SWITCH_TO, tabId, url),
  closeTab: (tabId) => invoke(channels.TAB_CLOSE, tabId),
  getTabSnapshot: (tabId) => invoke(channels.TAB_GET_SNAPSHOT, tabId),
  evaluateJavascript: (tabId, script) => invoke(channels.TAB_EVALUATE_JS, tabId, script),
  openInSystemBrowser: (url) => invoke(channels.SHELL_OPEN_EXTERNAL, url),
  copyLink: (url) => invoke(channels.SHELL_COPY_LINK, url),

  findInPage: (query, forward) => ipcRenderer.send(channels.FIND_START, query, forward),
  stopFindInPage: () => ipcRenderer.send(channels.FIND_STOP),

  listDownloads: () => invoke(channels.DOWNLOADS_LIST),
  cancelDownload: (id) => invoke(channels.DOWNLOADS_CANCEL, id),
  openDownload: (id) => invoke(channels.DOWNLOADS_OPEN, id),
  showDownloadInFolder: (id) => invoke(channels.DOWNLOADS_SHOW_IN_FOLDER, id),

  onEngineEvent: (event, handler) => subscribeEngineEvent(event, handler),
  onAccelerator: (handler) => subscribe(channels.ACCELERATOR, handler),
  onFindResult: (handler) => subscribe(channels.FIND_RESULT, handler),
  onDownloadUpdated: (handler) => subscribe(channels.DOWNLOADS_UPDATED, handler),
});
