import { dayKey } from '../logic/dates';
import type { SessionRecord } from './types';

export const SHORT_BREAK_MIN = 5;
export const LONG_BREAK_MIN = 15;
/** Every Nth completed session today earns a long break (classic Pomodoro rhythm). */
export const LONG_BREAK_EVERY = 4;

/** Break length to offer after the latest session. Only completed sessions count toward the cycle. */
export function breakMinutesAfter(history: readonly SessionRecord[], now: Date): number {
  const today = dayKey(now);
  const done = history.filter((r) => r.day === today && r.completed).length;
  return done > 0 && done % LONG_BREAK_EVERY === 0 ? LONG_BREAK_MIN : SHORT_BREAK_MIN;
}
