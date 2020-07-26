const { inputBuffer, INPUT_BUFFER_SIZE } = require("./input");
const { videoModeBuffer, VIDEO_MODE_BUFFER_SIZE } = require("./video");
const {
  screenBuffer,
  SCREEN_BUFFER_SIZE,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} = require("./screen");
const {
  audio,
  audioDataBuffer,
  audioBlockChunkSize,
  AUDIO_DATA_BUFFER_SIZE,
} = require("./audio");

function registerWorker() {
  var workerConfig = {
    inputBuffer: inputBuffer,
    inputBufferSize: INPUT_BUFFER_SIZE,
    screenBuffer: screenBuffer,
    screenBufferSize: SCREEN_BUFFER_SIZE,
    videoModeBuffer: videoModeBuffer,
    videoModeBufferSize: VIDEO_MODE_BUFFER_SIZE,
    audioDataBuffer: audioDataBuffer,
    audioDataBufferSize: AUDIO_DATA_BUFFER_SIZE,
    audioBlockBufferSize: audio.bufferSize,
    audioBlockChunkSize: audioBlockChunkSize,
    SCREEN_WIDTH: SCREEN_WIDTH,
    SCREEN_HEIGHT: SCREEN_HEIGHT,
  };

  var worker = window.emulatorWorker = new Worker("../basilisk/BasiliskII-worker-boot.js");

  worker.postMessage(workerConfig);
  worker.onmessage = function (e) {
    if (
      e.data.type === "emulator_ready" ||
      e.data.type === "emulator_loading"
    ) {
      // document.body.className =
      //   e.data.type === 'emulator_ready' ? '' : 'loading';
      // const progressElement = document.getElementById('progress');
      // if (progressElement && e.data.type === 'emulator_loading') {
      //   progressElement.value = Math.max(10, e.data.completion * 100);
      //   progressElement.max = 100;
      //   progressElement.hidden = false;
      // } else {
      //   progressElement.value = null;
      //   progressElement.max = null;
      //   progressElement.hidden = true;
      // }
    }

    if (e.data.type === 'TTY') {
      // If we're shutting down, Basilisk II will send
      // close_audio to TTY - our signal that we can
      // save the disk image
      if (e.data.message === 'close_audio') {
        worker.postMessage('save');
      }
    }
  };
}

function saveDisk() {


  worker.postMessage('save');
}

module.exports = {
  registerWorker,
};
