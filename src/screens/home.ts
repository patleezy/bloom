import { startActivities } from '../companion/activities';
import { renderCompanion } from '../companion/render';
import { SPECIES, stageName } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import { lastSevenDays, streak, totalMinutes } from '../domain/stats';
import type { CompanionProfile, SessionRecord } from '../domain/types';
import { minutesToNext, progressToNext, stageFor } from '../logic/growth';

export function homeScreen(
  companion: CompanionProfile,
  companionHistory: SessionRecord[],
  allHistory: readonly SessionRecord[],
  actions: { onStart: () => void; onSettings: () => void; onWhatsNew?: () => void },
): { el: HTMLElement; dispose: () => void } {
  const now = new Date();
  const total = totalMinutes(companionHistory);
  const stage = stageFor(total);
  const toNext = minutesToNext(total);
  const days = lastSevenDays([...allHistory], now);
  const s = streak([...allHistory], now);
  const maxDay = Math.max(25, ...days.map((d) => d.minutes));
  const sp = SPECIES[companion.species];
  const current = stageName(companion.species, stage.index);

  const pct = Math.round(progressToNext(total) * 100);
  const fill = h('div', { class: 'progress-fill' });
  fill.style.width = `${pct}%`;
  const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100',
    'aria-valuenow': String(pct), 'aria-label': 'Progress to next stage' }, fill);

  const strip = h('ol', { class: 'week', 'aria-label': 'Last 7 days' },
    ...days.map((d) => {
      const col = h('div', { class: 'week-bar' });
      col.style.height = `${Math.round((d.minutes / maxDay) * 100)}%`;
      const weekday = new Date(`${d.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });
      return h('li', { class: `week-day${d.isToday ? ' today' : ''}`, title: `${d.day}: ${d.minutes} min` },
        h('div', { class: 'week-track' }, col), h('span', {}, weekday));
    }));

  const art = renderCompanion(companion.species, stage.index, { label: `${companion.name}, a ${current}` });
  const activities = startActivities(art, companion.species, { gap: [25000, 50000] });

  const el = h('main', { class: 'screen home' },
    h('header', { class: 'topbar' },
      h('h1', { class: 'brand' }, copy.appName),
      h('div', { class: 'row' },
        h('span', { class: `streak${s ? ' on' : ''}` }, s ? copy.streak(s) : copy.streakZero),
        h('button', { class: 'icon-btn', 'aria-label': copy.settings, title: copy.settings, onclick: actions.onSettings }, '⚙'))),
    h('section', { class: 'stage-wrap' },
      art,
      h('p', { class: 'companion-name' }, companion.name),
      h('p', { class: 'stage-name' }, h('span', { class: `element-tag species-${companion.species}` }, `${sp.emoji} ${current}`)),
      bar,
      h('p', { class: 'muted' }, toNext === null
        ? copy.fullyGrown
        : copy.toNext(toNext, stageName(companion.species, stage.index + 1))),
      h('p', { class: 'muted small' }, copy.totalMinutes(total))),
    actions.onWhatsNew ? h('button', { class: 'pill', onclick: actions.onWhatsNew }, copy.whatsNewPill) : null,
    h('button', { class: 'btn primary big', onclick: actions.onStart }, copy.startCta),
    strip,
    h('footer', { class: 'foot' }, h('p', { class: 'muted small' }, copy.privacy)));
  return { el, dispose: activities.dispose };
}
