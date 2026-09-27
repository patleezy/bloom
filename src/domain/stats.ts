import { addDays, dayKey } from '../logic/dates';
import { computeStreak } from '../logic/streak';
import type { SessionRecord } from './types';

/** Everything derived from history. Pure, so a server can compute the same numbers. */
export function totalMinutes(history: SessionRecord[]): number {
  return history.reduce((sum, r) => sum + r.countedMinutes, 0);
}

export function activeDays(history: SessionRecord[]): Set<string> {
  return new Set(history.filter((r) => r.countedMinutes > 0).map((r) => r.day));
}

export function streak(history: SessionRecord[], today: Date): number {
  return computeStreak(activeDays(history), today);
}

export interface DaySummary {
  day: string;
  minutes: number;
  isToday: boolean;
}

export function lastSevenDays(history: SessionRecord[], today: Date): DaySummary[] {
  const byDay = new Map<string, number>();
  for (const r of history) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.countedMinutes);
  const todayKey = dayKey(today);
  return Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(addDays(today, i - 6));
    return { day: key, minutes: byDay.get(key) ?? 0, isToday: key === todayKey };
  });
}
