const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('loupe', {
  readData: () => ipcRenderer.invoke('storage:read'),
  addDrop: (amount, element) => ipcRenderer.invoke('storage:add-drop', amount, element),
  recordWord: (word) => ipcRenderer.invoke('storage:record-word', word),
  updateHistory: (date, entry) => ipcRenderer.invoke('storage:update-history', date, entry),
  updateStreak: () => ipcRenderer.invoke('storage:update-streak'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize')
})
