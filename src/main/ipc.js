const { ipcMain, app, BrowserWindow, dialog } = require("electron");
const { setIsDevMode, getIsDevMode } = require("./devmode");
const { getMainWindow } = require("./windows");

function registerIpcHandlers() {
  ipcMain.handle("quit", () => app.quit());

  ipcMain.handle("devtools", () => {
    BrowserWindow.getAllWindows().forEach((w) =>
      w.webContents.toggleDevTools()
    );
  });

  ipcMain.handle("getIsDevMode", () => getIsDevMode());

  ipcMain.handle("setIsDevMode", (_event, set) => {
    setIsDevMode(set);
  });

  ipcMain.handle("showMessageBox", (_event, options) => {
    const mainWindow = getMainWindow();
    return dialog.showMessageBox(mainWindow, options);
  });

  ipcMain.handle("showMessageBoxSync", (_event, options) => {
    const mainWindow = getMainWindow();
    return dialog.showMessageBoxSync(mainWindow, options);
  });

  ipcMain.handle("getAppVersion", () => {
    return app.getVersion();
  });

  ipcMain.handle("getUserDataPath", () => {
    return app.getPath("userData");
  });
}

module.exports = {
  registerIpcHandlers,
};
