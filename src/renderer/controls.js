const { quit, devtools } = require("./ipc");

function registerControls() {
  document.querySelector("#close").addEventListener("click", () => {
    quit();
  });

  document.querySelector("#devtools").addEventListener("click", () => {
    devtools();
  });
}

registerControls();
