const { quit, devtools } = require("./ipc");
const { getIsWorkerRunning, getIsWorkerSaving } = require("./worker");
const { showCloseWarning } = require("./dialogs");

function registerControls() {
  document.querySelector("#close").addEventListener("click", () => {
    if (!getIsWorkerRunning()) {
      quit();
    } else if (!getIsWorkerSaving()) {
      showCloseWarning();
    } else {
      // We're saving, and we're doing nothing. We're making the user wait.
    }
  });

  document.querySelector("#devtools").addEventListener("click", () => {
    devtools();
  });
}

registerControls();
