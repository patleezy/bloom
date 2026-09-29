import type { SpeciesId } from './domain/types';

/**
 * All user-facing text. Voice: warm, short, a little playful. Never guilt.
 * Each species has its own personality in the running lines.
 */
export const copy = {
  appName: 'Bloom',

  // Onboarding
  welcomeTitle: 'Hi, welcome to Bloom',
  welcomeLines: [
    'Focus for a bit and your companion grows. That’s the whole idea.',
    'Anything over 5 minutes counts toward growth.',
    'Step away for more than a minute and the timer waits for you.',
    'Miss a day? Your streak gets one free pass a week.',
  ],
  welcomeCta: 'Meet the starters',
  chooseTitle: 'Pick your starter',
  chooseSub: 'They all grow the same way. Go with your gut. You can meet the others anytime.',
  nameTitle: (species: string) => `What should we call your ${species}?`,
  namePlaceholder: 'Name',
  nameCta: 'Start growing',

  // Home
  introCard: 'Bloom helps you focus by growing a companion with every minute you stay present.',
  dismiss: 'Dismiss',
  startCta: 'Start a session',
  streak: (n: number) => (n === 1 ? '1 day' : `${n} days`),
  streakTitle: 'Current streak',
  streakBadge: (n: number) => `${n}-day streak`,
  streakZero: 'Day 1',
  totalMinutes: (m: number) => `${m.toLocaleString()} minutes together`,
  toNext: (m: number, name: string) => `${m.toLocaleString()} min to ${name}`,
  fullyGrown: 'Fully grown. Still happy to see you.',
  weekEmpty: 'Your week fills in as you focus.',
  settings: 'Settings',
  pet: (name: string) => `Pet ${name}`,

  // Start
  pickDuration: 'How long?',
  custom: 'Custom',
  minutesUnit: 'min',
  tasksTitle: 'What are you working on?',
  tasksHint: 'Optional. Up to 3.',
  taskPlaceholder: (i: number) => ['Write the intro', 'Reply to Sam', 'Tidy the desk'][i] ?? 'Something to do',
  addTask: 'Add another',
  removeTask: 'Remove',
  begin: 'Begin',
  back: 'Back',

  // Running
  running: {
    bloomling: (n: string) => ['Soaking up the light.', 'Roots going deeper.', `${n} is photosynthesizing. Probably.`],
    cinder: (n: string) => ['Keeping the fire going.', `${n} is all fired up.`, 'Crackle, crackle. Nice pace.'],
    ripple: (n: string) => ['Flowing along.', `${n} is making little waves.`, 'Deep water, calm mind.'],
    moss: (n: string) => ['Slow and steady.', `${n} is growing roots.`, 'Quiet as a forest floor.'],
    nimbus: (n: string) => ['Clear skies ahead.', `${n} is drifting along with you.`, 'Head in the clouds, in a good way.'],
  } satisfies Record<SpeciesId, (name: string) => string[]>,
  liveToNext: (m: number, stage: string) => (m <= 0 ? `Evolving into ${stage}!` : `${m} min to ${stage}`),
  paused: (name: string) => `${name} took a nap while you were gone. Welcome back.`,
  resumedAfterReload: (name: string) => `${name} is napping. Tap resume when you’re ready.`,
  resume: 'Resume',
  endEarly: 'End session',
  confirmEnd: 'End now? Every minute so far still counts.',

  // End
  doneTitle: 'Session complete',
  earlyTitle: 'Nice work',
  doneBody: (m: number, name: string) => `${m} focused minutes. ${name} felt every one.`,
  shortBody: (name: string) => `Under 5 minutes doesn’t grow ${name} yet, but showing up counts.`,
  tasksDone: (done: number, total: number) => `${done} of ${total} done`,
  stageUp: (name: string, stage: string) => `${name} grew into a ${stage}!`,
  home: 'Back home',

  // Evolution path
  evoTitle: (name: string) => `${name}’s journey`,
  evoIntro: (m: number) => `${m.toLocaleString()} minutes together so far.`,
  evoStage: (n: number) => `Stage ${n}`,
  evoUnknown: '???',
  evoReached: 'Reached',
  evoCurrent: 'Right now',
  evoHere: 'You are here',
  evoNeeds: (m: number) => `${m.toLocaleString()} min to go`,
  evoOpen: 'See the full journey',

  // Who's joining + garden
  whoTitle: 'Who’s joining you?',
  whoNew: 'New',
  whoMeet: (species: string) => `Meet ${species}, a new friend`,
  gardenTitle: 'Your garden',
  gardenOpen: 'Open your garden',
  gardenIntro: 'Each companion grows from the sessions you share. Pick whoever suits your mood.',
  gardenOnHome: 'On home',
  gardenSetHome: 'Show on home',
  gardenJourney: 'Journey',
  gardenAdopt: (name: string) => `Adopt ${name}`,
  gardenNotMet: 'Not met yet. Free to adopt anytime.',
  gardenMinutes: (m: number) => (m === 1 ? '1 minute together' : `${m.toLocaleString()} minutes together`),
  gardenUnlocks: 'More friends can be unlocked with medals.',
  gardenSeeMedals: 'See medals',

  // Medals
  medalsTitle: 'Medals',
  medalsSummary: (n: number, total: number) => `${n} of ${total} earned`,
  medalsForever: 'Medals are yours to keep. They never go away, even if a streak ends.',
  medalCount: (n: number) => (n === 1 ? '1 medal' : `${n} medals`),
  medalsOpen: 'See your medals',
  medalProgress: (cur: string, target: string) => `${cur} of ${target}`,
  medalEarnedOn: (date: string) => `Earned ${date}`,
  medalLocked: 'Not earned yet',
  days: (n: number) => (n === 1 ? '1 day' : `${n} days`),
  newMedal: 'New medal!',
  newMedals: (n: number) => `${n} new medals!`,
  unlocksTitle: 'New friends on the way',
  unlocksIntro: 'Keep focusing to unlock new companions. Some are still on their way, and your progress counts toward them starting now.',
  unlockReady: (name: string, available: boolean) =>
    available ? `Unlocked! Meet ${name} in your garden.` : `Unlocked! ${name} will be ready to adopt in an upcoming update.`,
  unlockWaiting: (name: string) => `${name} is ready to meet in your garden`,
  unlockCelebrate: (name: string) => `You unlocked ${name}!`,
  unlockMeet: (name: string) => `Meet ${name}`,
  gardenLocked: (req: string) => `Locked. ${req} to unlock.`,
  unlockHint: (req: string, progress: string, name: string) => `${req} to meet ${name} · ${progress}`,

  // Breaks
  breakOffer: (m: number) => `Take a ${m}-minute break`,
  breakOfferLong: 'You’ve earned a longer one.',
  breakTitle: 'Break time',
  breakTips: [
    'Stand up and stretch.',
    'Sip some water.',
    'Look at something far away for a bit.',
    'Roll your shoulders. Unclench your jaw.',
  ],
  breakSnack: (name: string) => `${name} is having a snack.`,
  breakNap: (name: string) => `${name} is resting its eyes.`,
  breakReady: 'I’m ready',
  breakOver: 'Break’s over',
  breakOverBody: (name: string) => `${name} is rested and ready when you are.`,
  nextRound: 'Start another session',

  // Sound
  soundOn: 'Turn on ambient sound',
  soundOff: 'Turn off ambient sound',

  // Settings
  theme: 'Theme',
  themes: { auto: 'Auto', light: 'Light', night: 'Night' },
  sound: 'Chime when a session ends',
  ambient: 'Ambient sound during sessions',
  ambientHelp: {
    bloomling: 'Bloomling: a breeze through the leaves.',
    cinder: 'Cinder: a crackling fire.',
    ripple: 'Ripple: soft rain.',
    moss: 'Moss: dripping woods after the rain.',
    nimbus: 'Nimbus: high breeze and faint wind chimes.',
  } satisfies Record<SpeciesId, string>,
  volume: 'Volume',
  breaks: 'Offer a break after each session',
  rename: 'Companion name',
  save: 'Save',
  saved: 'Saved.',
  backupTitle: 'Backup',
  backupHelp: 'Your progress lives only on this device. Save a backup file to keep it safe or move it somewhere else.',
  exportCta: 'Save backup',
  importCta: 'Restore backup',
  importConfirm: 'Replace everything on this device with this backup?',
  importOk: 'Backup restored.',
  importBad: 'That file isn’t a Bloom backup. Nothing changed.',
  installHint: 'Add Bloom to your home screen and it works like an app, even offline.',
  clearData: 'Delete my data',
  confirmClear: 'This deletes your companion and history from this device for good. Continue?',
  privacy: 'Everything stays on this device. No accounts, no tracking.',
  whatsNew: 'What’s new',
  whatsNewPill: 'What’s new',
  version: (v: string) => `Bloom v${v}`,
};
