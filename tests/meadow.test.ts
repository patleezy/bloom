import { describe, expect, it } from 'vitest';
import { MAX_TREES, RECENT_PLANTS, meadow, plantFor } from '../src/domain/meadow';
import type { SessionRecord } from '../src/domain/types';

const rec = (i: number, minutes: number): SessionRecord => ({
  id: `s${i}`, companionId: 'c', startedAt: i * 1000, endedAt: i * 1000 + 1, day: '2026-01-01',
  plannedMs: minutes * 60000, focusedMs: minutes * 60000, countedMinutes: minutes, tasks: [], completed: true,
});
const sessions = (n: number, minutes = 25) => Array.from({ length: n }, (_, i) => rec(i, minutes));
const count = (h: SessionRecord[], kind: string, recent: boolean) =>
  meadow(h).plants.filter((p) => p.kind === kind && p.recent === recent).length;

describe('meadow', () => {
  it('plants by session length, and nothing for uncounted sessions', () => {
    expect(plantFor(0)).toBeNull();
    expect(plantFor(5)).toBe('flower');
    expect(plantFor(49)).toBe('flower');
    expect(plantFor(50)).toBe('bush');
    expect(plantFor(89)).toBe('bush');
    expect(plantFor(90)).toBe('tree');
  });

  it('is empty for a new user and ignores short sessions', () => {
    expect(meadow([])).toEqual({ plants: [], planted: 0, older: null });
    expect(meadow([rec(0, 0)]).planted).toBe(0);
  });

  it('shows the newest sessions as their own plants', () => {
    const m = meadow([rec(0, 25), rec(1, 60), rec(2, 90)]);
    expect(m.planted).toBe(3);
    expect(m.plants.map((p) => p.kind).sort()).toEqual(['bush', 'flower', 'tree']);
    expect(m.plants.every((p) => p.recent)).toBe(true);
  });

  it('merges older flowers into bushes, and bushes into trees', () => {
    const h = sessions(RECENT_PLANTS + 4);
    expect(count(h, 'flower', false)).toBe(4);
    h.push(rec(100, 25)); // fifth older flower
    expect(count(h, 'flower', false)).toBe(0);
    expect(count(h, 'bush', false)).toBe(1);
    const many = sessions(RECENT_PLANTS + 25);
    expect(count(many, 'bush', false)).toBe(0);
    expect(count(many, 'tree', false)).toBe(1);
  });

  it('never shrinks: more sessions never mean less grown', () => {
    const weight = (n: number) => meadow(sessions(n)).plants
      .reduce((sum, p) => sum + (p.kind === 'tree' ? 25 : p.kind === 'bush' ? 5 : 1), 0);
    for (let n = 1; n < 150; n++) expect(weight(n)).toBeGreaterThanOrEqual(weight(n - 1));
  });

  it('stays small for a very long history', () => {
    const m = meadow(sessions(5000));
    expect(m.planted).toBe(5000);
    expect(m.plants.length).toBeLessThanOrEqual(RECENT_PLANTS + 4 + 4 + MAX_TREES);
    expect(m.plants.filter((p) => p.kind === 'tree')).toHaveLength(MAX_TREES);
  });

  it('is stable: same history, same meadow, whatever the input order', () => {
    const h = sessions(40);
    expect(meadow([...h].reverse())).toEqual(meadow(h));
  });

  it('keeps a recent plant in place when a new session arrives', () => {
    const h = sessions(20);
    const before = meadow(h).plants.filter((p) => p.recent);
    const after = meadow([...h, rec(20, 25)]).plants.filter((p) => p.recent);
    const kept = before.filter((b) => after.some((a) => a.x === b.x && a.depth === b.depth && a.tint === b.tint));
    expect(kept.length).toBe(RECENT_PLANTS - 1);
  });

  it('keeps every plant inside the scene, with no two in the same spot', () => {
    const m = meadow([...sessions(60), ...Array.from({ length: 30 }, (_, i) => rec(200 + i, 90))]);
    const spots = new Set(m.plants.map((p) => `${p.x},${p.depth}`));
    expect(spots.size).toBe(m.plants.length);
    for (const p of m.plants) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.depth).toBeGreaterThanOrEqual(0);
      expect(p.depth).toBeLessThanOrEqual(1);
    }
    expect(m.plants.map((p) => p.depth)).toEqual([...m.plants.map((p) => p.depth)].sort((a, b) => a - b));
  });

  it('ties each recent plant to the session it grew from', () => {
    const h = [rec(0, 25), rec(1, 60), rec(2, 90)];
    const m = meadow(h);
    expect(m.older).toBeNull();
    for (const p of m.plants) {
      expect(p.session).not.toBeNull();
      expect(plantFor(p.session!.countedMinutes)).toBe(p.kind);
    }
    expect(m.plants.map((p) => p.session!.id).sort()).toEqual(['s0', 's1', 's2']);
  });

  it('gives merged plants no single session, and sums up the older ones', () => {
    const h = sessions(RECENT_PLANTS + 3).map((r, i) => ({ ...r, day: `2026-02-${String(i + 1).padStart(2, '0')}` }));
    const m = meadow(h);
    const recent = m.plants.filter((p) => p.recent);
    const merged = m.plants.filter((p) => !p.recent);
    expect(merged.length).toBe(3);
    expect(merged.every((p) => p.session === null)).toBe(true);
    // The oldest three merged; the newest twelve keep their own session.
    expect(recent.map((p) => p.session!.id).sort()).toEqual(h.slice(3).map((r) => r.id).sort());
    expect(m.older).toEqual({ sessions: 3, minutes: 75, firstDay: '2026-02-01', lastDay: '2026-02-03' });
  });

  it('keeps a session on its plant until it merges', () => {
    const h = sessions(RECENT_PLANTS);
    const spot = (hist: SessionRecord[], id: string) => meadow(hist).plants.find((p) => p.session?.id === id);
    const before = spot(h, 's5')!;
    const after = spot([...h, rec(50, 25)], 's5')!;
    expect([after.x, after.depth]).toEqual([before.x, before.depth]);
    expect(spot([...h, rec(50, 25)], 's0')).toBeUndefined();
  });
});
