import { renderCompanion, setGrowth, setSleeping } from '../companion/companion';
import { copy } from '../copy';
import { formatClock, h } from '../dom';
import { totalMinutes } from '../domain/stats';
import type { SessionService } from '../domain/sessionService';
import { stageFor } from '../logic/growth';

const RING = 2 * Math.PI * 54;

/** Running session. Returns the element plus a cleanup function for timers/listeners. */
export function runningScreen(
  svc: SessionService,
  opts: { restored: boolean; onFinish: () => void },
): { el: HTMLElement; dispose: () => void } {
  const active = svc.active!;
  const planned = active.clock.plannedMs;
  const stage = stageFor(totalMinutes([...svc.history]));
  const companion = renderCompanion(stage.index, { label: `Your Bloomling, a ${stage.name}, growing` });

  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('viewBox', '0 0 120 120');
  ring.setAttribute('class', 'ring');
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = `<circle class="ring-track" cx="60" cy="60" r="54"/>
    <circle class="ring-fill" cx="60" cy="60" r="54" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>`;
  const ringFill = ring.querySelector('.ring-fill') as SVGCircleElement;

  const time = h('p', { class: 'clock', role: 'timer', 'aria-live': 'off' });
  const note = h('p', { class: 'note', 'aria-live': 'polite' });
  const resumeBtn = h('button', { class: 'btn primary', hidden: true, onclick: () => void doResume() }, copy.resume);
  const endBtn = h('button', { class: 'btn ghost', onclick: () => {
    if (confirm(copy.confirmEnd)) void svc.finish().then(opts.onFinish);
  } }, copy.endEarly);

  const el = h('main', { class: 'screen running' },
    active.label ? h('p', { class: 'focus-label' }, active.label) : null,
    h('div', { class: 'ring-wrap' }, ring, companion),
    time, note, resumeBtn, endBtn);

  let finishing = false;
  let msgIdx = 0;
  let lastMsgSwap = 0;

  function paint() {
    const e = svc.elapsedMs();
    const frac = e / planned;
    time.textContent = formatClock(planned - e);
    ringFill.setAttribute('stroke-dashoffset', String(RING * (1 - frac)));
    setGrowth(companion, frac);
    const paused = svc.active?.clock.runningSince === null;
    el.classList.toggle('is-paused', paused);
    setSleeping(companion, paused);
    resumeBtn.hidden = !paused;
    if (!paused && Date.now() - lastMsgSwap > 60000) {
      note.textContent = copy.running[msgIdx++ % copy.running.length];
      lastMsgSwap = Date.now();
    }
    if (!finishing && svc.isDone()) {
      finishing = true;
      void svc.finish().then(opts.onFinish);
    }
  }

  async function doResume() {
    await svc.resume();
    lastMsgSwap = 0;
    paint();
  }

  async function onVisibility() {
    if (document.hidden) {
      await svc.pause();
    } else {
      await svc.resume();
      note.textContent = copy.paused;
      lastMsgSwap = Date.now();
    }
    paint();
  }

  if (opts.restored) note.textContent = copy.resumedAfterReload;
  else lastMsgSwap = 0;

  document.addEventListener('visibilitychange', onVisibility);
  const tick = window.setInterval(paint, 250);
  paint();

  return {
    el,
    dispose: () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
