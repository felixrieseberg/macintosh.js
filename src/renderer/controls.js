const { quit } = require("./ipc");

function registerControls() {
  document.querySelector('#close').addEventListener('click', () => {
    quit();
  });
}

registerControls();
