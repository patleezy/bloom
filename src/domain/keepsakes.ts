import type { KeepsakeLog, SessionRecord } from './types';

/**
 * Keepsakes: a gift after every session of 5+ minutes. What's inside is derived from the
 * session history (seeded by session id), so it can't be rerolled and needs no storage.
 * Only which gifts were opened and which items were picked with Sparkles are stored.
 * Never sold: there is no way to get gifts or Sparkles except by focusing.
 */
export type Rarity = 'seed' | 'sprout' | 'bloom' | 'golden';
export type ItemKind = 'wear' | 'friend' | 'backdrop';

export const RARITIES: Rarity[] = ['seed', 'sprout', 'bloom', 'golden'];

export interface KeepsakeItem {
  id: string;
  name: string;
  rarity: Rarity;
  kind: ItemKind;
}

export const ITEMS: KeepsakeItem[] = [
  { id: 'daisy-clip', name: 'Daisy clip', rarity: 'seed', kind: 'wear' },
  { id: 'leaf-cap', name: 'Leaf cap', rarity: 'seed', kind: 'wear' },
  { id: 'acorn-hat', name: 'Acorn hat', rarity: 'seed', kind: 'wear' },
  { id: 'cozy-scarf', name: 'Cozy scarf', rarity: 'seed', kind: 'wear' },
  { id: 'berry-bow', name: 'Berry bow', rarity: 'seed', kind: 'wear' },
  { id: 'ladybug', name: 'Ladybug', rarity: 'seed', kind: 'friend' },
  { id: 'snail', name: 'Snail', rarity: 'seed', kind: 'friend' },
  { id: 'pebble', name: 'Pebble pal', rarity: 'seed', kind: 'friend' },
  { id: 'picnic', name: 'Picnic blanket', rarity: 'seed', kind: 'backdrop' },
  { id: 'meadow', name: 'Meadow', rarity: 'seed', kind: 'backdrop' },
  { id: 'sun-hat', name: 'Sun hat', rarity: 'sprout', kind: 'wear' },
  { id: 'mushroom-cap', name: 'Mushroom cap', rarity: 'sprout', kind: 'wear' },
  { id: 'beanie', name: 'Knit beanie', rarity: 'sprout', kind: 'wear' },
  { id: 'bumblebee', name: 'Bumblebee', rarity: 'sprout', kind: 'friend' },
  { id: 'frog', name: 'Little frog', rarity: 'sprout', kind: 'friend' },
  { id: 'pond', name: 'Lily pond', rarity: 'sprout', kind: 'backdrop' },
  { id: 'sunset-hill', name: 'Sunset hill', rarity: 'sprout', kind: 'backdrop' },
  { id: 'flower-crown', name: 'Flower crown', rarity: 'bloom', kind: 'wear' },
  { id: 'star-scarf', name: 'Starry scarf', rarity: 'bloom', kind: 'wear' },
  { id: 'butterfly', name: 'Butterfly', rarity: 'bloom', kind: 'friend' },
  { id: 'songbird', name: 'Songbird', rarity: 'bloom', kind: 'friend' },
  { id: 'blossom', name: 'Cherry blossom', rarity: 'bloom', kind: 'backdrop' },
  { id: 'golden-crown', name: 'Golden crown', rarity: 'golden', kind: 'wear' },
  { id: 'rainbow', name: 'Rainbow', rarity: 'golden', kind: 'backdrop' },
];

export const ITEM_IDS = new Set(ITEMS.map((i) => i.id));
export const itemById = (id: string): KeepsakeItem | undefined => ITEMS.find((i) => i.id === id);

/** Minimum session length that earns a gift (same as counting toward growth). */
export const GIFT_MIN_MINUTES = 5;
/** A Bloom or better at least once in this many gifts. */
export const PITY_EVERY = 10;
/** Sparkles from a duplicate, and the price to pick a specific item. */
export const DUPLICATE_SPARKLES: Record<Rarity, number> = { seed: 1, sprout: 3, bloom: 8, golden: 20 };
export const PICK_COST: Record<Rarity, number> = { seed: 5, sprout: 15, bloom: 40, golden: 100 };

/** Odds in percent [seed, sprout, bloom, golden]; longer sessions improve them. */
export function oddsFor(minutes: number): [number, number, number, number] {
  if (minutes >= 50) return [40, 35, 20, 5];
  if (minutes >= 25) return [50, 32, 15, 3];
  return [60, 28, 10, 2];
}

/** FNV-1a hash of the seed, fed into mulberry32: a small, stable PRNG (not for security). */
function rng(seed: string): () => number {
  let a = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 0x01000193);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Gift {
  sessionId: string;
  endedAt: number;
  item: KeepsakeItem;
}

/** Gifts earned by sessions (oldest first). Sessions before `giftsFrom` don't get one. */
export function deriveGifts(history: readonly SessionRecord[], giftsFrom: number): Gift[] {
  const gifts: Gift[] = [];
  let sinceRare = 0;
  const sessions = history
    .filter((r) => r.countedMinutes >= GIFT_MIN_MINUTES && r.endedAt >= giftsFrom)
    .sort((a, b) => a.endedAt - b.endedAt || (a.id < b.id ? -1 : 1));
  for (const r of sessions) {
    const rand = rng(r.id);
    const odds = oddsFor(r.countedMinutes);
    let rarity: Rarity;
    if (sinceRare >= PITY_EVERY - 1) {
      // Guaranteed Bloom or better, keeping their relative odds.
      rarity = rand() * (odds[2] + odds[3]) < odds[2] ? 'bloom' : 'golden';
    } else {
      let roll = rand() * 100;
      rarity = 'golden';
      for (let i = 0; i < 4; i++) {
        if (roll < odds[i]) { rarity = RARITIES[i]; break; }
        roll -= odds[i];
      }
    }
    sinceRare = rarity === 'bloom' || rarity === 'golden' ? 0 : sinceRare + 1;
    const pool = ITEMS.filter((i) => i.rarity === rarity);
    gifts.push({ sessionId: r.id, endedAt: r.endedAt, item: pool[Math.floor(rand() * pool.length)] });
  }
  return gifts;
}

export interface OpenedGift extends Gift {
  openedAt: number;
  /** Sparkles it turned into, or 0 if it was new. */
  sparkles: number;
}

export interface KeepsakeState {
  unopened: Gift[];
  opened: OpenedGift[];
  /** Item id → when it joined the collection. */
  owned: Map<string, number>;
  sparkles: number;
}

/** Replay opens and picks in time order: an item you already have becomes Sparkles. */
export function keepsakeState(history: readonly SessionRecord[], log: KeepsakeLog): KeepsakeState {
  const gifts = deriveGifts(history, log.giftsFrom);
  const byId = new Map(gifts.map((g) => [g.sessionId, g]));
  const events = [
    ...log.opened.flatMap((o) => (byId.has(o.id) ? [{ at: o.at, gift: byId.get(o.id)!, item: null as string | null }] : [])),
    ...log.picked.map((p) => ({ at: p.at, gift: null as Gift | null, item: p.item })),
  ].sort((a, b) => a.at - b.at);
  const owned = new Map<string, number>();
  const opened: OpenedGift[] = [];
  let sparkles = 0;
  for (const e of events) {
    if (e.gift) {
      const dup = owned.has(e.gift.item.id);
      const got = dup ? DUPLICATE_SPARKLES[e.gift.item.rarity] : 0;
      sparkles += got;
      if (!dup) owned.set(e.gift.item.id, e.at);
      opened.push({ ...e.gift, openedAt: e.at, sparkles: got });
    } else if (e.item) {
      const item = itemById(e.item);
      if (!item || owned.has(item.id) || sparkles < PICK_COST[item.rarity]) continue; // invalid pick: ignore
      sparkles -= PICK_COST[item.rarity];
      owned.set(item.id, e.at);
    }
  }
  const openedIds = new Set(opened.map((o) => o.sessionId));
  return { unopened: gifts.filter((g) => !openedIds.has(g.sessionId)), opened, owned, sparkles };
}
