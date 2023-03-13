const { videoModeBufferView } = require("./video");
var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 600;
const BITS = 4;
const SCREEN_BUFFER_SIZE = 800 * 600 * BITS; // 32bpp;


const screenBuffer = new SharedArrayBuffer(SCREEN_BUFFER_SIZE);
const screenBufferView = new Uint8Array(screenBuffer);

canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

const canvasCtx = canvas.getContext("2d");
var imageData = canvasCtx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);

window.addEventListener('resize', () => {
  SCREEN_HEIGHT = window.innerHeight -35;
  SCREEN_WIDTH = Math.floor(SCREEN_HEIGHT * (4 / 3))
  if(window.innerWidth < SCREEN_WIDTH){
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = Math.floor(SCREEN_WIDTH * 0.75);
  }
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  imageData = canvasCtx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
});

let stopDrawing = false;

function drawScreen() {
  if (stopDrawing) return;
  const pixelsRGBA = imageData.data;
  const numPixels = SCREEN_WIDTH * SCREEN_HEIGHT;
  const expandedFromPalettedMode = videoModeBufferView[3];

  if (expandedFromPalettedMode) {
    for (var i = 0; i < numPixels; i++) {
      // palette
      pixelsRGBA[i * BITS + 0] = screenBufferView[i * BITS + 0];
      pixelsRGBA[i * BITS + 1] = screenBufferView[i * BITS + 1];
      pixelsRGBA[i * BITS + 2] = screenBufferView[i * BITS + 2];
      pixelsRGBA[i * BITS + 3] = 255; // full opacity
    }
  } else {
    for (var i = 0; i < SCREEN_HEIGHT; i++) {
      for (var j = 0; j < SCREEN_WIDTH; j++){
        // ARGB
        const xRatio = 800 / SCREEN_WIDTH;
        const yRatio = 600 / SCREEN_HEIGHT;
        const px = Math.floor(j * xRatio);
        const py = Math.floor(i * yRatio);
        pixelsRGBA[((i * SCREEN_WIDTH) + j) * 4 + 0] = screenBufferView[((py*800) +px) * 4 + 1];//- lineMult];
        pixelsRGBA[((i * SCREEN_WIDTH) + j) * 4 + 1] = screenBufferView[((py*800) +px) * 4 + 2];//- lineMult];
        pixelsRGBA[((i * SCREEN_WIDTH) + j) * 4 + 2] = screenBufferView[((py*800) +px) * 4 + 3];//- lineMult];
        pixelsRGBA[((i * SCREEN_WIDTH) + j) * 4 + 3] = 255; // full opacity
      }
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
