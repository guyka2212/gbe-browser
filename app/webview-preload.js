const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gbe', {
  listApps: () => ipcRenderer.invoke('gbe:list'),
  registerApp: (payload) => ipcRenderer.invoke('gbe:register', payload),
  removeApp: (name) => ipcRenderer.invoke('gbe:remove', name),
  chooseFolder: () => ipcRenderer.invoke('gbe:choose-folder')
});
