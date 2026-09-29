import { startActivities } from '../companion/activities';
import { makePettable } from '../companion/react';
import { renderCompanion } from '../companion/render';
import { SPECIES, stageName } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import { evaluateMedals, nearestUnlock } from '../domain/medals';
import { lastSevenDays, streak, totalMinutes } from '../domain/stats';
import { progressLabel } from './medals';
import type { CompanionProfile, SessionRecord } from '../domain/types';
import { icon } from '../icons';
import { minutesToNext, progressToNext, stageFor } from '../logic/growth';

export function homeScreen(
  companion: CompanionProfile,
  companionHistory: SessionRecord[],
  allHistory: readonly SessionRecord[],
  opts: {
    showIntro: boolean;
    onDismissIntro: () => void;
    onStart: () => void;
    onSettings: () => void;
    onWhatsNew?: () => void;
    onEvolution: () => void;
    onMedals: () => void;
    onGarden: () => void;
  },
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

  // Now → next: current stage, progress bar, and a silhouette of what's coming. Opens the full path.
  const mini = (idx: number, silhouette: boolean) => {
    const a = renderCompanion(companion.species, idx, { label: '' });
    a.removeAttribute('role');
    a.setAttribute('aria-hidden', 'true');
    a.classList.add('mini');
    if (silhouette) a.classList.add('silhouette');
    return a;
  };
  const journey = h('button', { class: 'journey', type: 'button', onclick: opts.onEvolution, 'aria-label': copy.evoOpen },
    mini(stage.index, false), bar, toNext === null ? mini(stage.index, false) : mini(stage.index + 1, true));

  const weekEmpty = days.every((d) => d.minutes === 0);
  const strip = h('section', { class: 'week-card' },
    h('ol', { class: 'week', 'aria-label': 'Last 7 days' },
      ...days.map((d) => {
        const col = h('div', { class: 'week-bar' });
        col.style.height = `${Math.round((d.minutes / maxDay) * 100)}%`;
        const weekday = new Date(`${d.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });
        return h('li', { class: `week-day${d.isToday ? ' today' : ''}`, title: `${d.day}: ${d.minutes} min` },
          h('div', { class: 'week-track' }, col), h('span', {}, weekday));
      })),
    weekEmpty ? h('p', { class: 'muted small' }, copy.weekEmpty) : null);

  const art = renderCompanion(companion.species, stage.index, { label: `${companion.name}, a ${current}` });
  const activities = startActivities(art, companion.species, { gap: [25000, 50000] });
  const petBtn = makePettable(art, {
    label: copy.pet(companion.name),
    mood: () => 'play',
    onReact: () => activities.interrupt(),
  });

  const intro = opts.showIntro
    ? h('aside', { class: 'intro-card' },
        h('p', {}, copy.introCard),
        h('button', { class: 'icon-btn small', 'aria-label': copy.dismiss, onclick: () => {
          intro?.remove();
          opts.onDismissIntro();
        } }, icon('close')))
    : null;

  // Medals badge, plus a gentle nudge once an unlock is at least halfway there.
  const medals = evaluateMedals(allHistory);
  const medalCount = medals.filter((m) => m.earned).length;
  const next = nearestUnlock(medals);
  const hint = next && next.status.current / next.status.target >= 0.5
    ? h('button', { class: 'unlock-hint', type: 'button', onclick: opts.onMedals }, icon(next.unlock.icon),
        copy.unlockHint(next.unlock.requirement, progressLabel(next.status), next.unlock.name))
    : null;

  const el = h('main', { class: 'screen home' },
    h('header', { class: 'topbar' },
      h('img', { class: 'logo', src: './logo.svg', alt: copy.appName, width: '112', height: '35' }),
      h('div', { class: 'row' },
        h('button', { class: 'icon-btn', 'aria-label': copy.gardenOpen, title: copy.gardenTitle, onclick: opts.onGarden }, icon('garden')),
        h('button', { class: 'icon-btn', 'aria-label': copy.settings, title: copy.settings, onclick: opts.onSettings }, icon('settings')))),
    intro,
    opts.onWhatsNew ? h('button', { class: 'pill', onclick: opts.onWhatsNew }, icon('sparkle'), copy.whatsNewPill) : null,
    h('section', { class: 'stage-wrap' },
      petBtn,
      h('p', { class: 'companion-name' }, companion.name),
      h('p', { class: 'stage-name' },
        h('span', { class: `element-tag species-${companion.species}` }, icon(sp.icon), current)),
      journey,
      h('p', { class: 'muted' }, toNext === null
        ? copy.fullyGrown
        : copy.toNext(toNext, stageName(companion.species, stage.index + 1))),
      h('p', { class: 'muted small' }, copy.totalMinutes(total))),
    h('div', { class: 'stats-row' },
      h('div', { class: `stat${s ? ' on' : ''}` }, icon('sprout'),
        h('span', {}, h('strong', {}, s ? copy.streak(s) : copy.streakZero), h('small', {}, copy.streakTitle))),
      h('button', { class: `stat${medalCount ? ' on' : ''}`, type: 'button', onclick: opts.onMedals, 'aria-label': `${copy.medalCount(medalCount)}. ${copy.medalsOpen}` },
        icon('medal'), h('span', {}, h('strong', {}, String(medalCount)), h('small', {}, copy.medalsTitle)))),
    hint,
    h('button', { class: 'btn primary big', onclick: opts.onStart }, copy.startCta),
    strip,
    h('footer', { class: 'foot' }, h('p', { class: 'muted small' }, copy.privacy)));
  return { el, dispose: activities.dispose };
}
