const { ipcRenderer } = require('electron');

module.exports = {
  quit() {
    ipcRenderer.invoke('quit');
  }
}
