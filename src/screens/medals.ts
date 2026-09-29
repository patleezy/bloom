import { copy } from '../copy';
import { h } from '../dom';
import { UNLOCKABLES, type Medal, type MedalStatus } from '../domain/medals';
import { icon } from '../icons';

/** Human-friendly progress, e.g. "2h 5m of 10h", "5 of 7 days", "Stage 2 of 6". */
export function progressLabel(s: MedalStatus): string {
  const { category } = s.medal;
  if (category === 'time') return copy.medalProgress(fmtMinutes(s.current), fmtMinutes(s.target));
  if (category === 'streak') return copy.medalProgress(String(s.current), copy.days(s.target));
  if (category === 'growth') return copy.medalProgress(copy.evoStage(s.current + 1), String(s.target + 1));
  return copy.medalProgress(String(s.current), String(s.target));
}

function fmtMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function medalBadge(medal: Medal, earned: boolean, size: 'lg' | 'sm' = 'lg'): HTMLElement {
  return h('span', { class: `medal-badge cat-${medal.category} ${earned ? 'earned' : 'locked'} ${size}`, 'aria-hidden': 'true' },
    icon(earned ? medal.icon : 'lock'));
}

function bar(current: number, target: number, label: string): HTMLElement {
  const pct = Math.round((current / target) * 100);
  const fill = h('div', { class: 'progress-fill' });
  fill.style.width = `${pct}%`;
  return h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100',
    'aria-valuenow': String(pct), 'aria-label': label }, fill);
}

export function medalsScreen(statuses: MedalStatus[], opts: { onBack: () => void }): HTMLElement {
  const earnedCount = statuses.filter((s) => s.earned).length;
  // Earned first (newest first), then the closest-to-earning.
  const ordered = [...statuses].sort((a, b) =>
    a.earned !== b.earned ? (a.earned ? -1 : 1)
      : a.earned ? (b.earnedAt ?? 0) - (a.earnedAt ?? 0)
        : b.current / b.target - a.current / a.target);

  const grid = h('ul', { class: 'medal-grid' }, ...ordered.map((s) => {
    const detail = s.earned
      ? copy.medalEarnedOn(new Date(s.earnedAt!).toLocaleDateString(undefined, { dateStyle: 'medium' }))
      : progressLabel(s);
    return h('li', { class: `medal-card ${s.earned ? 'earned' : 'locked'}`,
      'aria-label': `${s.medal.name}. ${s.medal.description} ${s.earned ? detail : `${copy.medalLocked}. ${detail}`}` },
      medalBadge(s.medal, s.earned),
      h('strong', {}, s.medal.name),
      h('span', { class: 'muted small' }, s.medal.description),
      s.earned ? null : bar(s.current, s.target, s.medal.name),
      h('span', { class: 'small medal-detail' }, detail));
  }));

  const friends = h('ul', { class: 'unlock-list' }, ...UNLOCKABLES.map((u) => {
    const s = statuses.find((x) => x.medal.id === u.medalId)!;
    return h('li', { class: `unlock-card ${s.earned ? 'ready' : ''}`,
      'aria-label': `${u.name}, ${u.element}. ${u.blurb} ${s.earned ? copy.unlockReady(u.name) : `${u.requirement}. ${progressLabel(s)}`}` },
      h('span', { class: 'unlock-art', 'aria-hidden': 'true' }, icon(s.earned ? u.icon : 'lock')),
      h('div', { class: 'unlock-text' },
        h('strong', {}, `${u.name} · ${u.element}`),
        h('span', { class: 'muted small' }, u.blurb),
        s.earned
          ? h('span', { class: 'small unlock-status' }, copy.unlockReady(u.name))
          : h('div', { class: 'unlock-progress' },
              h('span', { class: 'small' }, `${u.requirement} · ${progressLabel(s)}`),
              bar(s.current, s.target, u.requirement))));
  }));

  return h('main', { class: 'screen settings medals' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn link back', onclick: opts.onBack }, icon('back'), copy.back),
      h('h2', {}, copy.medalsTitle),
      h('span', { class: 'spacer' })),
    h('p', { class: 'muted' }, copy.medalsSummary(earnedCount, statuses.length)),
    h('p', { class: 'muted small' }, copy.medalsForever),
    grid,
    h('section', { class: 'unlock-section' },
      h('h3', {}, copy.unlocksTitle),
      h('p', { class: 'muted small' }, copy.unlocksIntro),
      friends));
}
