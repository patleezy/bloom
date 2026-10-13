import { describe, expect, it } from 'vitest';
import {
  DUPLICATE_SPARKLES, ITEMS, PICK_COST, PITY_EVERY, deriveGifts, keepsakeState, type Rarity,
} from '../src/domain/keepsakes';
import { hasArt } from '../src/companion/keepsakeArt';
import { WEARABLE } from '../src/companion/render';
import { emptyKeepsakes, type SessionRecord } from '../src/domain/types';

const rec = (id: string, minutes: number, endedAt: number): SessionRecord => ({
  id, companionId: 'c1', startedAt: endedAt - minutes * 60000, endedAt, day: '2026-10-13',
  plannedMs: minutes * 60000, focusedMs: minutes * 60000, countedMinutes: minutes, tasks: [], completed: true,
});
const many = (n: number, minutes: number) => Array.from({ length: n }, (_, i) => rec(`s-${minutes}-${i}`, minutes, 1000 + i));
const rare = (r: Rarity) => r === 'bloom' || r === 'golden';

describe('gifts', () => {
  it('are the same every time (seeded by session id)', () => {
    const h = many(50, 25);
    expect(deriveGifts(h, 0).map((g) => g.item.id)).toEqual(deriveGifts([...h].reverse(), 0).map((g) => g.item.id));
  });

  it('need 5+ minutes and a session after gifts started', () => {
    const h = [rec('short', 4, 10), rec('old', 25, 10), rec('new', 25, 100)];
    expect(deriveGifts(h, 50).map((g) => g.sessionId)).toEqual(['new']);
  });

  it(`guarantee a Bloom or better at least every ${PITY_EVERY} gifts`, () => {
    let run = 0;
    for (const g of deriveGifts(many(2000, 5), 0)) {
      run = rare(g.item.rarity) ? 0 : run + 1;
      expect(run).toBeLessThan(PITY_EVERY);
    }
  });

  it('get better with longer sessions', () => {
    const rate = (m: number) => deriveGifts(many(3000, m), 0).filter((g) => rare(g.item.rarity)).length / 3000;
    expect(rate(25)).toBeGreaterThan(rate(5));
    expect(rate(50)).toBeGreaterThan(rate(25));
  });

  it('every item has art and a unique id', () => {
    expect(ITEMS.every((i) => hasArt(i.id))).toBe(true);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it('every wearable item has a place to sit', () => {
    expect([...WEARABLE].sort()).toEqual(ITEMS.filter((i) => i.kind === 'wear').map((i) => i.id).sort());
  });

  it('can be any item in the catalog', () => {
    const seen = new Set(deriveGifts(many(3000, 50), 0).map((g) => g.item.id));
    expect(seen.size).toBe(ITEMS.length);
  });
});

describe('keepsake state', () => {
  const h = many(40, 25);
  const gifts = deriveGifts(h, 0);

  it('lists unopened gifts until opened', () => {
    const s = keepsakeState(h, { ...emptyKeepsakes(), opened: [{ id: gifts[0].sessionId, at: 1 }] });
    expect(s.unopened).toHaveLength(gifts.length - 1);
    expect(s.owned.has(gifts[0].item.id)).toBe(true);
  });

  it('turns duplicates into Sparkles, in the order gifts were opened', () => {
    // 40 gifts from 24 items always repeat one: b is a later copy of a.
    const b = gifts.find((g, i) => gifts.findIndex((x) => x.item.id === g.item.id) !== i)!;
    const a = gifts.find((x) => x.item.id === b.item.id)!;
    // Open the later one first: it's new, and the earlier one becomes the duplicate.
    const s = keepsakeState(h, { ...emptyKeepsakes(), opened: [{ id: b.sessionId, at: 1 }, { id: a.sessionId, at: 2 }] });
    expect(s.opened.find((o) => o.sessionId === b.sessionId)!.sparkles).toBe(0);
    expect(s.opened.find((o) => o.sessionId === a.sessionId)!.sparkles).toBe(DUPLICATE_SPARKLES[a.item.rarity]);
    expect(s.sparkles).toBe(DUPLICATE_SPARKLES[a.item.rarity]);
  });

  it('only lets you pick missing items you can afford', () => {
    const opened = gifts.map((g, i) => ({ id: g.sessionId, at: i + 1 }));
    const before = keepsakeState(h, { ...emptyKeepsakes(), opened });
    const missing = ITEMS.find((i) => !before.owned.has(i.id) && PICK_COST[i.rarity] <= before.sparkles);
    const owned = ITEMS.find((i) => before.owned.has(i.id))!;
    const picked = [{ item: owned.id, at: 100 }, ...(missing ? [{ item: missing.id, at: 101 }] : [])];
    const after = keepsakeState(h, { ...emptyKeepsakes(), opened, picked });
    if (missing) {
      expect(after.owned.has(missing.id)).toBe(true);
      expect(after.sparkles).toBe(before.sparkles - PICK_COST[missing.rarity]);
    } else expect(after.sparkles).toBe(before.sparkles);
    // Can't pick with no Sparkles
    expect(keepsakeState(h, { ...emptyKeepsakes(), picked: [{ item: 'rainbow', at: 1 }] }).owned.size).toBe(0);
  });

  it('ignores opens for sessions that brought no gift', () => {
    const s = keepsakeState(h, { ...emptyKeepsakes(), opened: [{ id: 'nope', at: 1 }] });
    expect(s.opened).toHaveLength(0);
  });
});
