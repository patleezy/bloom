import { APP_VERSION, CHANGELOG } from '../changelog';
import { copy } from '../copy';
import { h } from '../dom';
import { icon } from '../icons';

export function whatsNewScreen(actions: { onBack: () => void }): HTMLElement {
  return h('main', { class: 'screen settings whats-new' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn link back', onclick: actions.onBack }, icon('back'), copy.back),
      h('h2', {}, copy.whatsNew),
      h('span', { class: 'spacer' })),
    ...CHANGELOG.map((r) =>
      h('section', { class: 'card release' },
        h('div', { class: 'row between' },
          h('h3', {}, r.title),
          h('span', { class: `version-tag${r.version === APP_VERSION ? ' current' : ''}` }, `v${r.version}`)),
        h('p', { class: 'muted small' }, new Date(`${r.date}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })),
        h('ul', { class: 'release-notes' }, ...r.notes.map((n) => h('li', {}, n))))));
}
