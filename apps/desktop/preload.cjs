const { contextBridge, ipcRenderer } = require('electron');



const storageApi = {

  init: () => ipcRenderer.invoke('storage:init'),

  getAll: (entity) => ipcRenderer.invoke('storage:getAll', entity),

  upsert: (entity, items) => ipcRenderer.invoke('storage:upsert', entity, items),

  remove: (entity, id) => ipcRenderer.invoke('storage:remove', entity, id),

  replaceAll: (entity, items) => ipcRenderer.invoke('storage:replaceAll', entity, items),

  getCache: (pathKey) => ipcRenderer.invoke('storage:getCache', pathKey),

  setCache: (pathKey, data) => ipcRenderer.invoke('storage:setCache', pathKey, data),

  getSyncQueue: () => ipcRenderer.invoke('storage:getSyncQueue'),

  getSyncQueueStats: () => ipcRenderer.invoke('storage:getSyncQueueStats'),

  addToSyncQueue: (item) => ipcRenderer.invoke('storage:addToSyncQueue', item),

  markSyncQueueSynced: (ids) => ipcRenderer.invoke('storage:markSyncQueueSynced', ids),

  markSyncQueueFailed: (id, errorMessage) => ipcRenderer.invoke('storage:markSyncQueueFailed', id, errorMessage),

  resetFailedSyncQueue: () => ipcRenderer.invoke('storage:resetFailedSyncQueue'),

  clearFailedSyncQueue: () => ipcRenderer.invoke('storage:clearFailedSyncQueue'),

  addSyncLog: (entry) => ipcRenderer.invoke('storage:addSyncLog', entry),

  getSyncLogs: (limit) => ipcRenderer.invoke('storage:getSyncLogs', limit),

  setIdMapping: (localId, moduleName, serverId) =>

    ipcRenderer.invoke('storage:setIdMapping', localId, moduleName, serverId),

  getIdMapping: (localId, moduleName) => ipcRenderer.invoke('storage:getIdMapping', localId, moduleName),

  getSyncMetadata: () => ipcRenderer.invoke('storage:getSyncMetadata'),

  updateSyncMetadata: (updates) => ipcRenderer.invoke('storage:updateSyncMetadata', updates),

};



contextBridge.exposeInMainWorld('electronAPI', {

  platform: process.platform,

  isDesktop: true,

  apiUrl: process.env.API_URL || 'http://localhost:3001/api',

  storage: storageApi,

});

