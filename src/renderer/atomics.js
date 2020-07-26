const LockStates = {
  READY_FOR_UI_THREAD: 0,
  UI_THREAD_LOCK: 1,
  READY_FOR_EMUL_THREAD: 2,
  EMUL_THREAD_LOCK: 3,
};

function acquireTwoStateLock(bufferView, lockIndex) {
  const res = Atomics.compareExchange(
    bufferView,
    lockIndex,
    LockStates.EMUL_THREAD_LOCK,
    LockStates.UI_THREAD_LOCK
  );

  return res === LockStates.EMUL_THREAD_LOCK;
}

function releaseTwoStateLock(bufferView, lockIndex) {
  Atomics.store(bufferView, lockIndex, LockStates.EMUL_THREAD_LOCK); // unlock
  Atomics.notify(bufferView, lockIndex);
}

function acquireLock(bufferView, lockIndex) {
  const res = Atomics.compareExchange(
    bufferView,
    lockIndex,
    LockStates.READY_FOR_UI_THREAD,
    LockStates.UI_THREAD_LOCK
  );

  return res === LockStates.READY_FOR_UI_THREAD;
}

function releaseLock(bufferView, lockIndex) {
  Atomics.store(bufferView, lockIndex, LockStates.READY_FOR_EMUL_THREAD); // unlock
  Atomics.notify(bufferView, lockIndex);
}

module.exports = {
  acquireTwoStateLock,
  releaseTwoStateLock,
  acquireLock,
  releaseLock,
  LockStates,
};
