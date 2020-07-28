const { drawScreen } = require("./screen");
const { openAudio } = require("./audio");
const { tryToSendInput } = require("./input");
const { registerWorker, setCanvasBlank } = require("./worker");
const { setupDialogs } = require("./dialogs");

function asyncLoop() {
  drawScreen();
  tryToSendInput();
  requestAnimationFrame(asyncLoop);
}

async function start() {
  await registerWorker();
  setupDialogs();
  openAudio();
  asyncLoop();
}

start();
