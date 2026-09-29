import { describe, expect, it } from 'vitest';
import { countedMinutes, minutesToNext, progressToNext, stageFor } from '../src/logic/growth';

describe('growth', () => {
  it('maps minutes to stages', () => {
    expect(stageFor(0).index).toBe(0);
    expect(stageFor(24).index).toBe(0);
    expect(stageFor(25).index).toBe(1); // first full pomodoro evolves
    expect(stageFor(1200).index).toBe(4);
    expect(stageFor(99999).index).toBe(5);
  });
  it('reports progress toward next stage', () => {
    expect(progressToNext(25 + 62.5)).toBeCloseTo(0.5);
    expect(progressToNext(99999)).toBe(1);
    expect(minutesToNext(100)).toBe(50);
    expect(minutesToNext(99999)).toBeNull();
  });
  it('ignores sessions under 5 minutes', () => {
    expect(countedMinutes(4 * 60000 + 59000)).toBe(0);
    expect(countedMinutes(5 * 60000)).toBe(5);
    expect(countedMinutes(25.9 * 60000)).toBe(25);
  });
});
