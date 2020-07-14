var memAllocSet = new Set();
var memAllocSetPersistent = new Set();

function memAllocAdd(addr) {
  if (memAllocSet.has(addr)) {
    console.error(`unfreed memory alloc'd at ${addr}`);
  }
  memAllocSet.add(addr);
  console.warn('malloc', addr);
  memAllocSetPersistent.add(addr);
}

function memAllocRemove(addr) {
  if (!memAllocSet.has(addr)) {
    console.error(
      `unalloc'd memory free'd at ${addr} (everallocd=${memAllocSetPersistent.has(
        addr
      )})`
    );
  }
  console.warn('free', addr);
  memAllocSet.delete(addr);
}

var pathGetFilenameRegex = /\/([^\/]+)$/;

function pathGetFilename(path) {
  var matches = path.match(pathGetFilenameRegex);
  if (matches && matches.length) {
    return matches[1];
  } else {
    return path;
  }
}

function addAutoloader(module) {
  var loadDatafiles = function() {
    module.autoloadFiles.forEach(function(filepath) {
      module.FS_createPreloadedFile(
        '/',
        pathGetFilename(filepath),
        filepath,
        true,
        true
      );
    });
  };

  if (module.autoloadFiles) {
    module.preRun = module.preRun || [];
    module.preRun.unshift(loadDatafiles);
  }

  return module;
}

function addCustomAsyncInit(module) {
  if (module.asyncInit) {
    module.preRun = module.preRun || [];
    module.preRun.push(function waitForCustomAsyncInit() {
      module.addRunDependency('__moduleAsyncInit');

      module.asyncInit(module, function asyncInitCallback() {
        module.removeRunDependency('__moduleAsyncInit');
      });
    });
  }
}

var InputBufferAddresses = {
  globalLockAddr: 0,
  mouseMoveFlagAddr: 1,
  mouseMoveXDeltaAddr: 2,
  mouseMoveYDeltaAddr: 3,
  mouseButtonStateAddr: 4,
  keyEventFlagAddr: 5,
  keyCodeAddr: 6,
  keyStateAddr: 7,
};

var LockStates = {
  READY_FOR_UI_THREAD: 0,
  UI_THREAD_LOCK: 1,
  READY_FOR_EMUL_THREAD: 2,
  EMUL_THREAD_LOCK: 3,
};

var Module = null;

self.onmessage = function(msg) {
  console.log('init worker');
  startEmulator(Object.assign({}, msg.data, {singleThreadedEmscripten: true}));
};

function startEmulator(parentConfig) {
  var screenBufferView = new Uint8Array(
    parentConfig.screenBuffer,
    0,
    parentConfig.screenBufferSize
  );

  var videoModeBufferView = new Int32Array(
    parentConfig.videoModeBuffer,
    0,
    parentConfig.videoModeBufferSize
  );

  var inputBufferView = new Int32Array(
    parentConfig.inputBuffer,
    0,
    parentConfig.inputBufferSize
  );

  var nextAudioChunkIndex = 0;
  var audioDataBufferView = new Uint8Array(
    parentConfig.audioDataBuffer,
    0,
    parentConfig.audioDataBufferSize
  );

  function waitForTwoStateLock(bufferView, lockIndex) {
    // Atomics.wait(
    //   bufferView,
    //   lockIndex,
    //   LockStates.UI_THREAD_LOCK
    // );

    // while (!tryToAcquireCyclicalLock(bufferView, lockIndex)) {
    //   // spin
    // }
    // if (!tryToAcquireCyclicalLock(bufferView, lockIndex)) {
    //   throw new Error('failed to acquire lock for index', lockIndex);
    // }
    //
    //
    if (Atomics.load(bufferView, lockIndex) === LockStates.UI_THREAD_LOCK) {
      while (
        Atomics.compareExchange(
          bufferView,
          lockIndex,
          LockStates.UI_THREAD_LOCK,
          LockStates.EMUL_THREAD_LOCK
        ) !== LockStates.UI_THREAD_LOCK
      ) {
        // spin
        // TODO use wait and wake
      }
    } else {
      // already unlocked
    }
  }

  function releaseTwoStateLock(bufferView, lockIndex) {
    Atomics.store(bufferView, lockIndex, LockStates.UI_THREAD_LOCK); // unlock
  }

  function tryToAcquireCyclicalLock(bufferView, lockIndex) {
    var res = Atomics.compareExchange(
      bufferView,
      lockIndex,
      LockStates.READY_FOR_EMUL_THREAD,
      LockStates.EMUL_THREAD_LOCK
    );
    if (res === LockStates.READY_FOR_EMUL_THREAD) {
      return 1;
    }
    return 0;
  }

  function releaseCyclicalLock(bufferView, lockIndex) {
    Atomics.store(bufferView, lockIndex, LockStates.READY_FOR_UI_THREAD); // unlock
  }

  function acquireInputLock() {
    return tryToAcquireCyclicalLock(
      inputBufferView,
      InputBufferAddresses.globalLockAddr
    );
  }

  function releaseInputLock() {
    // reset
    inputBufferView[InputBufferAddresses.mouseMoveFlagAddr] = 0;
    inputBufferView[InputBufferAddresses.mouseMoveXDeltaAddr] = 0;
    inputBufferView[InputBufferAddresses.mouseMoveYDeltaAddr] = 0;
    inputBufferView[InputBufferAddresses.mouseButtonStateAddr] = 0;
    inputBufferView[InputBufferAddresses.keyEventFlagAddr] = 0;
    inputBufferView[InputBufferAddresses.keyCodeAddr] = 0;
    inputBufferView[InputBufferAddresses.keyStateAddr] = 0;

    releaseCyclicalLock(inputBufferView, InputBufferAddresses.globalLockAddr);
  }

  var AudioConfig = null;

  var AudioBufferQueue = [];

  Module = {
    autoloadFiles: ['system7.img', 'DCImage.img', 'disk1.img', 'Quadra-650.rom', 'prefs'],

    arguments: ['--config', 'prefs'],
    canvas: null,

    blit: function blit(bufPtr, width, height, depth, usingPalette) {
      // console.time('await worker video lock');
      // waitForTwoStateLock(videoModeBufferView, 9);
      // console.timeEnd('await worker video lock');

      videoModeBufferView[0] = width;
      videoModeBufferView[1] = height;
      videoModeBufferView[2] = depth;
      videoModeBufferView[3] = usingPalette;
      var length = width * height * (depth === 32 ? 4 : 1); // 32bpp or 8bpp
      for (var i = 0; i < length; i++) {
        screenBufferView[i] = Module.HEAPU8[bufPtr + i];
      }
      // releaseTwoStateLock(videoModeBufferView, 9);
    },

    openAudio: function openAudio(
      sampleRate,
      sampleSize,
      channels,
      framesPerBuffer
    ) {
      AudioConfig = {
        sampleRate: sampleRate,
        sampleSize: sampleSize,
        channels: channels,
        framesPerBuffer: framesPerBuffer,
      };
      console.log(AudioConfig);
    },

    enqueueAudio: function enqueueAudio(bufPtr, nbytes, type) {
      var newAudio = Module.HEAPU8.slice(bufPtr, bufPtr + nbytes);
      // console.assert(
      //   nbytes == parentConfig.audioBlockBufferSize,
      //   `emulator wrote ${nbytes}, expected ${parentConfig.audioBlockBufferSize}`
      // );

      var writingChunkIndex = nextAudioChunkIndex;
      var writingChunkAddr =
        writingChunkIndex * parentConfig.audioBlockChunkSize;

      if (audioDataBufferView[writingChunkAddr] === LockStates.UI_THREAD_LOCK) {
        console.warn(
          'worker tried to write audio data to UI-thread-locked chunk',
          writingChunkIndex
        );
        return 0;
      }

      var nextNextChunkIndex = writingChunkIndex + 1;
      if (
        nextNextChunkIndex * parentConfig.audioBlockChunkSize >
        audioDataBufferView.length - 1
      ) {
        nextNextChunkIndex = 0;
      }
      // console.assert(nextNextChunkIndex != writingChunkIndex, `writingChunkIndex=${nextNextChunkIndex} == nextChunkIndex=${nextNextChunkIndex}`)

      audioDataBufferView[writingChunkAddr + 1] = nextNextChunkIndex;
      audioDataBufferView.set(newAudio, writingChunkAddr + 2);
      audioDataBufferView[writingChunkAddr] = LockStates.UI_THREAD_LOCK;

      nextAudioChunkIndex = nextNextChunkIndex;
      return nbytes;
    },

    debugPointer: function debugPointer(ptr) {
      console.log('debugPointer', ptr);
    },

    acquireInputLock: acquireInputLock,

    InputBufferAddresses: InputBufferAddresses,

    getInputValue: function getInputValue(addr) {
      return inputBufferView[addr];
    },

    totalDependencies: 0,
    monitorRunDependencies: function(left) {
      this.totalDependencies = Math.max(this.totalDependencies, left);

      if (left == 0) {
        postMessage({type: 'emulator_ready'});
      } else {
        postMessage({
          type: 'emulator_loading',
          completion: (this.totalDependencies - left) / this.totalDependencies,
        });
      }
    },

    print: console.log.bind(console),

    printErr: console.warn.bind(console),

    releaseInputLock: releaseInputLock,
  };

  // inject extra behaviours
  addAutoloader(Module);
  addCustomAsyncInit(Module);

  if (parentConfig.singleThreadedEmscripten) {
    importScripts('BasiliskII.js');
  }
}
