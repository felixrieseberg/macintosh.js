const { videoModeBufferView } = require("./video");
const BITS = 4;
const SCREEN_BUFFER_SIZE = 800 * 600 * BITS; // 32bpp;

const screenBuffer = new SharedArrayBuffer(SCREEN_BUFFER_SIZE);
const screenBufferView = new Uint8Array(screenBuffer);

let screenWidth = 800;
let screenHeight = 600;

canvas.width = screenWidth;
canvas.height = screenHeight;

const canvasCtx = canvas.getContext("2d");
let imageData = canvasCtx.createImageData(screenWidth, screenHeight);

window.addEventListener("resize", () => {
  screenHeight = window.innerHeight - 35;
  screenWidth = Math.floor(screenHeight * (4 / 3));
  if (window.innerWidth < screenWidth) {
    screenWidth = window.innerWidth;
    screenHeight = Math.floor(screenWidth * 0.75);
  }
  canvas.width = screenWidth;
  canvas.height = screenHeight;
  imageData = canvasCtx.createImageData(screenWidth, screenHeight);
});

let stopDrawing = false;

function drawScreen() {
  if (stopDrawing) return;
  const pixelsRGBA = imageData.data;
  const numPixels = screenWidth * screenHeight;
  const expandedFromPalettedMode = videoModeBufferView[3];

  if (expandedFromPalettedMode) {
    for (let i = 0; i < numPixels; i++) {
      // palette
      pixelsRGBA[i * BITS + 0] = screenBufferView[i * BITS + 0];
      pixelsRGBA[i * BITS + 1] = screenBufferView[i * BITS + 1];
      pixelsRGBA[i * BITS + 2] = screenBufferView[i * BITS + 2];
      pixelsRGBA[i * BITS + 3] = 255; // full opacity
    }
  } else {
    for (let i = 0; i < screenHeight; i++) {
      for (let j = 0; j < screenWidth; j++) {
        // ARGB
        const xRatio = 800 / screenWidth;
        const yRatio = 600 / screenHeight;
        const px = Math.floor(j * xRatio);
        const py = Math.floor(i * yRatio);
        pixelsRGBA[(i * screenWidth + j) * 4 + 0] =
          screenBufferView[(py * 800 + px) * 4 + 1]; //- lineMult];
        pixelsRGBA[(i * screenWidth + j) * 4 + 1] =
          screenBufferView[(py * 800 + px) * 4 + 2]; //- lineMult];
        pixelsRGBA[(i * screenWidth + j) * 4 + 2] =
          screenBufferView[(py * 800 + px) * 4 + 3]; //- lineMult];
        pixelsRGBA[(i * screenWidth + j) * 4 + 3] = 255; // full opacity
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
  SCREEN_WIDTH: screenWidth,
  SCREEN_HEIGHT: screenHeight,
  setCanvasBlank,
};
