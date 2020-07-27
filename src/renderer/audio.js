const { LockStates } = require("./atomics");

var audio = {
  channels: 1,
  bytesPerSample: 2,
  samples: 4096,
  freq: 22050,
  format: 0x8010,
  paused: false,
  timer: null,
  silence: 0,
  maxBuffersInSharedMemory: 5,
  nextPlayTime: 0,
};

var audioTotalSamples = audio.samples * audio.channels;
audio.bytesPerSample =
  audio.format == 0x0008 /*AUDIO_U8*/ || audio.format == 0x8008 /*AUDIO_S8*/
    ? 1
    : 2;
audio.bufferSize = audioTotalSamples * audio.bytesPerSample;
audio.bufferDurationSecs =
  audio.bufferSize / audio.bytesPerSample / audio.channels / audio.freq; // Duration of a single queued buffer in seconds.
audio.bufferingDelay = 50 / 1000; // Audio samples are played with a constant delay of this many seconds to account for browser and jitter.

// To account for jittering in frametimes, always have multiple audio buffers queued up for the audio output device.
// This helps that we won't starve that easily if a frame takes long to complete.
audio.numSimultaneouslyQueuedBuffers = 5;
audio.nextChunkIndex = 0;

var AUDIO_CONFIG_BUFFER_SIZE = 10;
var audioConfigBuffer = new SharedArrayBuffer(AUDIO_CONFIG_BUFFER_SIZE);
var audioConfigBufferView = new Uint8Array(audioConfigBuffer);

var audioBlockChunkSize = audio.bufferSize + 2;
var AUDIO_DATA_BUFFER_SIZE =
  audioBlockChunkSize * audio.maxBuffersInSharedMemory;
var audioDataBuffer = new SharedArrayBuffer(AUDIO_DATA_BUFFER_SIZE);
var audioDataBufferView = new Uint8Array(audioDataBuffer);

var audioContext = new AudioContext();
var gainNode = audioContext.createGain();

gainNode.gain.value = 1;
gainNode.connect(audioContext.destination);

function openAudio() {
  audio.pushAudio = function pushAudio(
    blockBuffer, // u8 typed array
    sizeBytes // probably (frames per block=4096) * (bytes per sample=2) * (n channels=1)
  ) {
    if (audio.paused) return;

    var sizeSamples = sizeBytes / audio.bytesPerSample; // How many samples fit in the callback buffer?
    var sizeSamplesPerChannel = sizeSamples / audio.channels; // How many samples per a single channel fit in the cb buffer?
    if (sizeSamplesPerChannel != audio.samples) {
      throw "Received mismatching audio buffer size!";
    }
    // Allocate new sound buffer to be played.
    var source = audioContext.createBufferSource();
    var soundBuffer = audioContext.createBuffer(
      audio.channels,
      sizeSamplesPerChannel,
      audio.freq
    );
    // source.connect(audioContext.destination);
    source.connect(gainNode);

    audio.fillWebAudioBufferFromChunk(
      blockBuffer,
      sizeSamplesPerChannel,
      soundBuffer
    );
    // Workaround https://bugzilla.mozilla.org/show_bug.cgi?id=883675 by setting the buffer only after filling. The order is important here!
    source.buffer = soundBuffer;

    // Schedule the generated sample buffer to be played out at the correct time right after the previously scheduled
    // sample buffer has finished.
    var curtime = audioContext.currentTime;

    // assertion
    if (curtime > audio.nextPlayTime && audio.nextPlayTime != 0) {
      // console.log(
      //   "warning: Audio callback had starved sending audio by " +
      //     (curtime - audio.nextPlayTime) +
      //     " seconds."
      // );
    }

    // Don't ever start buffer playbacks earlier from current time than a given constant 'audio.bufferingDelay', since a browser
    // may not be able to mix that audio clip in immediately, and there may be subsequent jitter that might cause the stream to starve.
    var playtime = Math.max(curtime + audio.bufferingDelay, audio.nextPlayTime);
    source.start(playtime);
    // console.log(`queuing audio for ${playtime}`)

    audio.nextPlayTime = playtime + audio.bufferDurationSecs;
  };

  var getBlockBufferLastWarningTime = 0;
  var getBlockBufferWarningCount = 0;
  audio.getBlockBuffer = function getBlockBuffer() {
    // audio chunk layout
    // 0: lock state
    // 1: pointer to next chunk
    // 2->buffersize+2: audio buffer
    var curChunkIndex = audio.nextChunkIndex;
    var curChunkAddr = curChunkIndex * audioBlockChunkSize;

    if (audioDataBufferView[curChunkAddr] !== LockStates.UI_THREAD_LOCK) {
      getBlockBufferWarningCount++;
      if (
        audio.gotFirstBlock &&
        Date.now() - getBlockBufferLastWarningTime > 5000
      ) {
        getBlockBufferLastWarningTime = Date.now();
        getBlockBufferWarningCount = 0;
      }
      return null;
    }
    audio.gotFirstBlock = true;

    // debugger

    var blockBuffer = audioDataBufferView.slice(
      curChunkAddr + 2,
      curChunkAddr + 2 + audio.bufferSize
    );
    audio.nextChunkIndex = audioDataBufferView[curChunkAddr + 1];
    audioDataBufferView[curChunkAddr] = LockStates.EMUL_THREAD_LOCK;
    return blockBuffer;
  };

  audio.fillWebAudioBufferFromChunk = function fillWebAudioBufferFromChunk(
    blockBuffer, // u8 typed array
    blockSize, // probably 4096
    dstAudioBuffer
  ) {
    for (var c = 0; c < audio.channels; ++c) {
      var channelData = dstAudioBuffer.getChannelData(c);
      if (channelData.length != blockSize) {
        throw (
          "Web Audio output buffer length mismatch! Destination size: " +
          channelData.length +
          " samples vs expected " +
          blockSize +
          " samples!"
        );
      }
      var blockBufferI16 = new Int16Array(blockBuffer.buffer);

      for (var j = 0; j < blockSize; ++j) {
        channelData[j] = blockBufferI16[j] / 0x8000; // convert i16 to f32 in range -1 to +1
      }
    }
  };

  // Pulls and queues new audio data if appropriate. This function gets "over-called" in both requestAnimationFrames and
  // setTimeouts to ensure that we get the finest granularity possible and as many chances from the browser to fill
  // new audio data. This is because setTimeouts alone have very poor granularity for audio streaming purposes, but also
  // the application might not be using emscripten_set_main_loop to drive the main loop, so we cannot rely on that alone.
  audio.queueNewAudioData = function queueNewAudioData() {
    var i = 0;
    for (; i < audio.numSimultaneouslyQueuedBuffers; ++i) {
      // Only queue new data if we don't have enough audio data already in queue. Otherwise skip this time slot
      // and wait to queue more in the next time the callback is run.
      var secsUntilNextPlayStart =
        audio.nextPlayTime - audioContext.currentTime;
      if (
        secsUntilNextPlayStart >=
        audio.bufferingDelay +
          audio.bufferDurationSecs * audio.numSimultaneouslyQueuedBuffers
      )
        return;

      var blockBuffer = audio.getBlockBuffer();
      if (!blockBuffer) {
        return;
      }

      // And queue it to be played after the currently playing audio stream.
      audio.pushAudio(blockBuffer, audio.bufferSize);
    }
  };

  // Create a callback function that will be routinely called to ask more audio data from the user application.
  audio.caller = function audioCaller() {
    --audio.numAudioTimersPending;

    audio.queueNewAudioData();

    // Queue this callback function to be called again later to pull more audio data.
    var secsUntilNextPlayStart = audio.nextPlayTime - audioContext.currentTime;

    // Queue the next audio frame push to be performed half-way when the previously queued buffer has finished playing.
    var preemptBufferFeedSecs = audio.bufferDurationSecs / 2.0;

    if (audio.numAudioTimersPending < audio.numSimultaneouslyQueuedBuffers) {
      ++audio.numAudioTimersPending;
      audio.timer = setTimeout(
        audio.caller,
        Math.max(0.0, 1000.0 * (secsUntilNextPlayStart - preemptBufferFeedSecs))
      );

      // If we are risking starving, immediately queue an extra buffer.
      if (audio.numAudioTimersPending < audio.numSimultaneouslyQueuedBuffers) {
        ++audio.numAudioTimersPending;
        setTimeout(audio.caller, 1.0);
      }
    }
  };

  audio.numAudioTimersPending = 1;
  audio.timer = setTimeout(audio.caller, 1);
}

module.exports = {
  audio,
  audioDataBuffer,
  audioContext,
  audioBlockChunkSize,
  AUDIO_DATA_BUFFER_SIZE,
  openAudio,
};
