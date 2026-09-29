import type { IconName } from '../icons';
import { STAGES, stageFor } from '../logic/growth';
import { computeStreak } from '../logic/streak';
import type { SessionRecord } from './types';

/**
 * Medals are derived from session history, never stored. That makes them:
 *   - impossible to lose (they only depend on things that already happened),
 *   - retroactive for existing users,
 *   - identical on a future server, with nothing extra to sync.
 */

export type MedalCategory = 'time' | 'streak' | 'habit' | 'growth';

/** Running totals built by replaying history in order. */
export interface MedalStats {
  sessions: number; // sessions that counted toward growth (5+ min)
  totalMinutes: number;
  bestStreak: number;
  longestSessionMin: number;
  fullLists: number; // sessions with 3 focus items, all checked
  nightSessions: number; // ended 10pm–4am
  earlySessions: number; // started 5–8am
  highestStage: number; // best stage index across companions
}

export interface Medal {
  id: string;
  name: string;
  description: string;
  category: MedalCategory;
  icon: IconName;
  /** [current, target] toward earning it. */
  progress: (s: MedalStats) => [number, number];
}

const hours = (h: number) => h * 60;
const at = (value: number, target: number): [number, number] => [Math.min(value, target), target];

export const MEDALS: Medal[] = [
  { id: 'first-session', name: 'First Sprout', description: 'Finish your first session.', category: 'habit', icon: 'sprout',
    progress: (s) => at(s.sessions, 1) },
  { id: 'minutes-10', name: 'Warming Up', description: 'Focus for 10 minutes in total.', category: 'time', icon: 'clock',
    progress: (s) => at(s.totalMinutes, 10) },
  { id: 'hours-1', name: 'Hour of Power', description: 'Focus for 1 hour in total.', category: 'time', icon: 'clock',
    progress: (s) => at(s.totalMinutes, hours(1)) },
  { id: 'hours-10', name: 'Ten Hours', description: 'Focus for 10 hours in total.', category: 'time', icon: 'star',
    progress: (s) => at(s.totalMinutes, hours(10)) },
  { id: 'hours-50', name: 'Fifty Hours', description: 'Focus for 50 hours in total.', category: 'time', icon: 'star',
    progress: (s) => at(s.totalMinutes, hours(50)) },
  { id: 'hours-100', name: 'Century', description: 'Focus for 100 hours in total.', category: 'time', icon: 'star',
    progress: (s) => at(s.totalMinutes, hours(100)) },
  { id: 'streak-3', name: 'Steady', description: 'Reach a 3-day streak.', category: 'streak', icon: 'flame',
    progress: (s) => at(s.bestStreak, 3) },
  { id: 'streak-7', name: 'Committed', description: 'Reach a 7-day streak.', category: 'streak', icon: 'flame',
    progress: (s) => at(s.bestStreak, 7) },
  { id: 'streak-30', name: 'Unstoppable', description: 'Reach a 30-day streak.', category: 'streak', icon: 'flame',
    progress: (s) => at(s.bestStreak, 30) },
  { id: 'sessions-10', name: 'Regular', description: 'Finish 10 sessions.', category: 'habit', icon: 'check',
    progress: (s) => at(s.sessions, 10) },
  { id: 'deep-dive', name: 'Deep Dive', description: 'Focus for 50 minutes in one session.', category: 'habit', icon: 'drop',
    progress: (s) => at(s.longestSessionMin, 50) },
  { id: 'full-list', name: 'Full List', description: 'Check off all 3 focus items in one session.', category: 'habit', icon: 'check',
    progress: (s) => at(s.fullLists, 1) },
  { id: 'night-owl', name: 'Night Owl', description: 'Finish a session after 10pm.', category: 'habit', icon: 'moon',
    progress: (s) => at(s.nightSessions, 1) },
  { id: 'early-bird', name: 'Early Bird', description: 'Start a session before 8am.', category: 'habit', icon: 'sun',
    progress: (s) => at(s.earlySessions, 1) },
  { id: 'evolved', name: 'Evolved', description: 'Help your companion reach its second stage.', category: 'growth', icon: 'sparkle',
    progress: (s) => at(s.highestStage, 1) },
  { id: 'full-bloom', name: 'Full Bloom', description: 'Grow a companion to its final stage.', category: 'growth', icon: 'sparkle',
    progress: (s) => at(s.highestStage, STAGES.length - 1) },
];

export interface MedalStatus {
  medal: Medal;
  earned: boolean;
  earnedAt: number | null; // epoch ms of the session that earned it
  current: number;
  target: number;
}

const emptyStats = (): MedalStats => ({
  sessions: 0, totalMinutes: 0, bestStreak: 0, longestSessionMin: 0,
  fullLists: 0, nightSessions: 0, earlySessions: 0, highestStage: 0,
});

/** Replay history oldest-first and record when each medal was first earned. */
export function evaluateMedals(history: readonly SessionRecord[]): MedalStatus[] {
  const stats = emptyStats();
  const earnedAt = new Map<string, number>();
  const days = new Set<string>();
  const perCompanion = new Map<string, number>();

  const sorted = [...history].sort((a, b) => a.endedAt - b.endedAt);
  for (const r of sorted) {
    if (r.countedMinutes > 0) {
      stats.sessions++;
      stats.totalMinutes += r.countedMinutes;
      stats.longestSessionMin = Math.max(stats.longestSessionMin, r.countedMinutes);
      const endHour = new Date(r.endedAt).getHours();
      const startHour = new Date(r.startedAt).getHours();
      if (endHour >= 22 || endHour < 4) stats.nightSessions++;
      if (startHour >= 5 && startHour < 8) stats.earlySessions++;
      if (!days.has(r.day)) {
        days.add(r.day);
        stats.bestStreak = Math.max(stats.bestStreak, computeStreak(days, new Date(`${r.day}T12:00:00`)));
      }
      const companionTotal = (perCompanion.get(r.companionId) ?? 0) + r.countedMinutes;
      perCompanion.set(r.companionId, companionTotal);
      stats.highestStage = Math.max(stats.highestStage, stageFor(companionTotal).index);
    }
    if (r.tasks.length === 3 && r.tasks.every((t) => t.done)) stats.fullLists++;

    for (const m of MEDALS) {
      if (earnedAt.has(m.id)) continue;
      const [cur, target] = m.progress(stats);
      if (cur >= target) earnedAt.set(m.id, r.endedAt);
    }
  }

  return MEDALS.map((medal) => {
    const [current, target] = medal.progress(stats);
    const when = earnedAt.get(medal.id) ?? null;
    return { medal, earned: when !== null, earnedAt: when, current, target };
  });
}

/** Medals earned by the most recent session (for the end-screen celebration). */
export function newlyEarned(before: readonly SessionRecord[], after: readonly SessionRecord[]): Medal[] {
  const had = new Set(evaluateMedals(before).filter((s) => s.earned).map((s) => s.medal.id));
  return evaluateMedals(after).filter((s) => s.earned && !had.has(s.medal.id)).map((s) => s.medal);
}

// ---------- Unlockable companions (teasers until they arrive) ----------

export interface Unlockable {
  id: string;
  name: string;
  element: string;
  blurb: string;
  icon: IconName;
  /** Medal that unlocks it. */
  medalId: string;
  requirement: string;
}

export const UNLOCKABLES: Unlockable[] = [
  { id: 'moss', name: 'Moss', element: 'Earth', icon: 'leaf', medalId: 'hours-10', requirement: 'Focus for 10 hours',
    blurb: 'A round little mushroom that grows a mossy garden on its cap.' },
  { id: 'nimbus', name: 'Nimbus', element: 'Sky', icon: 'cloud', medalId: 'streak-7', requirement: 'Reach a 7-day streak',
    blurb: 'A fluffy cloud with tiny feet that grows rainbows.' },
  { id: 'lumi', name: 'Lumi', element: 'Light', icon: 'moon', medalId: 'night-owl', requirement: 'Finish a session after 10pm',
    blurb: 'A glowing moth whose wings brighten with every session.' },
];

/** The unlockable closest to being earned, for a gentle hint on the home screen. */
export function nearestUnlock(statuses: MedalStatus[]): { unlock: Unlockable; status: MedalStatus } | null {
  let best: { unlock: Unlockable; status: MedalStatus; ratio: number } | null = null;
  for (const u of UNLOCKABLES) {
    const s = statuses.find((x) => x.medal.id === u.medalId);
    if (!s || s.earned) continue;
    const ratio = s.current / s.target;
    if (!best || ratio > best.ratio) best = { unlock: u, status: s, ratio };
  }
  return best ? { unlock: best.unlock, status: best.status } : null;
}
