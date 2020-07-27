const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const appDataPath = app.getPath("userData");
const devFilePath = path.join(appDataPath, "developer");

let isDevMode;

function getIsDevMode() {
  if (isDevMode !== undefined) {
    return isDevMode;
  }

  return (isDevMode = !app.isPackaged || fs.existsSync(devFilePath));
}

function setIsDevMode(set) {
  if (set && !getIsDevMode()) {
    fs.writeFileSync(
      devFilePath,
      `So you're a developer, huh? Neat! Welcome aboard!`
    );
  } else if (!set && getIsDevMode()) {
    fs.unlinkSync(devFilePath);
  }

  isDevMode = set;
}

module.exports = {
  getIsDevMode,
  setIsDevMode,
};
