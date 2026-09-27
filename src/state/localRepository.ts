import type { ActiveSession, BloomSnapshot, SessionRecord } from '../domain/types';
import type { BloomRepository } from './repository';

/** All data stays in this browser's localStorage. Nothing is sent over the network. */
const KEY = 'bloom:data';
export const SCHEMA_VERSION = 1;
const MAX_LABEL = 60;
const MAX_PLANNED_MS = 24 * 3600_000;

interface StoredV1 {
  schemaVersion: 1;
  history: SessionRecord[];
  active: ActiveSession | null;
}

export function cleanLabel(raw: unknown): string {
  return typeof raw === 'string' ? raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LABEL) : '';
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,64}$/.test(v);

function parseRecord(r: unknown): SessionRecord | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  if (!isId(o.id) || !isNum(o.startedAt) || !isNum(o.endedAt)) return null;
  if (!isNum(o.plannedMs) || !isNum(o.focusedMs) || !isNum(o.countedMinutes)) return null;
  if (typeof o.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.day)) return null;
  return {
    id: o.id,
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

/** Upgrade older stored shapes to the current one. Add a step per future version. */
function migrate(o: Record<string, unknown>): Record<string, unknown> | null {
  if (o.schemaVersion === SCHEMA_VERSION) return o;
  return null; // unknown/newer version: don't guess
}

/** Parse untrusted stored JSON. Malformed data falls back to a fresh start. */
export function parseStored(raw: string | null): BloomSnapshot {
  const empty: BloomSnapshot = { history: [], active: null };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return empty;
    const o = migrate(parsed as Record<string, unknown>);
    if (!o) return empty;
    const history = Array.isArray(o.history)
      ? o.history.map(parseRecord).filter((r): r is SessionRecord => r !== null)
      : [];
    const seen = new Set<string>();
    const unique = history.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
    return { history: unique, active: parseActive(o.active) };
  } catch {
    return empty;
  }
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

  async clearAll(): Promise<void> {
    this.snapshot = { history: [], active: null };
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
    const stored: StoredV1 = { schemaVersion: 1, history: s.history, active: s.active };
    try {
      this.storage?.setItem(KEY, JSON.stringify(stored));
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
