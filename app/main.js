const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store({
  name: 'gbe-apps',
  defaults: {
    apps: {}
  }
});

let mainWindow;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Gbe Browser',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
  return win;
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update:available', info);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update:downloaded', info);
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('update:error', err?.message || 'Update error');
    }
  });

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  mainWindow = createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('gbe:list', () => {
  return store.get('apps') || {};
});

ipcMain.handle('gbe:register', (event, { name, folder }) => {
  if (!name || !folder) {
    throw new Error('Missing name or folder');
  }

  const apps = store.get('apps') || {};
  apps[name] = folder;
  store.set('apps', apps);
  return apps;
});

ipcMain.handle('gbe:remove', (event, name) => {
  const apps = store.get('apps') || {};
  delete apps[name];
  store.set('apps', apps);
  return apps;
});

ipcMain.handle('gbe:choose-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('gbe:resolve-app', (event, name) => {
  const apps = store.get('apps') || {};
  return apps[name] || null;
});

ipcMain.handle('gbe:resolve-path', (event, filePath) => {
  if (!filePath) return null;
  const safePath = path.resolve(filePath);
  if (!fs.existsSync(safePath)) return null;
  return safePath;
});

ipcMain.handle('gbe:open-external', (event, url) => {
  if (!url) return false;
  shell.openExternal(url);
  return true;
});

ipcMain.handle('gbe:update-install', () => {
  autoUpdater.quitAndInstall();
  return true;
});
