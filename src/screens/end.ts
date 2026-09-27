import { renderCompanion } from '../companion/sprout';
import { copy } from '../copy';
import { h } from '../dom';
import { streak, totalMinutes } from '../domain/stats';
import type { SessionRecord } from '../domain/types';
import { stageFor } from '../logic/growth';

export function endScreen(
  record: SessionRecord,
  history: readonly SessionRecord[],
  actions: { onHome: () => void },
): HTMLElement {
  const after = totalMinutes([...history]);
  const before = after - record.countedMinutes;
  const stageBefore = stageFor(before);
  const stageAfter = stageFor(after);
  const grew = stageAfter.index > stageBefore.index;
  const s = streak([...history], new Date());

  const companion = renderCompanion(stageAfter.index, { label: `Your companion, a ${stageAfter.name}` });
  companion.classList.add(grew ? 'grew' : 'celebrate');

  return h('main', { class: 'screen end' },
    companion,
    h('h2', {}, record.completed ? copy.doneTitle : copy.earlyTitle),
    grew ? h('p', { class: 'stage-up' }, copy.stageUp(stageAfter.name)) : null,
    h('p', {}, record.countedMinutes > 0 ? copy.doneBody(record.countedMinutes) : copy.shortBody),
    s ? h('p', { class: 'streak on' }, copy.streak(s)) : null,
    h('button', { class: 'btn primary big', onclick: actions.onHome }, copy.home));
}
