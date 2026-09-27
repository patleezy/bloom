import { renderCompanion } from '../companion/companion';
import { copy } from '../copy';
import { h } from '../dom';
import { lastSevenDays, streak, totalMinutes } from '../domain/stats';
import type { SessionRecord } from '../domain/types';
import { STAGES, progressToNext, stageFor } from '../logic/growth';

export function homeScreen(
  history: readonly SessionRecord[],
  actions: { onStart: () => void; onClear: () => void },
): HTMLElement {
  const now = new Date();
  const total = totalMinutes([...history]);
  const stage = stageFor(total);
  const next = STAGES[stage.index + 1];
  const days = lastSevenDays([...history], now);
  const s = streak([...history], now);
  const maxDay = Math.max(25, ...days.map((d) => d.minutes));

  const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' },
    h('div', { class: 'progress-fill' }));
  const pct = Math.round(progressToNext(total) * 100);
  bar.setAttribute('aria-valuenow', String(pct));
  (bar.firstChild as HTMLElement).style.width = `${pct}%`;

  const strip = h('ol', { class: 'week', 'aria-label': 'Last 7 days' },
    ...days.map((d) => {
      const col = h('div', { class: 'week-bar' });
      col.style.height = `${Math.round((d.minutes / maxDay) * 100)}%`;
      const weekday = new Date(`${d.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });
      return h('li', { class: `week-day${d.isToday ? ' today' : ''}${d.minutes ? ' active' : ''}`,
        title: `${d.day}: ${d.minutes} min` },
        h('div', { class: 'week-track' }, col), h('span', {}, weekday));
    }));

  return h('main', { class: 'screen home' },
    h('header', { class: 'topbar' },
      h('h1', { class: 'brand' }, copy.appName),
      h('span', { class: `streak${s ? ' on' : ''}` }, s ? copy.streak(s) : copy.streakZero)),
    h('section', { class: 'stage-wrap' },
      renderCompanion(stage.index, { label: `Your Bloomling, a ${stage.name}` }),
      h('p', { class: 'stage-name' }, stage.name),
      bar,
      h('p', { class: 'muted' }, next ? copy.toNext(next.threshold - total, next.name) : copy.fullyGrown),
      h('p', { class: 'muted small' }, copy.totalMinutes(total))),
    h('button', { class: 'btn primary big', onclick: actions.onStart }, copy.startCta),
    strip,
    h('footer', { class: 'foot' },
      h('p', { class: 'muted small' }, copy.privacy),
      h('button', { class: 'btn link small', onclick: actions.onClear }, copy.clearData)));
}
