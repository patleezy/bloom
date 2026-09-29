// Fonts are bundled with the app (no third-party font CDN), Latin subset only.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import './styles.css';
import { copy } from './copy';
import { SessionService } from './domain/sessionService';
import { buzz, chime, unlockAudio } from './feedback';
import { breakMinutesAfter, LONG_BREAK_MIN } from './domain/breaks';
import { totalMinutes } from './domain/stats';
import { stageFor } from './logic/growth';
import { breakScreen } from './screens/break';
import { endScreen } from './screens/end';
import { homeScreen } from './screens/home';
import { startOnboarding } from './screens/onboarding';
import { runningScreen } from './screens/running';
import { settingsScreen } from './screens/settings';
import { startScreen } from './screens/start';
import { LocalRepository } from './state/localRepository';
import { APP_VERSION } from './changelog';
import { whatsNewScreen } from './screens/whatsNew';
import { evolutionScreen } from './screens/evolution';
import { applyTheme, clearPrefs, loadPrefs, savePrefs } from './state/prefs';

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
    markSeen(); // new users don't need release notes
    goHome();
  });
}

function goHome() {
  if (!svc.companion) return goOnboarding();
  const unseen = prefs.lastSeenVersion !== APP_VERSION;
  const home = homeScreen(svc.companion, svc.companionHistory, svc.history, {
    showIntro: !prefs.introDismissed,
    onDismissIntro: () => {
      prefs.introDismissed = true;
      savePrefs(prefs);
    },
    onStart: goStart,
    onSettings: goSettings,
    onWhatsNew: unseen ? () => goWhatsNew(goHome) : undefined,
    onEvolution: () => show(evolutionScreen(svc.companion!, totalMinutes(svc.companionHistory), { onBack: goHome })),
  });
  show(home.el, home.dispose);
}

function markSeen() {
  prefs.lastSeenVersion = APP_VERSION;
  savePrefs(prefs);
}

function goWhatsNew(back: () => void) {
  markSeen();
  show(whatsNewScreen({ onBack: back }));
}

function goSettings() {
  show(settingsScreen(svc, prefs, {
    onBack: goHome,
    onImported: goSettings,
    onWhatsNew: () => goWhatsNew(goSettings),
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

let lastSession: { minutes: number; tasks: string[] } | null = null;

function goStart() {
  show(startScreen({
    onBack: goHome,
    onBegin: async (minutes, tasks) => {
      unlockAudio(); // must happen during a user gesture
      await svc.start(minutes, tasks);
      goRunning(false);
    },
  }, lastSession ?? {}));
}

function goBreak(minutes: number) {
  const c = svc.companion!;
  const stage = stageFor(totalMinutes(svc.companionHistory)).index;
  const b = breakScreen(c, stage, minutes, {
    onDone: () => {
      if (prefs.sound) chime();
      buzz();
    },
    onNext: goStart,
    onHome: goHome,
  });
  show(b.el, b.dispose);
}

function goRunning(restored: boolean) {
  const r = runningScreen(svc, {
    restored,
    prefs,
    onFinish: () => {
      const record = svc.history[svc.history.length - 1];
      if (record.completed) {
        if (prefs.sound) chime();
        buzz();
      }
      lastSession = {
        minutes: Math.round(record.plannedMs / 60000),
        tasks: record.tasks.filter((t) => !t.done).map((t) => t.text),
      };
      const breakMin = breakMinutesAfter(svc.history, new Date());
      show(endScreen(record, svc.companion!, svc.companionHistory, svc.history, {
        onHome: goHome,
        breakOffer: prefs.breaks && record.completed
          ? { minutes: breakMin, long: breakMin === LONG_BREAK_MIN, onBreak: () => goBreak(breakMin) }
          : undefined,
      }));
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
