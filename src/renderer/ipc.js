const { ipcRenderer } = require("electron");

module.exports = {
  quit() {
    ipcRenderer.invoke("quit");
  },

  devtools() {
    ipcRenderer.invoke("devtools");
  },

  getIsDevMode() {
    return ipcRenderer.invoke("getIsDevMode");
  },

  setIsDevMode() {
    return ipcRenderer.invoke("setIsDevMode");
  },

  getAppVersion() {
    return ipcRenderer.invoke("getAppVersion");
  },

  getUserDataPath() {
    return ipcRenderer.invoke("getUserDataPath");
  },
};
