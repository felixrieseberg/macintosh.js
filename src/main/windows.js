const { BrowserWindow, shell } = require("electron");
const path = require("path");

const { getIsDevMode } = require("./devmode");

const windowList = {};
let mainWindow;

function getMainWindow() {
  return mainWindow;
}

function handleNewWindow(event, url, frameName, disposition, options) {
  // open window as modal
  event.preventDefault();

  // Don't open the same window multiple times
  if (windowList[url]) {
    windowList[url].focus();
    return;
  }

  Object.assign(options, {
    parent: mainWindow,
    width: 350,
    height: 630,
    frame: true,
    transparent: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      navigateOnDragDrop: false,
    },
  });

  let newWindow = new BrowserWindow(options);

  newWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  event.newGuest = newWindow;
  newWindow.setMenu(null);
  windowList[url] = newWindow;

  if (getIsDevMode()) {
    newWindow.webContents.toggleDevTools();
  }

  newWindow.on("closed", () => {
    delete windowList[url];
  });
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 730,
    useContentSize: true,
    frame: true,
    transparent: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      nativeWindowOpen: true,
      contextIsolation: false,
      navigateOnDragDrop: false,
      nodeIntegrationInWorker: true,
      sandbox: false,
    },
  });

  // Ensure that we have access to SharedArrayBuffer
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      details.responseHeaders["Cross-Origin-Opener-Policy"] = ["same-origin"];
      details.responseHeaders["Cross-Origin-Embedder-Policy"] = [
        "require-corp",
      ];
      callback({ responseHeaders: details.responseHeaders });
    }
  );

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  // Disable menu
  mainWindow.setMenu(null);

  // Ensure we create child windows with the correct settings
  mainWindow.webContents.on("new-window", handleNewWindow);

  if (getIsDevMode()) {
    mainWindow.webContents.toggleDevTools();
  }
}

module.exports = {
  createWindow,
  getMainWindow,
};
