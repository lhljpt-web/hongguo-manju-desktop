"use strict";

// src/main/preload.ts
var import_electron = require("electron");
var api = {
  bufferEpisodes: (ids) => import_electron.ipcRenderer.invoke("buffer-episodes", ids),
  bufferState: () => import_electron.ipcRenderer.invoke("buffer-state"),
  retryBuffer: () => import_electron.ipcRenderer.invoke("buffer-retry"),
  cacheState: () => import_electron.ipcRenderer.invoke("cache-state"),
  cacheAdd: (id) => import_electron.ipcRenderer.invoke("cache-add", id),
  cacheAction: (id, action) => import_electron.ipcRenderer.invoke("cache-action", id, action),
  cacheConcurrency: (value) => import_electron.ipcRenderer.invoke("cache-concurrency", value),
  cacheSegments: (value) => import_electron.ipcRenderer.invoke("cache-segments", value),
  cacheDecodeLevel: (value) => import_electron.ipcRenderer.invoke("cache-decode-level", value),
  cacheDecodeMode: (value) => import_electron.ipcRenderer.invoke("cache-decode-mode", value),
  networkCheck: () => import_electron.ipcRenderer.invoke("network-check"),
  swipeFeed: (category, refresh) => import_electron.ipcRenderer.invoke("swipe-feed", category, refresh),
  swipePrefs: (value) => import_electron.ipcRenderer.invoke("swipe-prefs", value),
  capabilities: (value) => import_electron.ipcRenderer.invoke("capabilities", value),
  hgLog: (msg) => import_electron.ipcRenderer.invoke("hg-log", String(msg)),
  hgFullscreen: () => import_electron.ipcRenderer.invoke("hg-fullscreen"),
  cacheDeleteWatched: () => import_electron.ipcRenderer.invoke("cache-delete-watched"),
  recommendations: (id, refresh) => import_electron.ipcRenderer.invoke("recommendations", id, refresh),
  cacheLimits: (value) => import_electron.ipcRenderer.invoke("cache-limits", value),
  cachePriority: (id, priority) => import_electron.ipcRenderer.invoke("cache-priority", id, priority),
  videoQuality: (quality) => import_electron.ipcRenderer.invoke("video-quality", quality),
  exportDiagnostics: () => import_electron.ipcRenderer.invoke("diagnostics-export"),
  cacheChooseDirectory: () => import_electron.ipcRenderer.invoke("cache-directory"),
  cacheOpenDirectory: () => import_electron.ipcRenderer.invoke("cache-open-directory"),
  cacheCloseToTray: (enabled) => import_electron.ipcRenderer.invoke("cache-close-to-tray", enabled),
  onBackground: (listener) => {
    const handler = (_event, background) => listener(background);
    import_electron.ipcRenderer.on("window-background", handler);
    return () => {
      import_electron.ipcRenderer.removeListener("window-background", handler);
    };
  },
  catalog: (board, offset) => import_electron.ipcRenderer.invoke("catalog", board, offset),
  search: (query, offset) => import_electron.ipcRenderer.invoke("search", query, offset),
  importShare: (text) => import_electron.ipcRenderer.invoke("share", text),
  series: (id) => import_electron.ipcRenderer.invoke("series", id),
  playback: (id, force, quality) => import_electron.ipcRenderer.invoke("playback", id, force, quality),
  library: () => import_electron.ipcRenderer.invoke("library"),
  favorite: (work, enabled) => import_electron.ipcRenderer.invoke("favorite", work, enabled),
  progress: (value) => import_electron.ipcRenderer.invoke("progress", value),
  checkUpdate: () => import_electron.ipcRenderer.invoke("update"),
  updateState: () => import_electron.ipcRenderer.invoke("update-state"),
  downloadUpdate: () => import_electron.ipcRenderer.invoke("update-download"),
  installUpdate: () => import_electron.ipcRenderer.invoke("update-install"),
  onUpdate: (listener) => {
    const handler = (_event, state) => listener(state);
    import_electron.ipcRenderer.on("update-status", handler);
    return () => {
      import_electron.ipcRenderer.removeListener("update-status", handler);
    };
  }
};
import_electron.contextBridge.exposeInMainWorld("desktop", api);
