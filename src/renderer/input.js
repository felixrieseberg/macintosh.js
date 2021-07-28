const { acquireLock, releaseLock } = require("./atomics");

const INPUT_BUFFER_SIZE = 100;
const inputBuffer = new SharedArrayBuffer(INPUT_BUFFER_SIZE * 4);
const inputBufferView = new Int32Array(inputBuffer);

let inputQueue = [];

const InputBufferAddresses = {
  globalLockAddr: 0,
  mouseMoveFlagAddr: 1,
  mouseMoveXDeltaAddr: 2,
  mouseMoveYDeltaAddr: 3,
  mouseButtonStateAddr: 4,
  keyEventFlagAddr: 5,
  keyCodeAddr: 6,
  keyStateAddr: 7,
};

function releaseInputLock() {
  releaseLock(inputBufferView, InputBufferAddresses.globalLockAddr);
}

function tryToSendInput() {
  if (!acquireLock(inputBufferView, InputBufferAddresses.globalLockAddr)) {
    return;
  }

  var hasMouseMove = false;
  var mouseMoveX = 0;
  var mouseMoveY = 0;
  var mouseButtonState = -1;
  var hasKeyEvent = false;
  var keyCode = -1;
  var keyState = -1;

  // currently only one key event can be sent per sync
  // TODO: better key handling code
  var remainingKeyEvents = [];

  for (var i = 0; i < inputQueue.length; i++) {
    var inputEvent = inputQueue[i];
    switch (inputEvent.type) {
      case "mousemove":
        hasMouseMove = true;
        // Make change according to https://github.com/felixrieseberg/macintosh.js/issues/6#issuecomment-665981700
        mouseMoveX = inputEvent.dx;
        mouseMoveY = inputEvent.dy;
        break;
      case "mousedown":
      case "mouseup":
        mouseButtonState = inputEvent.type === "mousedown" ? 1 : 0;
        break;
      case "keydown":
      case "keyup":
        if (hasKeyEvent) {
          remainingKeyEvents.push(inputEvent);
          break;
        }
        hasKeyEvent = true;
        keyState = inputEvent.type === "keydown" ? 1 : 0;
        keyCode = inputEvent.keyCode;
        break;
    }
  }
  if (hasMouseMove) {
    inputBufferView[InputBufferAddresses.mouseMoveFlagAddr] = 1;
    inputBufferView[InputBufferAddresses.mouseMoveXDeltaAddr] = mouseMoveX;
    inputBufferView[InputBufferAddresses.mouseMoveYDeltaAddr] = mouseMoveY;
  }
  inputBufferView[InputBufferAddresses.mouseButtonStateAddr] = mouseButtonState;
  if (hasKeyEvent) {
    inputBufferView[InputBufferAddresses.keyEventFlagAddr] = 1;
    inputBufferView[InputBufferAddresses.keyCodeAddr] = keyCode;
    inputBufferView[InputBufferAddresses.keyStateAddr] = keyState;
  }
  releaseInputLock();
  inputQueue = remainingKeyEvents;
}

canvas.addEventListener("mousemove", function (event) {
  inputQueue.push({ type: "mousemove", dx: event.offsetX, dy: event.offsetY });
});

canvas.addEventListener("mousedown", function (event) {
  inputQueue.push({ type: "mousedown" });
});

canvas.addEventListener("mouseup", function (event) {
  inputQueue.push({ type: "mouseup" });
});

window.addEventListener("keydown", function (event) {
  inputQueue.push({ type: "keydown", keyCode: event.keyCode });
});

window.addEventListener("keyup", function (event) {
  inputQueue.push({ type: "keyup", keyCode: event.keyCode });
});

module.exports = {
  INPUT_BUFFER_SIZE,
  inputBuffer,
  inputBufferView,
  InputBufferAddresses,
  inputQueue,
  tryToSendInput,
};
