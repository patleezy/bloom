import { describe, expect, it } from 'vitest';
import { elapsed, isDone, newClock, pause, resume } from '../src/logic/timer';

describe('timer', () => {
  it('pauses and resumes without losing or gaining time', () => {
    let c = newClock(60000, 0);
    c = pause(c, 10000);
    expect(elapsed(c, 50000)).toBe(10000); // time away doesn't count
    c = resume(c, 50000);
    expect(elapsed(c, 60000)).toBe(20000);
    expect(isDone(c, 99000)).toBe(false);
    expect(isDone(c, 100000)).toBe(true);
  });
  it('never exceeds the planned duration', () => {
    expect(elapsed(newClock(1000, 0), 999999)).toBe(1000);
  });
});
