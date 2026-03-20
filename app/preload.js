const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gbe', {
  listApps: () => ipcRenderer.invoke('gbe:list'),
  registerApp: (payload) => ipcRenderer.invoke('gbe:register', payload),
  removeApp: (name) => ipcRenderer.invoke('gbe:remove', name),
  chooseFolder: () => ipcRenderer.invoke('gbe:choose-folder'),
  resolveApp: (name) => ipcRenderer.invoke('gbe:resolve-app', name),
  resolvePath: (filePath) => ipcRenderer.invoke('gbe:resolve-path', filePath),
  openExternal: (url) => ipcRenderer.invoke('gbe:open-external', url),
  installUpdate: () => ipcRenderer.invoke('gbe:update-install'),
  onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', (_e, info) => cb(info)),
  onUpdateError: (cb) => ipcRenderer.on('update:error', (_e, err) => cb(err))
});
