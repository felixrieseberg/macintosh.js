const { ipcMain, app } = require('electron');

function registerIpcHandlers() {
  ipcMain.handle('quit', () => app.quit())
}

module.exports = {
  registerIpcHandlers
}
