import {
  emptySnapshot,
  type ActiveSession,
  type BloomSnapshot,
  type CompanionProfile,
  type SessionRecord,
  type SpeciesId,
} from '../domain/types';
import type { BloomRepository } from './repository';

/** All data stays in this browser's localStorage. Nothing is sent over the network. */
const KEY = 'bloom:data';
export const SCHEMA_VERSION = 2;
const MAX_LABEL = 60;
export const MAX_NAME = 20;
const MAX_PLANNED_MS = 24 * 3600_000;
const MAX_HISTORY = 20_000;
const SPECIES: readonly SpeciesId[] = ['bloomling', 'kindle', 'ripple'];

interface StoredV2 {
  schemaVersion: 2;
  companion: CompanionProfile | null;
  history: SessionRecord[];
  active: ActiveSession | null;
}

function cleanText(raw: unknown, max: number): string {
  return typeof raw === 'string' ? raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';
}
export const cleanLabel = (raw: unknown) => cleanText(raw, MAX_LABEL);
export const cleanName = (raw: unknown) => cleanText(raw, MAX_NAME);

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,64}$/.test(v);
const isSpecies = (v: unknown): v is SpeciesId => SPECIES.includes(v as SpeciesId);

function parseCompanion(c: unknown): CompanionProfile | null {
  if (!c || typeof c !== 'object') return null;
  const o = c as Record<string, unknown>;
  if (!isId(o.id) || !isSpecies(o.species) || !isNum(o.adoptedAt)) return null;
  const name = cleanName(o.name);
  return { id: o.id, species: o.species, name: name || 'Buddy', adoptedAt: o.adoptedAt };
}

function parseRecord(r: unknown): SessionRecord | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  if (!isId(o.id) || !isId(o.companionId) || !isNum(o.startedAt) || !isNum(o.endedAt)) return null;
  if (!isNum(o.plannedMs) || !isNum(o.focusedMs) || !isNum(o.countedMinutes)) return null;
  if (typeof o.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.day)) return null;
  return {
    id: o.id,
    companionId: o.companionId,
    startedAt: o.startedAt,
    endedAt: o.endedAt,
    day: o.day,
    plannedMs: Math.min(o.plannedMs, MAX_PLANNED_MS),
    focusedMs: Math.min(o.focusedMs, MAX_PLANNED_MS),
    countedMinutes: Math.min(Math.floor(o.countedMinutes), MAX_PLANNED_MS / 60000),
    label: cleanLabel(o.label),
    completed: o.completed === true,
  };
}

function parseActive(a: unknown): ActiveSession | null {
  if (!a || typeof a !== 'object') return null;
  const o = a as Record<string, unknown>;
  const c = o.clock as Record<string, unknown> | undefined;
  if (!isId(o.id) || !isNum(o.startedAt) || !c || !isNum(c.plannedMs) || !isNum(c.bankedMs)) return null;
  if (c.plannedMs <= 0 || c.plannedMs > MAX_PLANNED_MS) return null;
  // Always restore paused: time with the page closed is not focus time.
  return {
    id: o.id,
    startedAt: o.startedAt,
    label: cleanLabel(o.label),
    clock: { plannedMs: c.plannedMs, bankedMs: Math.min(c.bankedMs, c.plannedMs), runningSince: null },
  };
}

const LEGACY_COMPANION_ID = 'legacy-bloomling';

/** Upgrade older stored shapes to the current one, one version at a time. */
function migrate(o: Record<string, unknown>): Record<string, unknown> | null {
  let cur = o;
  if (cur.schemaVersion === 1) {
    // v1 had a single implicit Bloomling and no companionId on sessions.
    const history = Array.isArray(cur.history) ? cur.history : [];
    cur = {
      schemaVersion: 2,
      companion: history.length
        ? { id: LEGACY_COMPANION_ID, species: 'bloomling', name: 'Bloomling', adoptedAt: 0 }
        : null,
      history: history.map((r) =>
        r && typeof r === 'object' ? { ...(r as object), companionId: LEGACY_COMPANION_ID } : r),
      active: cur.active,
    };
  }
  return cur.schemaVersion === SCHEMA_VERSION ? cur : null; // unknown/newer version: don't guess
}

/** Parse untrusted JSON (from storage or an imported backup). Malformed data yields null. */
export function parseSnapshot(raw: string | null): BloomSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const o = migrate(parsed as Record<string, unknown>);
    if (!o) return null;
    const seen = new Set<string>();
    const history = (Array.isArray(o.history) ? o.history : [])
      .slice(-MAX_HISTORY)
      .map(parseRecord)
      .filter((r): r is SessionRecord => r !== null && !seen.has(r.id) && !!seen.add(r.id));
    return { companion: parseCompanion(o.companion), history, active: parseActive(o.active) };
  } catch {
    return null;
  }
}

export const parseStored = (raw: string | null): BloomSnapshot => parseSnapshot(raw) ?? emptySnapshot();

export function serialize(s: BloomSnapshot): string {
  const stored: StoredV2 = { schemaVersion: 2, companion: s.companion, history: s.history, active: s.active };
  return JSON.stringify(stored);
}

export class LocalRepository implements BloomRepository {
  private snapshot: BloomSnapshot | null = null;

  constructor(private storage: Storage | null = safeLocalStorage()) {}

  async load(): Promise<BloomSnapshot> {
    let raw: string | null = null;
    try {
      raw = this.storage?.getItem(KEY) ?? null;
    } catch {
      /* blocked storage */
    }
    this.snapshot = parseStored(raw);
    return structuredClone(this.snapshot);
  }

  async saveCompanion(companion: CompanionProfile): Promise<void> {
    const s = await this.current();
    s.companion = structuredClone(companion);
    this.persist(s);
  }

  async saveActive(active: ActiveSession | null): Promise<void> {
    const s = await this.current();
    s.active = active ? structuredClone(active) : null;
    this.persist(s);
  }

  async appendSession(record: SessionRecord): Promise<void> {
    const s = await this.current();
    if (!s.history.some((r) => r.id === record.id)) s.history.push(structuredClone(record));
    this.persist(s);
  }

  async replaceAll(snapshot: BloomSnapshot): Promise<void> {
    this.snapshot = structuredClone(snapshot);
    this.persist(this.snapshot);
  }

  async clearAll(): Promise<void> {
    this.snapshot = emptySnapshot();
    try {
      this.storage?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  private async current(): Promise<BloomSnapshot> {
    if (!this.snapshot) await this.load();
    return this.snapshot!;
  }

  private persist(s: BloomSnapshot): void {
    try {
      this.storage?.setItem(KEY, serialize(s));
    } catch {
      // Storage full or blocked (e.g. private mode): app keeps working in memory.
    }
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
