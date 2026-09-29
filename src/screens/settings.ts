import { APP_VERSION } from '../changelog';
import { copy } from '../copy';
import { h } from '../dom';
import { icon } from '../icons';
import type { SessionService } from '../domain/sessionService';
import { dayKey } from '../logic/dates';
import { MAX_NAME } from '../state/localRepository';
import { applyTheme, savePrefs, type Prefs, type Theme } from '../state/prefs';

const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export function settingsScreen(
  svc: SessionService,
  prefs: Prefs,
  actions: { onBack: () => void; onClear: () => void; onImported: () => void; onWhatsNew: () => void },
): HTMLElement {
  const status = h('p', { class: 'muted small', role: 'status' });

  // Theme
  const themes: Theme[] = ['auto', 'light', 'night'];
  const themeBtns = themes.map((t) =>
    h('button', { class: 'chip', type: 'button', 'aria-pressed': String(prefs.theme === t), onclick: () => {
      prefs.theme = t;
      savePrefs(prefs);
      applyTheme(t);
      themeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(themes[i] === t)));
    } }, copy.themes[t]));

  // Sound
  const sound = h('input', { type: 'checkbox', class: 'toggle' });
  sound.checked = prefs.sound;
  sound.addEventListener('change', () => {
    prefs.sound = sound.checked;
    savePrefs(prefs);
  });

  // Rename
  const nameInput = h('input', { type: 'text', class: 'label-input', maxlength: String(MAX_NAME),
    autocomplete: 'off', 'aria-label': copy.rename, value: svc.companion?.name ?? '' });
  const renameForm = h('form', { class: 'row' }, nameInput, h('button', { class: 'btn primary', type: 'submit' }, copy.save));
  renameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await svc.rename(nameInput.value);
    nameInput.value = svc.companion?.name ?? '';
    status.textContent = copy.saved;
  });

  // Backup: a file download created locally — nothing is uploaded anywhere.
  const exportBackup = () => {
    const blob = new Blob([svc.exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `bloom-backup-${dayKey(new Date())}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      status.textContent = copy.importBad;
      return;
    }
    if (!confirm(copy.importConfirm)) return;
    const ok = await svc.importBackup(await file.text());
    status.textContent = ok ? copy.importOk : copy.importBad;
    if (ok) actions.onImported();
  });

  return h('main', { class: 'screen settings' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn link back', onclick: actions.onBack }, icon('back'), copy.back),
      h('h2', {}, copy.settings),
      h('span', { class: 'spacer' })),
    h('section', { class: 'card' },
      h('h3', {}, copy.theme),
      h('div', { class: 'chips three' }, ...themeBtns)),
    h('section', { class: 'card' },
      h('label', { class: 'row between' }, h('span', {}, copy.sound), sound)),
    h('section', { class: 'card' },
      h('h3', {}, copy.rename),
      renameForm),
    h('section', { class: 'card' },
      h('h3', {}, copy.backupTitle),
      h('p', { class: 'muted small' }, copy.backupHelp),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn', onclick: exportBackup }, copy.exportCta),
        h('button', { class: 'btn', onclick: () => fileInput.click() }, copy.importCta)),
      fileInput,
      h('p', { class: 'muted small' }, copy.installHint)),
    status,
    h('section', { class: 'card' },
      h('button', { class: 'row between plain', onclick: actions.onWhatsNew },
        h('span', {}, copy.whatsNew), icon('chevron', 'muted'))),
    h('footer', { class: 'foot' },
      h('p', { class: 'muted small' }, copy.privacy),
      h('p', { class: 'muted small' }, copy.version(APP_VERSION)),
      h('button', { class: 'btn link small danger', onclick: actions.onClear }, copy.clearData)));
}
