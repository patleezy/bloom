import { renderCompanion } from '../companion/render';
import { SPECIES } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import { MAX_TASKS, type SpeciesId } from '../domain/types';

/** One choice in the "Who's joining you?" picker. Starters you haven't met yet are adopted on Begin. */
export interface CompanionChoice {
  species: SpeciesId;
  companionId: string | null; // null = not adopted yet
  name: string;
  stage: number;
}
import { icon } from '../icons';

const PRESETS = [25, 50, 90];

export function startScreen(
  actions: { onBegin: (minutes: number, tasks: string[], who: CompanionChoice) => void; onBack: () => void },
  initial: { minutes?: number; tasks?: string[] } = {},
  choices: CompanionChoice[] = [],
  selectedSpecies?: SpeciesId,
): HTMLElement {
  // Who's joining: a radio group of companion faces, defaulting to the current companion.
  let who = choices.find((c) => c.species === selectedSpecies) ?? choices[0];
  const whoButtons = choices.map((c) => {
    const art = renderCompanion(c.species, c.stage, { label: '' });
    art.removeAttribute('role');
    art.setAttribute('aria-hidden', 'true');
    art.classList.add('mini');
    const btn = h('button', { class: `who species-${c.species}`, type: 'button', role: 'radio',
      'aria-checked': String(c === who),
      'aria-label': c.companionId ? c.name : copy.whoMeet(SPECIES[c.species].name) },
      art, h('span', { class: 'who-name' }, c.companionId ? c.name : SPECIES[c.species].name),
      c.companionId ? null : h('span', { class: 'who-new' }, copy.whoNew));
    btn.addEventListener('click', () => {
      who = c;
      whoButtons.forEach((b, i) => b.setAttribute('aria-checked', String(choices[i] === c)));
    });
    return btn;
  });
  const whoBlock = choices.length > 1
    ? h('div', { class: 'who-block' },
        h('h3', { id: 'who-label' }, copy.whoTitle),
        h('div', { class: 'who-row', role: 'radiogroup', 'aria-labelledby': 'who-label' }, ...whoButtons))
    : null;

  let minutes = initial.minutes ?? 25;
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
  // Carry over anything unfinished from the last session.
  const carry = (initial.tasks ?? []).slice(0, MAX_TASKS);
  if (carry.length) {
    carry.forEach(() => addField(false));
    fields().forEach((f, i) => (f.value = carry[i]));
  } else {
    addField(false);
  }
  if (!PRESETS.includes(minutes)) {
    custom.value = String(minutes);
    select(null);
  }

  const form = h('form', { class: 'start-form' },
    h('button', { class: 'btn link back', type: 'button', onclick: actions.onBack }, icon('back'), copy.back),
    whoBlock,
    h('h2', {}, copy.pickDuration),
    h('div', { class: 'chips' }, ...chips, custom),
    h('div', { class: 'tasks-block' },
      h('h3', {}, copy.tasksTitle, ' ', h('span', { class: 'muted small' }, copy.tasksHint)),
      list, addBtn),
    h('button', { class: 'btn primary big', type: 'submit' }, copy.begin));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    actions.onBegin(minutes, fields().map((f) => f.value), who);
  });
  return h('main', { class: 'screen start' }, form);
}
