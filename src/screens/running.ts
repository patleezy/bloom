import { setAmbientVolume, startAmbient, stopAmbient } from '../audio/ambient';
import { startActivities } from '../companion/activities';
import { makePettable } from '../companion/react';
import { renderCompanion, setGrowth, setSleeping } from '../companion/render';
import { stageName } from '../companion/species';
import { copy } from '../copy';
import { formatClock, h } from '../dom';
import type { SessionService } from '../domain/sessionService';
import { totalMinutes } from '../domain/stats';
import { icon } from '../icons';
import { countedMinutes, minutesToNext, stageFor } from '../logic/growth';
import { unlockAudio } from '../feedback';
import { savePrefs, type Prefs } from '../state/prefs';
import { acquireWakeLock, releaseWakeLock } from '../wakeLock';

const RING = 2 * Math.PI * 54;
/** Leaving for less than this doesn't pause (a quick glance at another tab or a text). */
export const AWAY_GRACE_MS = 60_000;
const CHECKPOINT_EVERY_MS = 15_000;

/** Running session. Returns the element plus a cleanup function for timers/listeners. */
export function runningScreen(
  svc: SessionService,
  opts: { restored: boolean; prefs: Prefs; onFinish: () => void },
): { el: HTMLElement; dispose: () => void } {
  const active = svc.active!;
  const companion = svc.sessionCompanion!;
  const planned = active.clock.plannedMs;
  const baseTotal = totalMinutes(svc.historyFor(companion.id));
  const stage = stageFor(baseTotal);
  const art = renderCompanion(companion.species, stage.index,
    { label: `${companion.name}, a ${stageName(companion.species, stage.index)}, growing` });
  const lines = copy.running[companion.species](companion.name);
  const remainingAtStart = minutesToNext(baseTotal);
  const isPaused = () => svc.active?.clock.runningSince === null;
  const activities = startActivities(art, companion.species, { gap: [15000, 35000], isResting: isPaused });

  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('viewBox', '0 0 120 120');
  ring.setAttribute('class', 'ring');
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = `<circle class="ring-track" cx="60" cy="60" r="54"/>
    <circle class="ring-fill" cx="60" cy="60" r="54" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>`;
  const ringFill = ring.querySelector('.ring-fill') as SVGCircleElement;

  const time = h('p', { class: 'clock', role: 'timer', 'aria-live': 'off' });
  const note = h('p', { class: 'note', 'aria-live': 'polite' });
  const toNext = h('p', { class: 'muted small to-next' });
  const resumeBtn = h('button', { class: 'btn primary', hidden: true, onclick: () => void doResume() }, copy.resume);
  const endBtn = h('button', { class: 'btn ghost', onclick: () => {
    if (confirm(copy.confirmEnd)) finish();
  } }, copy.endEarly);

  // Focus checklist. Checking one off makes the companion cheer.
  const checklist = active.tasks.length
    ? h('ul', { class: 'checklist' }, ...active.tasks.map((t, i) => {
        const box = h('button', { class: 'check', type: 'button', role: 'checkbox', 'aria-checked': String(t.done),
          'aria-label': t.text }, icon('check'));
        const item = h('li', { class: t.done ? 'done' : '' }, box, h('span', {}, t.text));
        box.addEventListener('click', async () => {
          const done = await svc.toggleTask(i);
          box.setAttribute('aria-checked', String(done));
          item.classList.toggle('done', done);
          if (done) cheer();
        });
        return item;
      }))
    : null;

  // Ambient sound: plays while focusing, fades out while the companion naps.
  const { prefs } = opts;
  setAmbientVolume(prefs.volume);
  const soundBtn = h('button', { class: 'icon-btn sound-toggle' });
  function renderSoundBtn() {
    soundBtn.replaceChildren(icon(prefs.ambient ? 'sound' : 'mute'));
    soundBtn.setAttribute('aria-label', prefs.ambient ? copy.soundOff : copy.soundOn);
    soundBtn.setAttribute('aria-pressed', String(prefs.ambient));
  }
  soundBtn.addEventListener('click', () => {
    unlockAudio(); // this click counts as the user gesture browsers require
    prefs.ambient = !prefs.ambient;
    savePrefs(prefs);
    renderSoundBtn();
    syncSound();
  });
  function syncSound() {
    if (prefs.ambient && !isPaused() && !finishing) startAmbient(companion.species);
    else stopAmbient();
  }
  renderSoundBtn();

  const el = h('main', { class: 'screen running' },
    h('div', { class: 'running-top' }, soundBtn),
    h('div', { class: 'ring-wrap' }, ring, makePettable(art, {
      label: copy.pet(companion.name),
      mood: () => (isPaused() ? 'sleep' : 'focus'),
      onReact: () => activities.interrupt(),
    })),
    time, toNext, note, checklist, resumeBtn, endBtn);

  let finishing = false;
  let msgIdx = 0;
  let lastMsgSwap = 0;
  let hiddenAt: number | null = null;
  let wasPaused: boolean | null = null;
  let lastCheckpoint = Date.now();

  function cheer() {
    art.classList.remove('cheer');
    void art.getBoundingClientRect(); // restart the animation
    art.classList.add('cheer');
  }

  function finish() {
    if (finishing) return;
    finishing = true;
    stopAmbient();
    void svc.finish().then(opts.onFinish);
  }

  function paint() {
    // Background tab past the grace period: stop crediting time (pauseAt updates the clock synchronously).
    if (hiddenAt !== null && !isPaused() && Date.now() - hiddenAt > AWAY_GRACE_MS) {
      void svc.pauseAt(hiddenAt + AWAY_GRACE_MS);
    }
    const e = svc.elapsedMs();
    const frac = e / planned;
    time.textContent = formatClock(planned - e);
    ringFill.setAttribute('stroke-dashoffset', String(RING * (1 - frac)));
    setGrowth(art, frac);

    if (remainingAtStart !== null) {
      const left = Math.max(0, remainingAtStart - countedMinutes(e));
      toNext.textContent = copy.liveToNext(left, stageName(companion.species, stage.index + 1));
    }

    const paused = isPaused();
    if (paused) activities.interrupt();
    if (paused !== wasPaused) {
      wasPaused = paused;
      syncSound();
    }
    el.classList.toggle('is-paused', paused);
    setSleeping(art, paused);
    resumeBtn.hidden = !paused;
    if (!paused && Date.now() - lastMsgSwap > 60000) {
      note.textContent = lines[msgIdx++ % lines.length];
      lastMsgSwap = Date.now();
    }
    if (!paused && Date.now() - lastCheckpoint > CHECKPOINT_EVERY_MS) {
      lastCheckpoint = Date.now();
      void svc.checkpoint();
    }
    if (svc.isDone()) finish();
  }

  async function doResume() {
    await svc.resume();
    void acquireWakeLock();
    lastMsgSwap = 0;
    paint();
  }

  async function onVisibility() {
    if (document.hidden) {
      // Don't pause yet: short trips away are fine. Save progress in case the tab is closed.
      hiddenAt = Date.now();
      await svc.checkpoint();
      return;
    }
    const awayFor = hiddenAt === null ? 0 : Date.now() - hiddenAt;
    if (hiddenAt !== null && awayFor > AWAY_GRACE_MS) {
      // Credit the grace period, then pause from that moment on.
      if (!isPaused()) await svc.pauseAt(hiddenAt + AWAY_GRACE_MS);
      note.textContent = copy.paused(companion.name);
      lastMsgSwap = Date.now();
    }
    hiddenAt = null;
    void acquireWakeLock(); // the browser releases it while hidden
    paint();
  }

  if (opts.restored) note.textContent = copy.resumedAfterReload(companion.name);
  else void acquireWakeLock();

  document.addEventListener('visibilitychange', onVisibility);
  const tick = window.setInterval(paint, 250);
  paint();

  return {
    el,
    dispose: () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisibility);
      activities.dispose();
      stopAmbient();
      void releaseWakeLock();
    },
  };
}
