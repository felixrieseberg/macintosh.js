const { inputBuffer, INPUT_BUFFER_SIZE } = require("./input");
const { videoModeBuffer, VIDEO_MODE_BUFFER_SIZE } = require("./video");
const { setCanvasBlank } = require("./screen");
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
const { quit, getIsDevMode, getUserDataPath } = require("./ipc");

let isWorkerRunning = false;
let isWorkerSaving = false;
let worker;

function getIsWorkerRunning() {
  return isWorkerRunning;
}

function getIsWorkerSaving() {
  return isWorkerSaving;
}

function saveDisk() {
  isWorkerSaving = true;
  document.querySelector("#disk_saving").classList.remove("hidden");
  worker.postMessage("disk_save");
}

async function handleDiskSaved() {
  console.log(`All files saved`);

  isWorkerSaving = false;

  // We're just gonna quit
  if (!(await getIsDevMode())) {
    quit();
  } else {
    alert(`We would usually quit, but developer mode is active`);
  }
}

async function handleWorkerShutdown() {
  console.log(`Handling worker shutdown`);

  document.body.classList.remove("emulator_running");

  // Then, update the canvas
  await setCanvasBlank();

  saveDisk();
}

async function registerWorker() {
  const workerConfig = {
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
    userDataPath: await getUserDataPath(),
    isDevMode: await getIsDevMode(),
  };

  worker = window.emulatorWorker = new Worker(
    "../basilisk/BasiliskII-worker-boot.js"
  );

  // We'll need this info
  isWorkerRunning = true;

  worker.postMessage(workerConfig);
  worker.onmessage = function (e) {
    if (e.data.type === "emulator_loading") {
      const progressElement = document.querySelector("#progressbar");
      const progressDialog = document.querySelector("#progress p");

      if (progressElement && e.data.type === "emulator_loading") {
        const val = Math.max(10, e.data.completion * 100);
        console.log(`Loading progress: ${val}`);

        progressElement.value = val;
        progressElement.max = 100;
      } else {
        progressDialog.innerText = `Files loaded, now booting`;
      }
    } else if (e.data.type === "TTY") {
      // If we're shutting down, Basilisk II will send
      // close_audio to TTY - our signal that we can
      // save the disk image
      if (e.data.data === "close_audio") {
        handleWorkerShutdown();
      }

      // If we're ready, Basilisk II will send
      // video_open()
      if (e.data.data === "video_open()") {
        document.body.classList.remove("emulator_loading");
        document.body.classList.add("emulator_running");
      }
    } else if (e.data.type === "disk_saved") {
      handleDiskSaved();
    }
  };
}

module.exports = {
  registerWorker,
  getIsWorkerRunning,
  getIsWorkerSaving,
};
