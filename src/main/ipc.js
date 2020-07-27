const { ipcMain, app, BrowserWindow } = require("electron");
const { setIsDevMode, getIsDevMode } = require("./devmode");

function registerIpcHandlers() {
  ipcMain.handle("quit", () => app.quit());

  ipcMain.handle("devtools", () => {
    BrowserWindow.getAllWindows().forEach((w) =>
      w.webContents.toggleDevTools()
    );
  });

  ipcMain.handle("getIsDevMode", () => getIsDevMode());

  ipcMain.handle("setIsDevMode", (event, set) => {
    setIsDevMode(set);
  });
}

module.exports = {
  registerIpcHandlers,
};
