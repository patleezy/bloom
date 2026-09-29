import { renderCompanion } from '../companion/render';
import { stageName } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import { streak, totalMinutes } from '../domain/stats';
import type { CompanionProfile, SessionRecord } from '../domain/types';
import { stageFor } from '../logic/growth';

export function endScreen(
  record: SessionRecord,
  companion: CompanionProfile,
  companionHistory: SessionRecord[],
  allHistory: readonly SessionRecord[],
  actions: { onHome: () => void },
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
    s ? h('p', { class: 'streak on' }, copy.streak(s)) : null,
    h('button', { class: 'btn primary big', onclick: actions.onHome }, copy.home));
}
