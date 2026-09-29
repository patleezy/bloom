import { renderCompanion } from '../companion/render';
import { stageName } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import { icon } from '../icons';
import { streak, totalMinutes } from '../domain/stats';
import type { CompanionProfile, SessionRecord } from '../domain/types';
import { stageFor } from '../logic/growth';

export function endScreen(
  record: SessionRecord,
  companion: CompanionProfile,
  companionHistory: SessionRecord[],
  allHistory: readonly SessionRecord[],
  actions: { onHome: () => void; breakOffer?: { minutes: number; long: boolean; onBreak: () => void } },
): HTMLElement {
  const after = totalMinutes(companionHistory);
  const before = after - record.countedMinutes;
  const stageBefore = stageFor(before);
  const stageAfter = stageFor(after);
  const grew = stageAfter.index > stageBefore.index;
  const s = streak([...allHistory], new Date());
  const newStage = stageName(companion.species, stageAfter.index);

  const art = renderCompanion(companion.species, stageAfter.index, { label: `${companion.name}, a ${newStage}` });
  art.classList.add(grew ? 'grew' : 'celebrate');

  return h('main', { class: 'screen end' },
    art,
    h('h2', {}, record.completed ? copy.doneTitle : copy.earlyTitle),
    grew ? h('p', { class: 'stage-up' }, copy.stageUp(companion.name, newStage)) : null,
    h('p', {}, record.countedMinutes > 0
      ? copy.doneBody(record.countedMinutes, companion.name)
      : copy.shortBody(companion.name)),
    record.tasks.length
      ? h('section', { class: 'card task-summary' },
          h('h3', {}, copy.tasksDone(record.tasks.filter((t) => t.done).length, record.tasks.length)),
          h('ul', { class: 'checklist readonly' }, ...record.tasks.map((t) =>
            h('li', { class: t.done ? 'done' : '' }, h('span', { class: 'check', 'aria-hidden': 'true' }, icon('check')), h('span', {}, t.text)))))
      : null,
    s ? h('p', { class: 'stat on' }, icon('sprout'), h('strong', {}, copy.streakBadge(s))) : null,
    actions.breakOffer
      ? h('div', { class: 'stack' },
          actions.breakOffer.long ? h('p', { class: 'muted small' }, copy.breakOfferLong) : null,
          h('button', { class: 'btn primary big', onclick: actions.breakOffer.onBreak },
            icon('cup'), ' ', copy.breakOffer(actions.breakOffer.minutes)),
          h('button', { class: 'btn ghost', onclick: actions.onHome }, copy.home))
      : h('button', { class: 'btn primary big', onclick: actions.onHome }, copy.home));
}
