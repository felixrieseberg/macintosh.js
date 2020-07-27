const { ipcMain, app, BrowserWindow } = require("electron");

function registerIpcHandlers() {
  ipcMain.handle("quit", () => app.quit());

  ipcMain.handle("devtools", () => {
    BrowserWindow.getAllWindows().forEach((w) =>
      w.webContents.toggleDevTools()
    );
  });
}

module.exports = {
  registerIpcHandlers,
};
