const { app } = require("electron");

function setupUpdates() {
  if (app.isPackaged && process.platform !== "linux") {
    require("update-electron-app")({
      repo: "felixrieseberg/macintosh.js",
      updateInterval: "1 hour",
    });
  }
}

module.exports = {
  setupUpdates,
};
