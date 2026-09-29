/** All user-facing text lives here: warm, never guilt-based. Easy to localize later. */
export const copy = {
  appName: 'Bloom',

  // Onboarding
  welcomeTitle: 'Welcome to Bloom',
  welcomeLines: [
    'Focus for a while, and a little companion grows with you.',
    'Every focused minute helps it grow. Sessions of 5 minutes or more count.',
    'Leave the tab and the timer simply pauses. No penalties, no guilt.',
    'Your streak has a built-in grace day each week.',
  ],
  welcomeCta: 'Choose your companion',
  chooseTitle: 'Choose your companion',
  chooseSub: 'All three grow the same way — pick the one that feels like you.',
  nameTitle: (species: string) => `Name your ${species}`,
  namePlaceholder: 'Give it a name',
  nameCta: 'Let’s grow together',

  // Home
  startCta: 'Start focusing',
  streak: (n: number) => (n === 1 ? '1 day streak' : `${n} day streak`),
  streakZero: 'Your streak starts today',
  totalMinutes: (m: number) => `${m.toLocaleString()} min grown`,
  toNext: (m: number, name: string) => `${m.toLocaleString()} min until ${name}`,
  fullyGrown: 'Fully grown — and still growing with you',
  settings: 'Settings',

  // Start
  pickDuration: 'How long would you like to focus?',
  custom: 'Custom',
  minutesUnit: 'min',
  labelPlaceholder: 'What are you focusing on? (optional)',
  begin: 'Begin',
  back: 'Back',

  // Running
  running: (name: string) => ['Growing quietly…', 'Soaking up the light…', `${name} is humming along.`, 'Doing great, keep going.'],
  liveToNext: (m: number, stage: string) => (m <= 0 ? `Evolving into ${stage}!` : `${m} min until ${stage}`),
  paused: (name: string) => `${name} napped while you were away. Welcome back!`,
  resumedAfterReload: (name: string) => `${name} is napping — wake it whenever you’re ready.`,
  resume: 'Resume',
  endEarly: 'End session',
  confirmEnd: 'End now? Every minute you focused still counts.',

  // End
  doneTitle: 'Well done',
  earlyTitle: 'Nice work',
  doneBody: (m: number, name: string) => `${m} focused minutes. ${name} soaked that in.`,
  shortBody: (name: string) => `A short one — sessions of 5+ minutes help ${name} grow. Stopping by still matters.`,
  stageUp: (name: string, stage: string) => `${name} grew into a ${stage}!`,
  home: 'Back home',

  // Settings
  whatsNew: 'What’s new',
  whatsNewPill: '✨ What’s new',
  version: (v: string) => `Bloom v${v}`,
  theme: 'Theme',
  themes: { auto: 'Auto', light: 'Light', night: 'Night' },
  sound: 'Chime when a session ends',
  rename: 'Companion name',
  save: 'Save',
  saved: 'Saved',
  backupTitle: 'Backup',
  backupHelp: 'Your data lives only on this device. Save a backup file to keep it safe or move it to another device.',
  exportCta: 'Save backup file',
  importCta: 'Restore from backup',
  importConfirm: 'Replace everything on this device with this backup?',
  importOk: 'Backup restored.',
  importBad: 'That file isn’t a valid Bloom backup. Nothing was changed.',
  installHint: 'Tip: add Bloom to your home screen to use it like an app, even offline.',
  clearData: 'Clear my data',
  confirmClear: 'This permanently deletes your companion and history from this device. Continue?',
  privacy: 'Everything stays on this device. No accounts, no tracking.',
};
