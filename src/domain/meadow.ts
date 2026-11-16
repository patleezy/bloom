import type { SessionRecord } from './types';

/**
 * The meadow: every counted session plants something. Like medals, it is derived from
 * session history, so it needs no storage and a server could compute the same picture.
 *
 * The newest sessions show as their own plants. Older ones merge upward (flowers into
 * bushes, bushes into trees), so the meadow stays small however long the history gets,
 * and nothing ever disappears.
 */
export type PlantKind = 'flower' | 'bush' | 'tree';

export interface Plant {
  kind: PlantKind;
  /** 0 (left edge) to 1 (right edge). */
  x: number;
  /** 0 (far hill) to 1 (front of the meadow). */
  depth: number;
  /** Color variant, 0–3. */
  tint: number;
  /** One of the newest sessions, shown on its own. */
  recent: boolean;
  /** The session a recent plant grew from. Merged plants have no single session. */
  session: SessionRecord | null;
}

/** What the merged (older) plants stand for, together. */
export interface OlderSessions {
  sessions: number;
  minutes: number;
  /** YYYY-MM-DD of the earliest and latest of them. */
  firstDay: string;
  lastDay: string;
}

export interface Meadow {
  /** Far to near, ready to paint in order. */
  plants: Plant[];
  /** Sessions that have planted something, ever. */
  planted: number;
  /** The sessions behind the merged plants, or null while every plant is its own session. */
  older: OlderSessions | null;
}

export const BUSH_MINUTES = 50;
export const TREE_MINUTES = 90;
export const RECENT_PLANTS = 12;
export const MERGE_EVERY = 5;
export const MAX_TREES = 8;
export const TINTS = 4;

/** What a session of this many counted minutes plants. Uncounted sessions plant nothing. */
export function plantFor(countedMinutes: number): PlantKind | null {
  if (countedMinutes <= 0) return null;
  if (countedMinutes >= TREE_MINUTES) return 'tree';
  if (countedMinutes >= BUSH_MINUTES) return 'bush';
  return 'flower';
}

type Slot = readonly [x: number, depth: number];

/** Newest plants: the sides of the foreground, leaving the middle clear for the companion. */
const RECENT_SLOTS: readonly Slot[] = [
  [0.1, 0.9], [0.9, 0.86], [0.24, 0.72], [0.78, 0.7], [0.04, 0.68], [0.95, 0.64],
  [0.17, 0.98], [0.84, 1], [0.31, 0.6], [0.69, 0.58], [0.43, 0.56], [0.57, 0.62],
];
const FLOWER_SLOTS: readonly Slot[] = [[0.37, 0.47], [0.63, 0.45], [0.12, 0.5], [0.88, 0.48]];
const BUSH_SLOTS: readonly Slot[] = [[0.2, 0.38], [0.74, 0.36], [0.48, 0.34], [0.93, 0.4]];
const TREE_SLOTS: readonly Slot[] = [
  [0.14, 0.12], [0.84, 0.1], [0.4, 0.04], [0.63, 0.16], [0.03, 0.26], [0.96, 0.24], [0.28, 0.22], [0.53, 0.28],
];

/** Small stable string hash (FNV-1a), for a plant's color. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function meadow(history: readonly SessionRecord[]): Meadow {
  const counted = history
    .filter((r) => plantFor(r.countedMinutes))
    .sort((a, b) => a.endedAt - b.endedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const firstRecent = Math.max(0, counted.length - RECENT_PLANTS);

  // Older sessions: count by kind, then exchange small plants for bigger ones.
  const old = { flower: 0, bush: 0, tree: 0 };
  const merged = counted.slice(0, firstRecent);
  for (const r of merged) old[plantFor(r.countedMinutes)!]++;
  const bushesAll = old.bush + Math.floor(old.flower / MERGE_EVERY);
  const flowers = old.flower % MERGE_EVERY;
  const bushes = bushesAll % MERGE_EVERY;
  const trees = Math.min(MAX_TREES, old.tree + Math.floor(bushesAll / MERGE_EVERY));

  const grown = (kind: PlantKind, n: number, slots: readonly Slot[]): Plant[] =>
    Array.from({ length: n }, (_, i) => ({ kind, x: slots[i][0], depth: slots[i][1], tint: i % TINTS, recent: false, session: null }));

  // A session keeps its slot for as long as it is one of the newest; the next new session
  // takes over the slot of the one that just merged.
  const recent = counted.slice(firstRecent).map((r, i): Plant => {
    const [x, depth] = RECENT_SLOTS[(firstRecent + i) % RECENT_PLANTS];
    return { kind: plantFor(r.countedMinutes)!, x, depth, tint: hash(r.id) % TINTS, recent: true, session: r };
  });

  const plants = [
    ...grown('tree', trees, TREE_SLOTS),
    ...grown('bush', bushes, BUSH_SLOTS),
    ...grown('flower', flowers, FLOWER_SLOTS),
    ...recent,
  ].sort((a, b) => a.depth - b.depth);
  const older = merged.length
    ? {
        sessions: merged.length,
        minutes: merged.reduce((sum, r) => sum + r.countedMinutes, 0),
        firstDay: merged[0].day,
        lastDay: merged[merged.length - 1].day,
      }
    : null;
  return { plants, planted: counted.length, older };
}
