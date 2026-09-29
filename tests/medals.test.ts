import { describe, expect, it } from 'vitest';
import { evaluateMedals, nearestUnlock, newlyEarned } from '../src/domain/medals';
import type { SessionRecord } from '../src/domain/types';

let n = 0;
/** A session ending at the given local date/time. */
function rec(when: string, minutes: number, extra: Partial<SessionRecord> = {}): SessionRecord {
  const end = new Date(when).getTime();
  return {
    id: `s${++n}`, companionId: 'c', startedAt: end - minutes * 60000, endedAt: end,
    day: when.slice(0, 10), plannedMs: minutes * 60000, focusedMs: minutes * 60000,
    countedMinutes: minutes >= 5 ? minutes : 0, tasks: [], completed: true, ...extra,
  };
}
const earned = (h: SessionRecord[]) => new Set(evaluateMedals(h).filter((s) => s.earned).map((s) => s.medal.id));

describe('medals', () => {
  it('earns nothing with no history', () => {
    expect(earned([]).size).toBe(0);
  });

  it('awards first session, warm-up and deep dive, with progress on the rest', () => {
    const h = [rec('2026-09-01T14:00:00', 55)];
    const e = earned(h);
    expect(e).toContain('first-session');
    expect(e).toContain('minutes-10');
    expect(e).toContain('deep-dive');
    expect(e).toContain('evolved'); // 55 min passes stage 1 (25)
    expect(e).not.toContain('hours-1');
    const hour = evaluateMedals(h).find((s) => s.medal.id === 'hours-1')!;
    expect([hour.current, hour.target]).toEqual([55, 60]);
  });

  it('keeps streak medals after the streak breaks (never lost)', () => {
    const streak = ['01', '02', '03'].map((d) => rec(`2026-09-${d}T12:00:00`, 25));
    const later = rec('2026-09-20T12:00:00', 25); // long gap, current streak resets
    expect(earned([...streak, later])).toContain('streak-3');
  });

  it('awards night owl, early bird and full list', () => {
    const e = earned([
      rec('2026-09-01T23:10:00', 25),
      rec('2026-09-02T07:30:00', 25), // started 7:05
      rec('2026-09-03T12:00:00', 25, { tasks: [1, 2, 3].map((i) => ({ text: `t${i}`, done: true })) }),
    ]);
    expect(e).toContain('night-owl');
    expect(e).toContain('early-bird');
    expect(e).toContain('full-list');
  });

  it('ignores sessions under 5 minutes for time and habit medals', () => {
    expect(earned([rec('2026-09-01T23:30:00', 4)]).size).toBe(0);
  });

  it('reports only medals earned by the latest session', () => {
    const before = [rec('2026-09-01T12:00:00', 25)];
    const after = [...before, rec('2026-09-01T13:00:00', 40)];
    expect(newlyEarned(before, after).map((m) => m.id)).toEqual(['hours-1']);
  });

  it('points to the closest companion unlock', () => {
    const h = Array.from({ length: 5 }, (_, i) => rec(`2026-09-0${i + 1}T12:00:00`, 25)); // 5-day streak
    const next = nearestUnlock(evaluateMedals(h));
    expect(next?.unlock.id).toBe('nimbus'); // 5/7 days beats 125/600 min and 0/1 nights
  });
});
