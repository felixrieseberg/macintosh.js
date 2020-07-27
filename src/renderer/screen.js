const { videoModeBufferView } = require("./video");
const { audioContext } = require("./audio");

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const SCREEN_BUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT * 4; // 32bpp;

const screenBuffer = new SharedArrayBuffer(SCREEN_BUFFER_SIZE);
const screenBufferView = new Uint8Array(screenBuffer);

canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

const canvasCtx = canvas.getContext("2d");
const imageData = canvasCtx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);

let stopDrawing = false;

function drawScreen() {
  if (stopDrawing) return;
  const pixelsRGBA = imageData.data;
  const numPixels = SCREEN_WIDTH * SCREEN_HEIGHT;
  const expandedFromPalettedMode = videoModeBufferView[3];
  const start = audioContext.currentTime;

  if (expandedFromPalettedMode) {
    for (var i = 0; i < numPixels; i++) {
      // palette
      pixelsRGBA[i * 4 + 0] = screenBufferView[i * 4 + 0];
      pixelsRGBA[i * 4 + 1] = screenBufferView[i * 4 + 1];
      pixelsRGBA[i * 4 + 2] = screenBufferView[i * 4 + 2];
      pixelsRGBA[i * 4 + 3] = 255; // full opacity
    }
  } else {
    for (var i = 0; i < numPixels; i++) {
      // ARGB
      pixelsRGBA[i * 4 + 0] = screenBufferView[i * 4 + 1];
      pixelsRGBA[i * 4 + 1] = screenBufferView[i * 4 + 2];
      pixelsRGBA[i * 4 + 2] = screenBufferView[i * 4 + 3];
      pixelsRGBA[i * 4 + 3] = 255; // full opacity
    }
  }

  canvasCtx.putImageData(imageData, 0, 0);
}

function setCanvasBlank() {
  return new Promise((resolve) => {
    stopDrawing = true;
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const bg = new Image();

    // Clear
    ctx.canvas.width = ctx.canvas.width;

    bg.onload = () => {
      const pattern = ctx.createPattern(bg, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      resolve();
    };
    bg.src = "images/off_bg.png";
  });
}

module.exports = {
  screenBuffer,
  screenBufferView,
  SCREEN_BUFFER_SIZE,
  drawScreen,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  setCanvasBlank,
};
