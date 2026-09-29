import './styles.css';
import { copy } from './copy';
import { SessionService } from './domain/sessionService';
import { buzz, chime, unlockAudio } from './feedback';
import { endScreen } from './screens/end';
import { homeScreen } from './screens/home';
import { startOnboarding } from './screens/onboarding';
import { runningScreen } from './screens/running';
import { settingsScreen } from './screens/settings';
import { startScreen } from './screens/start';
import { LocalRepository } from './state/localRepository';
import { applyTheme, clearPrefs, loadPrefs } from './state/prefs';

// Swap LocalRepository for an API-backed repository here when a backend exists.
const svc = new SessionService(new LocalRepository());
const prefs = loadPrefs();
const root = document.getElementById('app')!;
let dispose: (() => void) | null = null;

applyTheme(prefs.theme);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(prefs.theme));

function show(el: HTMLElement, cleanup: (() => void) | null = null) {
  dispose?.();
  dispose = cleanup;
  root.replaceChildren(el);
  window.scrollTo(0, 0);
  (el.querySelector('h1, h2') as HTMLElement | null)?.setAttribute('tabindex', '-1');
  (el.querySelector('h1, h2') as HTMLElement | null)?.focus({ preventScroll: true });
}

function goOnboarding() {
  startOnboarding(show, async (species, name) => {
    await svc.adopt(species, name);
    goHome();
  });
}

function goHome() {
  if (!svc.companion) return goOnboarding();
  show(homeScreen(svc.companion, svc.companionHistory, svc.history, { onStart: goStart, onSettings: goSettings }));
}

function goSettings() {
  show(settingsScreen(svc, prefs, {
    onBack: goHome,
    onImported: goSettings,
    onClear: async () => {
      if (!confirm(copy.confirmClear)) return;
      await svc.clearAll();
      clearPrefs();
      Object.assign(prefs, loadPrefs());
      applyTheme(prefs.theme);
      goHome();
    },
  }));
}

function goStart() {
  show(startScreen({
    onBack: goHome,
    onBegin: async (minutes, label) => {
      unlockAudio(); // must happen during a user gesture
      await svc.start(minutes, label);
      goRunning(false);
    },
  }));
}

function goRunning(restored: boolean) {
  const r = runningScreen(svc, {
    restored,
    onFinish: () => {
      const record = svc.history[svc.history.length - 1];
      if (record.completed) {
        if (prefs.sound) chime();
        buzz();
      }
      show(endScreen(record, svc.companion!, svc.companionHistory, svc.history, { onHome: goHome }));
    },
  });
  show(r.el, r.dispose);
}

async function boot() {
  await svc.init();
  if (svc.active && svc.companion) goRunning(true);
  else goHome();

  // Ask the browser not to evict our storage under pressure (no prompt on most browsers).
  void navigator.storage?.persist?.().catch(() => {});

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

void boot();
