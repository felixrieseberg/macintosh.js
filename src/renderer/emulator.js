const { drawScreen } = require('./screen');
const { openAudio } = require('./audio');
const { tryToSendInput } = require('./input');
const { registerWorker } = require('./worker');

registerWorker();

function asyncLoop() {
  drawScreen();
  tryToSendInput();
  requestAnimationFrame(asyncLoop);
}

function start() {
  openAudio();
  asyncLoop();
}

start();
