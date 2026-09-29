import { renderCompanion, setGrowth, setSleeping } from '../companion/render';
import { stageName } from '../companion/species';
import { copy } from '../copy';
import { formatClock, h } from '../dom';
import type { SessionService } from '../domain/sessionService';
import { totalMinutes } from '../domain/stats';
import { countedMinutes, minutesToNext, stageFor } from '../logic/growth';
import { acquireWakeLock, releaseWakeLock } from '../wakeLock';

const RING = 2 * Math.PI * 54;

/** Running session. Returns the element plus a cleanup function for timers/listeners. */
export function runningScreen(
  svc: SessionService,
  opts: { restored: boolean; onFinish: () => void },
): { el: HTMLElement; dispose: () => void } {
  const active = svc.active!;
  const companion = svc.companion!;
  const planned = active.clock.plannedMs;
  const baseTotal = totalMinutes(svc.companionHistory);
  const stage = stageFor(baseTotal);
  const art = renderCompanion(companion.species, stage.index,
    { label: `${companion.name}, a ${stageName(companion.species, stage.index)}, growing` });
  const lines = copy.running(companion.name);
  const remainingAtStart = minutesToNext(baseTotal);

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

  const el = h('main', { class: 'screen running' },
    active.label ? h('p', { class: 'focus-label' }, active.label) : null,
    h('div', { class: 'ring-wrap' }, ring, art),
    time, toNext, note, resumeBtn, endBtn);

  let finishing = false;
  let msgIdx = 0;
  let lastMsgSwap = 0;

  function finish() {
    if (finishing) return;
    finishing = true;
    void svc.finish().then(opts.onFinish);
  }

  function paint() {
    const e = svc.elapsedMs();
    const frac = e / planned;
    time.textContent = formatClock(planned - e);
    ringFill.setAttribute('stroke-dashoffset', String(RING * (1 - frac)));
    setGrowth(art, frac);

    // Live progress toward the next stage, counting this session's minutes as they accrue.
    if (remainingAtStart !== null) {
      const left = Math.max(0, remainingAtStart - countedMinutes(e));
      toNext.textContent = copy.liveToNext(left, stageName(companion.species, stage.index + 1));
    }

    const paused = svc.active?.clock.runningSince === null;
    el.classList.toggle('is-paused', paused);
    setSleeping(art, paused);
    resumeBtn.hidden = !paused;
    if (!paused && Date.now() - lastMsgSwap > 60000) {
      note.textContent = lines[msgIdx++ % lines.length];
      lastMsgSwap = Date.now();
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
      await svc.pause();
    } else {
      await svc.resume();
      void acquireWakeLock(); // the browser releases it while hidden
      note.textContent = copy.paused(companion.name);
      lastMsgSwap = Date.now();
    }
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
      void releaseWakeLock();
    },
  };
}
