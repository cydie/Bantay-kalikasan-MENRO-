const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const localDb = require('./db.cjs');

const isDev = !app.isPackaged;
const API_URL = process.env.API_URL || 'http://localhost:3001';

function registerStorageHandlers() {
  ipcMain.handle('storage:init', () => localDb.init());

  ipcMain.handle('storage:getAll', (_event, entity) => localDb.getAll(entity));

  ipcMain.handle('storage:upsert', async (_event, entity, items) => {
    await localDb.upsert(entity, items);
  });

  ipcMain.handle('storage:remove', async (_event, entity, id) => {
    await localDb.remove(entity, id);
  });

  ipcMain.handle('storage:replaceAll', async (_event, entity, items) => {
    await localDb.replaceAll(entity, items);
  });

  ipcMain.handle('storage:getCache', (_event, pathKey) => localDb.getCache(pathKey));

  ipcMain.handle('storage:setCache', async (_event, pathKey, data) => {
    await localDb.setCache(pathKey, data);
  });

  ipcMain.handle('storage:getSyncQueue', () => localDb.getSyncQueue());

  ipcMain.handle('storage:getSyncQueueStats', () => localDb.getSyncQueueStats());

  ipcMain.handle('storage:addToSyncQueue', async (_event, item) => {
    await localDb.addToSyncQueue(item);
  });

  ipcMain.handle('storage:markSyncQueueSynced', async (_event, ids) => {
    await localDb.markSyncQueueSynced(ids);
  });

  ipcMain.handle('storage:markSyncQueueFailed', async (_event, id, errorMessage) => {
    await localDb.markSyncQueueFailed(id, errorMessage);
  });

  ipcMain.handle('storage:resetFailedSyncQueue', async () => {
    await localDb.resetFailedSyncQueue();
  });

  ipcMain.handle('storage:clearFailedSyncQueue', async () => {
    await localDb.clearFailedSyncQueue();
  });

  ipcMain.handle('storage:addSyncLog', async (_event, entry) => {
    await localDb.addSyncLog(entry);
  });

  ipcMain.handle('storage:getSyncLogs', (_event, limit) => localDb.getSyncLogs(limit));

  ipcMain.handle('storage:setIdMapping', async (_event, localId, moduleName, serverId) => {
    await localDb.setIdMapping(localId, moduleName, serverId);
  });

  ipcMain.handle('storage:getIdMapping', (_event, localId, moduleName) =>
    localDb.getIdMapping(localId, moduleName)
  );

  ipcMain.handle('storage:getSyncMetadata', () => localDb.getSyncMetadata());

  ipcMain.handle('storage:updateSyncMetadata', async (_event, updates) => {
    await localDb.updateSyncMetadata(updates);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 380,
    minHeight: 600,
    title: 'Bantay Kalikasan MENRO',
    backgroundColor: '#f9fafb',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../web/dist/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  registerStorageHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  localDb.close();
});

module.exports = { API_URL };
