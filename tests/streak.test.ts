import { describe, expect, it } from 'vitest';
import { addDays, dayKey } from '../src/logic/dates';
import { computeStreak } from '../src/logic/streak';

const today = new Date(2026, 8, 27);
/** Build a set of active days from offsets (0 = today, 1 = yesterday…). */
const days = (...offsets: number[]) => new Set(offsets.map((o) => dayKey(addDays(today, -o))));

describe('streak', () => {
  it('is zero with no history', () => expect(computeStreak(days(), today)).toBe(0));
  it('counts consecutive days', () => expect(computeStreak(days(0, 1, 2), today)).toBe(3));
  it('is not broken by today being empty yet', () => expect(computeStreak(days(1, 2), today)).toBe(2));
  it('breaks after two missed days', () => expect(computeStreak(days(2, 3), today)).toBe(0));
  it('forgives one missed day', () => expect(computeStreak(days(0, 1, 3, 4), today)).toBe(4));
  it('forgives only one missed day per week', () =>
    expect(computeStreak(days(0, 2, 4, 5), today)).toBe(2));
  it('allows another grace a week later', () =>
    expect(computeStreak(days(0, 2, 3, 4, 5, 6, 7, 8, 10), today)).toBe(9));
  it('does not use grace for two consecutive misses', () =>
    expect(computeStreak(days(0, 3, 4), today)).toBe(1));
});
