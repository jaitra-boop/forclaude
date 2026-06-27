const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage } = require('electron')
const path = require('path')
const cron = require('node-cron')
const storage = require('./storage')

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 720,
    frame: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('blur', () => {
    // Uncomment to auto-hide on blur:
    // mainWindow.hide()
  })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  tray.setToolTip('Loupe')
  tray.on('click', () => {
    if (!mainWindow) {
      createWindow()
      mainWindow.show()
      return
    }
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      const trayBounds = tray.getBounds()
      const windowBounds = mainWindow.getBounds()
      const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
      const y = trayBounds.y > 400 ? trayBounds.y - windowBounds.height - 4 : trayBounds.y + trayBounds.height + 4
      mainWindow.setPosition(x, y)
      mainWindow.show()
      mainWindow.focus()
    }
  })

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Loupe', click: () => mainWindow && mainWindow.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setContextMenu(contextMenu)
}

function scheduleDailyNotification() {
  cron.schedule('0 9 * * *', () => {
    if (Notification.isSupported()) {
      new Notification({
        title: 'Loupe',
        body: 'Your daily Loupe is ready.'
      }).show()
    }
  })
}

// IPC handlers
ipcMain.handle('storage:read', () => storage.readData())

ipcMain.handle('storage:add-drop', (_, amount, element) => storage.addDrop(amount, element))

ipcMain.handle('storage:record-word', (_, word) => storage.recordWord(word))

ipcMain.handle('storage:update-history', (_, date, entry) => storage.updateHistory(date, entry))

ipcMain.handle('storage:update-streak', () => storage.updateStreak())

ipcMain.handle('window:close', () => mainWindow && mainWindow.hide())

ipcMain.handle('window:minimize', () => mainWindow && mainWindow.minimize())

app.whenReady().then(() => {
  createWindow()
  createTray()
  scheduleDailyNotification()
  mainWindow.show()
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})

app.on('activate', () => {
  if (mainWindow) mainWindow.show()
})
