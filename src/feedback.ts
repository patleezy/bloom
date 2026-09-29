/**
 * Shared audio context, session-complete chime (synthesized, no audio files), and vibration.
 * Browsers only allow audio after a user gesture, so call unlockAudio() from a click first.
 */
let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null; // audio unavailable
  }
}

export function audioContext(): AudioContext | null {
  return ctx;
}

export function chime(): void {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  // Soft rising major triad.
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = t0 + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + 1.5);
  });
}

export function buzz(): void {
  try {
    navigator.vibrate?.([80, 60, 80]);
  } catch {
    /* unsupported */
  }
}
