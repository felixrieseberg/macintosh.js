const { shell, ipcRenderer } = require("electron");
const path = require("path");

const { getAppVersion } = require("./ipc");

async function credits() {
  license.onclick = () => {
    const licensePath = path.join(__dirname, "../basilisk/LICENSE.txt");
    shell.openPath(licensePath);
  };

  const version = await getAppVersion();
  document.querySelector(
    "#versions"
  ).innerHTML = `macintosh.js v${version} with Electron v${process.versions.electron}`;
}

credits();
