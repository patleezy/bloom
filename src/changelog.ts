/**
 * Release notes shown in-app ("What's new"). Newest first. Keep CHANGELOG.md in sync.
 * APP_VERSION must match package.json.
 */
export const APP_VERSION = '0.4.0';

export interface Release {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string[];
}

export const CHANGELOG: Release[] = [
  {
    version: '0.4.0',
    date: '2026-09-29',
    title: 'Your companion keeps you company',
    notes: [
      'While you focus, your companion now reads, hums, stretches, and looks around.',
      'Bloomling waters its flower and gets visits from a butterfly.',
      'Kindle pops sparks and does a happy wiggle.',
      'Ripple blows bubbles and paddles around.',
      'New “What’s new” log (you’re reading it!), a Bloom logo, and a share image for links.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-09-29',
    title: 'Choose your starter',
    notes: [
      'Three starters to choose from: Bloomling (Leaf), Kindle (Ember), and Ripple (Tide).',
      'Name your companion, and rename it any time in Settings.',
      'Your first 25-minute session now evolves your companion.',
      'See minutes until the next stage while you focus.',
      'The screen stays on during a session.',
      'Night theme, a completion chime, backups, and install-to-home-screen with offline support.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-09-27',
    title: 'Meet the Bloomling',
    notes: ['The plant became a pet: a round little creature that sprouts, buds, and blooms.', 'It naps while a session is paused.'],
  },
  {
    version: '0.1.0',
    date: '2026-09-27',
    title: 'Bloom is born',
    notes: ['Focus timer with presets, a growing companion, streaks with a weekly grace day, and a 7-day history.'],
  },
];
