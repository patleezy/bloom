import './styles.css';
import { copy } from './copy';
import { SessionService } from './domain/sessionService';
import type { SessionRecord } from './domain/types';
import { endScreen } from './screens/end';
import { homeScreen } from './screens/home';
import { runningScreen } from './screens/running';
import { startScreen } from './screens/start';
import { LocalRepository } from './state/localRepository';

// Swap LocalRepository for an API-backed repository here when a backend exists.
const svc = new SessionService(new LocalRepository());
const root = document.getElementById('app')!;
let dispose: (() => void) | null = null;

function show(el: HTMLElement, cleanup: (() => void) | null = null) {
  dispose?.();
  dispose = cleanup;
  root.replaceChildren(el);
  (el.querySelector('h1, h2, button') as HTMLElement | null)?.focus({ preventScroll: true });
}

function goHome() {
  show(homeScreen(svc.history, {
    onStart: goStart,
    onClear: async () => {
      if (confirm(copy.confirmClear)) {
        await svc.clearAll();
        goHome();
      }
    },
  }));
}

function goStart() {
  show(startScreen({
    onBack: goHome,
    onBegin: async (minutes, label) => {
      await svc.start(minutes, label);
      goRunning(false);
    },
  }));
}

function goRunning(restored: boolean) {
  const r = runningScreen(svc, { restored, onFinish: () => goEnd(svc.history[svc.history.length - 1]) });
  show(r.el, r.dispose);
}

function goEnd(record: SessionRecord) {
  show(endScreen(record, svc.history, { onHome: goHome }));
}

async function boot() {
  await svc.init();
  if (svc.active) goRunning(true);
  else goHome();
}

void boot();
