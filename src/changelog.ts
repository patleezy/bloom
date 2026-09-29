/**
 * Release notes shown in-app ("What's new"). Newest first. Keep CHANGELOG.md in sync.
 * APP_VERSION must match package.json.
 */
export const APP_VERSION = '0.13.0';

export interface Release {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string[];
}

export const CHANGELOG: Release[] = [
  {
    version: '0.13.0',
    date: '2026-09-30',
    title: 'Meet Lumi',
    notes: [
      'Meet Lumi! A soft, glowing moth that starts as a cocoon and grows wings that shine with little constellations.',
      'Finish a session after 10pm to earn Night Owl and unlock Lumi.',
      'Lumi brings a warm summer night with crickets, plus a gentle glow and a wing flutter.',
      'All three unlockable friends are here now: Moss, Nimbus, and Lumi.',
    ],
  },
  {
    version: '0.12.0',
    date: '2026-09-30',
    title: 'Meet Nimbus',
    notes: [
      'Meet Nimbus! A fluffy little cloud that brings a drizzle, then a rainbow, and finally the sun and moon.',
      'Keep a 7-day streak to unlock Nimbus, then adopt it in your garden.',
      'Nimbus has its own sky: a high breeze with faint wind chimes, plus drizzle and puff-up activities.',
      'Lumi is the last friend still on the way. Finish a session after 10pm to unlock it.',
    ],
  },
  {
    version: '0.11.0',
    date: '2026-09-30',
    title: 'Meet Moss',
    notes: [
      'Meet Moss, the first unlockable friend! A cozy mushroom whose cap grows moss, flowers, and finally a ring of tiny mushrooms.',
      'Earn the Ten Hours medal to unlock Moss, then adopt it in your garden. Until then, the garden shows your progress toward it.',
      'Moss has its own sounds (dripping woods after the rain) and activities: puffing spores and tipping its cap.',
      'Nimbus and Lumi are still on their way. Your progress toward them keeps counting.',
    ],
  },
  {
    version: '0.10.0',
    date: '2026-09-30',
    title: 'A whole garden',
    notes: [
      'Meet everyone! Bloomling, Cinder, and Ripple are all free to adopt anytime.',
      'Choose who joins each session from the start screen, depending on your mood. Whoever you pick grows from that session.',
      'Your garden (the new button at the top of home) shows all your companions, how far each has grown, and who greets you on the home screen.',
      'Each companion keeps its own growth and journey. Streaks and medals belong to you, so switching never costs a thing.',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-09-30',
    title: 'Medals and new friends',
    notes: [
      'Medals! Earn 16 of them for focus time, streaks, habits like Night Owl and Early Bird, and helping your companion grow. They’re yours forever, even if a streak ends.',
      'Medals count everything you’ve already done, so you may have a few waiting for you.',
      'New friends on the way: Moss, Nimbus, and Lumi. See what unlocks each one on the Medals page.',
      'The 7-day chart on the home screen shows your focus bars again.',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-09-30',
    title: 'Easy on the eyes',
    notes: [
      'Softer pastel colors that are easier on the eyes, especially the buttons.',
      'Accessibility: every screen now meets WCAG AA contrast, with bigger tap targets, clearer text fields, and stronger focus outlines for keyboard users.',
      'Behind the scenes: automatic checks on every update for tests, accessibility contrast, and known security issues.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-09-30',
    title: 'The road ahead',
    notes: [
      'See your companion’s whole journey: tap the progress bar on the home screen to view every stage, with silhouettes of what’s still to come.',
      'A mini preview next to the progress bar shows who your companion becomes next.',
      'Cinder’s second stage is now called Kindling.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-09-30',
    title: 'Sounds and breathers',
    notes: [
      'Ambient sound for each companion: a breeze for Bloomling, a crackling fire for Cinder, soft rain for Ripple. Tap the speaker during a session.',
      'Breaks: after a full session, take a 5-minute break (15 after every 4th). Your companion has a snack, then a nap.',
      'Starting the next session brings back anything you didn’t check off.',
      'Kindle is now called Cinder. Same fiery friend, same progress.',
      'Tap your companion during a session for a quick wave, or during a break for a pet. Buttons like “End session” are easier to spot.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-09-29',
    title: 'Plan it, pet it',
    notes: [
      'Add up to 3 things you want to focus on, then check them off as you go.',
      'Tap your companion on the home screen to give it a pet.',
      'Quick trips to another tab or app no longer pause you. Up to a minute away still counts.',
      'Reloading mid-session now keeps the time you’ve already focused.',
      'A fresh look: new fonts, custom icons, and a friendlier voice.',
      'A short note on the home screen explains what Bloom is for. Tap the X to hide it.',
    ],
  },
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
