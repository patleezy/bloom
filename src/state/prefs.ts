/**
 * Per-device preferences. Kept separate from BloomSnapshot on purpose: these describe this
 * device (theme, sound), not the user's progress, so they should never sync to a backend.
 */
export type Theme = 'auto' | 'light' | 'night';

export interface Prefs {
  theme: Theme;
  sound: boolean;
  lastSeenVersion: string | null; // for the "What's new" pill
  introDismissed: boolean;
  ambient: boolean; // species soundscape during sessions
  volume: number; // 0–1
  breaks: boolean; // offer a break after completed sessions
}

const KEY = 'bloom:prefs';
const DEFAULTS: Prefs = { theme: 'auto', sound: true, lastSeenVersion: null, introDismissed: false, ambient: false, volume: 0.5, breaks: true };

export function loadPrefs(): Prefs {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Prefs> | null;
    return {
      theme: o?.theme === 'light' || o?.theme === 'night' ? o.theme : 'auto',
      sound: typeof o?.sound === 'boolean' ? o.sound : DEFAULTS.sound,
      lastSeenVersion: typeof o?.lastSeenVersion === 'string' ? o.lastSeenVersion.slice(0, 20) : null,
      introDismissed: o?.introDismissed === true,
      ambient: o?.ambient === true,
      volume: typeof o?.volume === 'number' && o.volume >= 0 && o.volume <= 1 ? o.volume : DEFAULTS.volume,
      breaks: typeof o?.breaks === 'boolean' ? o.breaks : DEFAULTS.breaks,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function clearPrefs(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const THEME_COLORS = { light: '#f5f1e8', night: '#15181a' };

/** Apply a theme to the document. 'auto' follows the operating system setting. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
  const dark = theme === 'night' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) =>
    m.setAttribute('content', dark ? THEME_COLORS.night : THEME_COLORS.light));
}
