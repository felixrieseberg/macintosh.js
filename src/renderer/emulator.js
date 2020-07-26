const { drawScreen } = require("./screen");
const { openAudio } = require("./audio");
const { tryToSendInput } = require("./input");
const { registerWorker } = require("./worker");

function asyncLoop() {
  drawScreen();
  tryToSendInput();
  requestAnimationFrame(asyncLoop);
}

function start() {
  registerWorker();
  openAudio();
  asyncLoop();
}

start();
