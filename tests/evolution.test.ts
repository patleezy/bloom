import { describe, expect, it } from 'vitest';
import { evolutionPath } from '../src/domain/evolution';

describe('evolution path', () => {
  it('marks reached, current, next and locked stages', () => {
    const p = evolutionPath(200); // stage 2 (150), next is 500
    expect(p.map((s) => s.state)).toEqual(['reached', 'reached', 'current', 'next', 'locked', 'locked']);
    expect(p[3].minutesLeft).toBe(300);
    expect(p[0].minutesLeft).toBe(0);
  });
  it('handles a brand-new and a fully grown companion', () => {
    expect(evolutionPath(0).map((s) => s.state)).toEqual(['current', 'next', 'locked', 'locked', 'locked', 'locked']);
    expect(evolutionPath(9999).every((s) => s.state !== 'next' && s.state !== 'locked')).toBe(true);
  });
});
