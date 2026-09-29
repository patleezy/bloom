import { describe, expect, it } from 'vitest';
import { breakMinutesAfter } from '../src/domain/breaks';
import type { SessionRecord } from '../src/domain/types';

const now = new Date(2026, 8, 30, 15);
const rec = (day: string, completed = true): SessionRecord => ({
  id: Math.random().toString(36).slice(2), companionId: 'c', startedAt: 0, endedAt: 0, day,
  plannedMs: 1, focusedMs: 1, countedMinutes: 25, tasks: [], completed,
});

describe('breaks', () => {
  it('offers a short break normally and a long one every 4th completed session today', () => {
    const today = '2026-09-30';
    expect(breakMinutesAfter([rec(today)], now)).toBe(5);
    expect(breakMinutesAfter([rec(today), rec(today), rec(today), rec(today)], now)).toBe(15);
    expect(breakMinutesAfter([rec(today), rec(today), rec(today), rec(today), rec(today)], now)).toBe(5);
  });
  it('ignores sessions ended early and sessions from other days', () => {
    const today = '2026-09-30';
    const h = [rec('2026-09-29'), rec('2026-09-29'), rec(today), rec(today, false), rec(today), rec(today)];
    expect(breakMinutesAfter(h, now)).toBe(5);
    expect(breakMinutesAfter([...h, rec(today)], now)).toBe(15);
  });
});
