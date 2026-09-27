import { describe, expect, it } from 'vitest';
import { countedMinutes, progressToNext, stageFor } from '../src/logic/growth';

describe('growth', () => {
  it('maps minutes to stages', () => {
    expect(stageFor(0).name).toBe('Seed');
    expect(stageFor(59).name).toBe('Seed');
    expect(stageFor(60).name).toBe('Sprout');
    expect(stageFor(2000).name).toBe('Bloom');
    expect(stageFor(99999).name).toBe('Elder Bloom');
  });
  it('reports progress toward next stage', () => {
    expect(progressToNext(30)).toBeCloseTo(0.5);
    expect(progressToNext(99999)).toBe(1);
  });
  it('ignores sessions under 5 minutes', () => {
    expect(countedMinutes(4 * 60000 + 59000)).toBe(0);
    expect(countedMinutes(5 * 60000)).toBe(5);
    expect(countedMinutes(25.9 * 60000)).toBe(25);
  });
});
