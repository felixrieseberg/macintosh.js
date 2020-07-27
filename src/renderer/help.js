const { shell, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const homedir = require('os').homedir();
const macDir = path.join(homedir, 'macintosh.js');

let isDevTools;

// Setup dev mode
function fetchIsDevTools() {
  ipcRenderer.invoke('getIsDevMode').then((result) => {
    isDevTools = result;

    if (result) {
      devtools.innerHTML = 'Disable developer tools';
    } else {
      devtools.innerHTML = 'Enable developer tools';
    }
  });
}

user_dir.onclick = user_dir2.onclick = () => {
  if (!fs.existsSync(macDir)) {
    fs.mkdirSync(macDir);
  }

  shell.showItemInFolder(macDir);
}

devtools.onclick = async () => {
  await ipcRenderer.invoke('setIsDevMode', !isDevTools);
  fetchIsDevTools();
}

fetchIsDevTools();
