import { renderCompanion } from '../companion/render';
import { SPECIES, stageName } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import { evolutionPath } from '../domain/evolution';
import type { CompanionProfile } from '../domain/types';
import { icon } from '../icons';

/**
 * Every growth stage in a row: reached stages in full color, the current one highlighted,
 * the next one as a named silhouette, and later ones as mystery silhouettes.
 */
export function evolutionScreen(companion: CompanionProfile, totalMinutes: number, opts: { onBack: () => void }): HTMLElement {
  const sp = SPECIES[companion.species];
  const steps = evolutionPath(totalMinutes);

  const list = h('ol', { class: 'evo-list', 'aria-label': copy.evoTitle(companion.name) },
    ...steps.map((s) => {
      const known = s.state === 'reached' || s.state === 'current';
      const name = known || s.state === 'next' ? stageName(companion.species, s.index) : copy.evoUnknown;
      const art = renderCompanion(companion.species, s.index, { label: '' });
      art.removeAttribute('role');
      art.setAttribute('aria-hidden', 'true');
      if (!known) art.classList.add('silhouette');

      const detail = s.state === 'current'
        ? copy.evoCurrent
        : s.state === 'reached'
          ? copy.evoReached
          : copy.evoNeeds(s.minutesLeft);
      return h('li', { class: `evo-step ${s.state}`,
        'aria-label': `${copy.evoStage(s.index + 1)}: ${name}. ${detail}` },
        h('div', { class: 'evo-art' }, art),
        h('div', { class: 'evo-text' },
          h('span', { class: 'evo-num' }, copy.evoStage(s.index + 1)),
          h('strong', {}, name),
          h('span', { class: 'muted small' }, detail)),
        s.state === 'current' ? h('span', { class: 'evo-here' }, copy.evoHere) : null);
    }));

  return h('main', { class: 'screen settings evolution' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn link back', onclick: opts.onBack }, icon('back'), copy.back),
      h('h2', {}, copy.evoTitle(companion.name)),
      h('span', { class: 'spacer' })),
    h('p', { class: 'muted small' }, h('span', { class: `element-tag species-${companion.species}` }, icon(sp.icon), sp.element),
      ' ', copy.evoIntro(totalMinutes)),
    list);
}
