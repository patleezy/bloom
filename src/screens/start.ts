import { copy } from '../copy';
import { h } from '../dom';

const PRESETS = [25, 50, 90];

export function startScreen(actions: { onBegin: (minutes: number, label: string) => void; onBack: () => void }): HTMLElement {
  let minutes = 25;
  const custom = h('input', { type: 'number', min: '5', max: '240', step: '5', inputmode: 'numeric',
    class: 'custom-input', 'aria-label': 'Custom minutes', placeholder: copy.custom });
  const label = h('input', { type: 'text', maxlength: '60', class: 'label-input',
    placeholder: copy.labelPlaceholder, autocomplete: 'off', 'aria-label': 'Focus label' });

  const chips = PRESETS.map((m) =>
    h('button', { class: 'chip', type: 'button', 'aria-pressed': String(m === minutes), onclick: () => select(m) },
      `${m} ${copy.minutesUnit}`));
  function select(m: number | null) {
    if (m !== null) {
      minutes = m;
      custom.value = '';
    }
    chips.forEach((c, i) => c.setAttribute('aria-pressed', String(PRESETS[i] === m)));
  }
  custom.addEventListener('input', () => {
    const v = Number(custom.value);
    if (Number.isFinite(v) && v >= 1) {
      minutes = Math.min(240, Math.round(v));
      select(null);
    }
  });

  const form = h('form', { class: 'start-form' },
    h('h2', {}, copy.pickDuration),
    h('div', { class: 'chips' }, ...chips, custom),
    label,
    h('button', { class: 'btn primary big', type: 'submit' }, copy.begin),
    h('button', { class: 'btn link', type: 'button', onclick: actions.onBack }, copy.back));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    actions.onBegin(minutes, label.value);
  });
  return h('main', { class: 'screen start' }, form);
}
