import type { SpeciesId } from '../domain/types';
import { audioContext } from '../feedback';

/**
 * Ambient soundscapes, one per species, synthesized live with Web Audio (no downloads):
 *   Bloomling: a light breeze through leaves, with the odd bird.
 *   Cinder:    a low fire with crackles.
 *   Ripple:    soft rain with drips.
 * To swap in recorded loops later, replace build() with an <audio loop> source; the
 * start/stop/volume API stays the same.
 */

const FADE_S = 1.2;

interface Scene {
  nodes: AudioNode[];
  timers: number[];
}

let master: GainNode | null = null;
let scene: Scene | null = null;
let current: SpeciesId | null = null;
let volume = 0.5;

function noiseBuffer(c: AudioContext, kind: 'white' | 'brown' | 'pink'): AudioBuffer {
  const len = c.sampleRate * 3;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') d[i] = w;
    else if (kind === 'brown') {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else {
      b0 = 0.997 * b0 + 0.029591 * w;
      b1 = 0.985 * b1 + 0.032534 * w;
      b2 = 0.95 * b2 + 0.048056 * w;
      d[i] = (b0 + b1 + b2 + w * 0.05) * 0.9;
    }
  }
  return buf;
}

function loopNoise(c: AudioContext, kind: 'white' | 'brown' | 'pink', out: AudioNode, s: Scene, filters: BiquadFilterNode[], gain: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, kind);
  src.loop = true;
  const g = c.createGain();
  g.gain.value = gain;
  let node: AudioNode = src;
  for (const f of filters) {
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(out);
  src.start();
  s.nodes.push(src, g, ...filters);
  return g;
}

function filter(c: AudioContext, type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Schedule a repeating random event while the scene is live. */
function every(s: Scene, min: number, max: number, fn: () => void) {
  const tick = () => {
    if (scene !== s) return;
    fn();
    s.timers.push(window.setTimeout(tick, min + Math.random() * (max - min)));
  };
  s.timers.push(window.setTimeout(tick, min + Math.random() * (max - min)));
}

function blip(c: AudioContext, out: AudioNode, freq: number, peak: number, decay: number, type: OscillatorType = 'sine', sweepTo?: number) {
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t + decay * 0.8);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + decay + 0.05);
}

function crackle(c: AudioContext, out: AudioNode, buf: AudioBuffer) {
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = filter(c, 'bandpass', 1500 + Math.random() * 3500, 3);
  const g = c.createGain();
  const len = 0.004 + Math.random() * 0.02;
  g.gain.setValueAtTime(0.25 + Math.random() * 0.4, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(bp).connect(g).connect(out);
  src.start(t, Math.random() * 2, len + 0.02);
}

function build(c: AudioContext, species: SpeciesId, out: AudioNode): Scene {
  const s: Scene = { nodes: [], timers: [] };
  if (species === 'ripple') {
    loopNoise(c, 'white', out, s, [filter(c, 'highpass', 500), filter(c, 'lowpass', 5000)], 0.18);
    loopNoise(c, 'brown', out, s, [filter(c, 'lowpass', 350)], 0.25);
    every(s, 40, 220, () => blip(c, out, 1800 + Math.random() * 2200, 0.02 + Math.random() * 0.03, 0.05));
  } else if (species === 'moss') {
    // Woods after the rain: a low hush, a faint breeze, and slow round drips.
    loopNoise(c, 'brown', out, s, [filter(c, 'lowpass', 280)], 0.3);
    loopNoise(c, 'pink', out, s, [filter(c, 'bandpass', 700, 0.5)], 0.12);
    every(s, 700, 2600, () => blip(c, out, 520 + Math.random() * 420, 0.05, 0.22, 'sine', 380));
  } else if (species === 'nimbus') {
    // High breeze with a slow swell, and faint wind chimes now and then.
    const wind = loopNoise(c, 'pink', out, s, [filter(c, 'bandpass', 1200, 0.35)], 0.22);
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 0.05;
    depth.gain.value = 0.12;
    lfo.connect(depth).connect(wind.gain);
    lfo.start();
    s.nodes.push(lfo, depth);
    const chime = [1318.5, 1568, 1760, 2093, 2349];
    every(s, 3500, 9000, () => {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        window.setTimeout(() => blip(c, out, chime[Math.floor(Math.random() * chime.length)], 0.018, 2.4), i * 220);
      }
    });
  } else if (species === 'lumi') {
    // A warm summer night: a low hush, a soft hum, and crickets chirping in little trills.
    loopNoise(c, 'brown', out, s, [filter(c, 'lowpass', 220)], 0.2);
    loopNoise(c, 'pink', out, s, [filter(c, 'bandpass', 450, 0.6)], 0.06);
    every(s, 900, 2600, () => {
      const pitch = 4200 + Math.random() * 600;
      const pulses = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < pulses; i++) window.setTimeout(() => blip(c, out, pitch, 0.012, 0.035), i * 55);
    });
  } else if (species === 'cinder') {
    loopNoise(c, 'brown', out, s, [filter(c, 'lowpass', 420)], 0.55);
    const white = noiseBuffer(c, 'white');
    every(s, 25, 260, () => {
      crackle(c, out, white);
      if (Math.random() < 0.3) window.setTimeout(() => crackle(c, out, white), 15 + Math.random() * 40);
    });
  } else {
    // Breeze: band-passed pink noise swelling slowly.
    const breeze = loopNoise(c, 'pink', out, s, [filter(c, 'bandpass', 900, 0.4)], 0.35);
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 0.07;
    depth.gain.value = 0.2;
    lfo.connect(depth).connect(breeze.gain);
    lfo.start();
    s.nodes.push(lfo, depth);
    every(s, 5000, 12000, () => {
      const base = 2600 + Math.random() * 1400;
      const notes = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) {
        window.setTimeout(() => blip(c, out, base, 0.025, 0.12, 'sine', base * 1.35), i * 140);
      }
    });
  }
  return s;
}

function teardown(s: Scene) {
  s.timers.forEach((t) => window.clearTimeout(t));
  for (const n of s.nodes) {
    try {
      if (n instanceof AudioScheduledSourceNode) n.stop();
      n.disconnect();
    } catch {
      /* already stopped */
    }
  }
}

export function startAmbient(species: SpeciesId): void {
  const c = audioContext();
  if (!c) return;
  if (scene && current === species) return;
  stopAmbient(true);
  master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(volume * 0.6, c.currentTime + FADE_S);
  master.connect(c.destination);
  scene = build(c, species, master);
  current = species;
}

export function stopAmbient(immediate = false): void {
  const c = audioContext();
  const s = scene;
  const m = master;
  scene = null;
  current = null;
  master = null;
  if (!s || !m || !c) return;
  if (immediate) {
    teardown(s);
    m.disconnect();
    return;
  }
  m.gain.cancelScheduledValues(c.currentTime);
  m.gain.setValueAtTime(m.gain.value, c.currentTime);
  m.gain.linearRampToValueAtTime(0, c.currentTime + FADE_S);
  window.setTimeout(() => {
    teardown(s);
    m.disconnect();
  }, FADE_S * 1000 + 50);
}

export function setAmbientVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  const c = audioContext();
  if (master && c) master.gain.setTargetAtTime(volume * 0.6, c.currentTime, 0.1);
}

export const isAmbientPlaying = () => scene !== null;
