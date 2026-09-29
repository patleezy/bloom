import { copy } from '../copy';
import { h } from '../dom';
import { MAX_TASKS } from '../domain/types';
import { icon } from '../icons';

const PRESETS = [25, 50, 90];

export function startScreen(actions: { onBegin: (minutes: number, tasks: string[]) => void; onBack: () => void }): HTMLElement {
  let minutes = 25;
  const custom = h('input', { type: 'number', min: '5', max: '240', step: '5', inputmode: 'numeric',
    class: 'custom-input', 'aria-label': 'Custom minutes', placeholder: copy.custom });

  const chips = PRESETS.map((m) =>
    h('button', { class: 'chip', type: 'button', 'aria-pressed': String(m === minutes), onclick: () => select(m) },
      h('strong', {}, String(m)), ` ${copy.minutesUnit}`));
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

  // Focus tasks: start with one field, add up to MAX_TASKS.
  const list = h('div', { class: 'task-inputs' });
  const addBtn = h('button', { class: 'btn link add-task', type: 'button', onclick: () => addField(true) },
    icon('plus'), copy.addTask);
  function fields() {
    return [...list.querySelectorAll('input')] as HTMLInputElement[];
  }
  function refresh() {
    addBtn.hidden = fields().length >= MAX_TASKS;
    list.querySelectorAll<HTMLButtonElement>('.remove-task').forEach((b) => (b.hidden = fields().length === 1));
  }
  function addField(focus: boolean) {
    const i = fields().length;
    if (i >= MAX_TASKS) return;
    const input = h('input', { type: 'text', maxlength: '60', class: 'label-input', autocomplete: 'off',
      placeholder: copy.taskPlaceholder(i), 'aria-label': `Focus item ${i + 1}` });
    const row = h('div', { class: 'task-input-row' }, input,
      h('button', { class: 'icon-btn remove-task', type: 'button', 'aria-label': copy.removeTask,
        onclick: () => { row.remove(); refresh(); } }, icon('close')));
    list.append(row);
    refresh();
    if (focus) input.focus();
  }
  addField(false);

  const form = h('form', { class: 'start-form' },
    h('button', { class: 'btn link back', type: 'button', onclick: actions.onBack }, icon('back'), copy.back),
    h('h2', {}, copy.pickDuration),
    h('div', { class: 'chips' }, ...chips, custom),
    h('div', { class: 'tasks-block' },
      h('h3', {}, copy.tasksTitle, ' ', h('span', { class: 'muted small' }, copy.tasksHint)),
      list, addBtn),
    h('button', { class: 'btn primary big', type: 'submit' }, copy.begin));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    actions.onBegin(minutes, fields().map((f) => f.value));
  });
  return h('main', { class: 'screen start' }, form);
}
