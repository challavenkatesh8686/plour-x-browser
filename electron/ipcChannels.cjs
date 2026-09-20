// Required by main.cjs (unsandboxed, so a normal local require works fine).
// preload.cjs runs sandboxed and can't require arbitrary local files, so it
// keeps its own duplicated copy of these same string values -- if you add
// or rename a channel here, update preload.cjs's copy too.
module.exports = {
  // Request/response (ipcRenderer.invoke / ipcMain.handle)
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

  // Events (main -> renderer, via webContents.send + ipcRenderer.on)
  ENGINE_EVENT: 'engine:event',
  ACCELERATOR: 'accelerator',
  FIND_RESULT: 'find:result',
  DOWNLOADS_UPDATED: 'downloads:updated',
};
