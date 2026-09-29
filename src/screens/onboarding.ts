import { renderCompanion } from '../companion/render';
import { SPECIES, SPECIES_ORDER } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import { icon } from '../icons';
import type { SpeciesId } from '../domain/types';
import { MAX_NAME } from '../state/localRepository';

type Show = (el: HTMLElement) => void;

/** Three steps: welcome → choose a starter → name it. */
export function startOnboarding(show: Show, onDone: (species: SpeciesId, name: string) => void): void {
  const welcome = () =>
    show(h('main', { class: 'screen onboarding' },
      h('div', { class: 'trio' }, ...SPECIES_ORDER.map((id) =>
        renderCompanion(id, 1, { label: SPECIES[id].name }))),
      h('h1', {}, copy.welcomeTitle),
      h('ul', { class: 'welcome-list' }, ...copy.welcomeLines.map((l) => h('li', {}, l))),
      h('button', { class: 'btn primary big', onclick: choose }, copy.welcomeCta)));

  const choose = () =>
    show(h('main', { class: 'screen onboarding' },
      h('h2', {}, copy.chooseTitle),
      h('p', { class: 'muted' }, copy.chooseSub),
      h('div', { class: 'starters' }, ...SPECIES_ORDER.map((id) => {
        const sp = SPECIES[id];
        return h('button', { class: `starter-card species-${id}`, onclick: () => name(id) },
          renderCompanion(id, 2, { label: sp.name }),
          h('span', { class: 'starter-text' },
            h('strong', {}, sp.name),
            h('span', { class: 'element-tag' }, icon(sp.icon), sp.element),
            h('span', { class: 'muted small' }, sp.blurb)));
      })),
      h('button', { class: 'btn link back', onclick: welcome }, icon('back'), copy.back)));

  const name = (id: SpeciesId) => {
    const sp = SPECIES[id];
    const input = h('input', { type: 'text', class: 'label-input', maxlength: String(MAX_NAME),
      placeholder: copy.namePlaceholder, value: sp.name, autocomplete: 'off', 'aria-label': copy.namePlaceholder });
    const form = h('form', { class: 'start-form' },
      renderCompanion(id, 0, { label: sp.name }),
      h('h2', {}, copy.nameTitle(sp.name)),
      input,
      h('button', { class: 'btn primary big', type: 'submit' }, copy.nameCta),
      h('button', { class: 'btn link back', type: 'button', onclick: choose }, icon('back'), copy.back));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      onDone(id, input.value);
    });
    show(h('main', { class: 'screen onboarding' }, form));
    input.select();
  };

  welcome();
}
