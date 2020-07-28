const { app, BrowserWindow } = require("electron");

const { registerIpcHandlers } = require("./ipc");
const { createWindow } = require("./windows");
const { getIsDevMode } = require("./devmode");
const { shouldQuit } = require("./squirrel");
const { setupUpdates } = require("./update");
const { moveToAppFolderMaybe } = require("./appfolder");

async function onReady() {
  if (!getIsDevMode()) process.env.NODE_ENV = "production";

  moveToAppFolderMaybe();
  registerIpcHandlers();
  createWindow();
  setupUpdates();
}

/**
 * All windows have been closed, quit on anything but
 * macOS.
 */
function onWindowsAllClosed() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
}

function onActivate() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}

function main() {
  // Handle creating/removing shortcuts on Windows when
  // installing/uninstalling.
  if (shouldQuit()) {
    app.quit();
    return;
  }

  // Set the app's name
  app.setName("macintosh.js");

  // Launch
  app.on("ready", onReady);
  app.on("activate", onActivate);
  app.on("window-all-closed", onWindowsAllClosed);
}

main();
