/**
 * Keeps the screen on during a session. Without this, a phone screen sleeping would hide the
 * page, which (by design) pauses the timer. Browsers drop the lock when the page is hidden,
 * so callers re-acquire it when the page becomes visible again.
 */
let lock: WakeLockSentinel | null = null;

export async function acquireWakeLock(): Promise<void> {
  try {
    if (!('wakeLock' in navigator) || document.hidden || (lock && !lock.released)) return;
    lock = await navigator.wakeLock.request('screen');
  } catch {
    lock = null; // denied (e.g. low battery) or unsupported
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await lock?.release();
  } catch {
    /* ignore */
  }
  lock = null;
}
