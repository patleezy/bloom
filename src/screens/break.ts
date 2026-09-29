import { renderCompanion, setSleeping } from '../companion/render';
import { copy } from '../copy';
import { formatClock, h } from '../dom';
import type { CompanionProfile } from '../domain/types';
import { icon } from '../icons';
import * as clock from '../logic/timer';

const RING = 2 * Math.PI * 54;

/**
 * A short rest between sessions. Breaks never count toward growth and keep running in the
 * background (resting away from the screen is the point). The companion snacks, then naps.
 */
export function breakScreen(
  companion: CompanionProfile,
  stage: number,
  minutes: number,
  opts: { onDone: () => void; onNext: () => void; onHome: () => void },
): { el: HTMLElement; dispose: () => void } {
  const c = clock.newClock(minutes * 60000, Date.now());
  const art = renderCompanion(companion.species, stage, { label: `${companion.name}, on a break` });
  art.classList.add('act', 'act-snack');

  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('viewBox', '0 0 120 120');
  ring.setAttribute('class', 'ring');
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = `<circle class="ring-track" cx="60" cy="60" r="54"/>
    <circle class="ring-fill" cx="60" cy="60" r="54" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>`;
  const ringFill = ring.querySelector('.ring-fill') as SVGCircleElement;

  const title = h('h2', {}, icon('cup'), ' ', copy.breakTitle);
  const time = h('p', { class: 'clock', role: 'timer' });
  const status = h('p', { class: 'note', 'aria-live': 'polite' }, copy.breakSnack(companion.name));
  const tip = h('p', { class: 'muted' }, copy.breakTips[Math.floor(Math.random() * copy.breakTips.length)]);
  const actions = h('div', { class: 'stack' },
    h('button', { class: 'btn ghost', onclick: () => finish(true) }, copy.breakReady));

  const el = h('main', { class: 'screen running break' },
    title, h('div', { class: 'ring-wrap' }, ring, art), time, status, tip, actions);

  let done = false;
  function finish(early: boolean) {
    if (done) return;
    done = true;
    window.clearInterval(tick);
    art.classList.remove('act', 'act-snack');
    setSleeping(art, false);
    art.classList.add('celebrate');
    ringFill.setAttribute('stroke-dashoffset', '0');
    time.textContent = '0:00';
    title.replaceChildren(copy.breakOver);
    status.textContent = copy.breakOverBody(companion.name);
    tip.remove();
    actions.replaceChildren(
      h('button', { class: 'btn primary big', onclick: opts.onNext }, copy.nextRound),
      h('button', { class: 'btn ghost', onclick: opts.onHome }, copy.home));
    if (!early) opts.onDone();
  }

  function paint() {
    const now = Date.now();
    const frac = clock.elapsed(c, now) / c.plannedMs;
    time.textContent = formatClock(clock.remaining(c, now));
    ringFill.setAttribute('stroke-dashoffset', String(RING * (1 - frac)));
    // Snack for the first part of the break, then a nap.
    if (frac > 0.4 && art.classList.contains('act-snack')) {
      art.classList.remove('act', 'act-snack');
      setSleeping(art, true);
      status.textContent = copy.breakNap(companion.name);
    }
    if (clock.isDone(c, now)) finish(false);
  }

  const tick = window.setInterval(paint, 250);
  paint();
  return { el, dispose: () => window.clearInterval(tick) };
}
