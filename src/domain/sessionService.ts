import { dayKey } from '../logic/dates';
import { countedMinutes } from '../logic/growth';
import * as clock from '../logic/timer';
import { cleanLabel, cleanName, parseSnapshot, serialize } from '../state/localRepository';
import type { BloomRepository } from '../state/repository';
import { emptySnapshot, type ActiveSession, type BloomSnapshot, type CompanionProfile, type SessionRecord, type SpeciesId } from './types';

export type Now = () => number;

/**
 * Application logic for focus sessions. Owns the in-memory snapshot and writes through
 * to the repository. UI calls this; it never touches storage directly.
 */
export class SessionService {
  private snap: BloomSnapshot = emptySnapshot();

  constructor(
    private repo: BloomRepository,
    private now: Now = Date.now,
    private newId: () => string = () => crypto.randomUUID(),
  ) {}

  async init(): Promise<void> {
    this.snap = await this.repo.load();
  }

  get history(): readonly SessionRecord[] {
    return this.snap.history;
  }

  get companion(): CompanionProfile | null {
    return this.snap.companion;
  }

  /** Sessions that grew the current companion. */
  get companionHistory(): SessionRecord[] {
    const id = this.snap.companion?.id;
    return this.snap.history.filter((r) => r.companionId === id);
  }

  async adopt(species: SpeciesId, name: string): Promise<CompanionProfile> {
    const companion: CompanionProfile = {
      id: this.newId(),
      species,
      name: cleanName(name) || 'Buddy',
      adoptedAt: this.now(),
    };
    this.snap.companion = companion;
    await this.repo.saveCompanion(companion);
    return companion;
  }

  async rename(name: string): Promise<void> {
    const c = this.snap.companion;
    const clean = cleanName(name);
    if (!c || !clean) return;
    c.name = clean;
    await this.repo.saveCompanion(c);
  }

  /** Backup file contents. Stays on the device; the user decides where it goes. */
  exportBackup(): string {
    return serialize({ ...this.snap, active: null });
  }

  /** Validate and restore a backup. Returns false (changing nothing) if the file is invalid. */
  async importBackup(raw: string): Promise<boolean> {
    const snap = parseSnapshot(raw);
    if (!snap || !snap.companion) return false;
    snap.active = null;
    await this.repo.replaceAll(snap);
    this.snap = snap;
    return true;
  }

  get active(): ActiveSession | null {
    return this.snap.active;
  }

  async start(minutes: number, label: string): Promise<ActiveSession> {
    const t = this.now();
    const mins = Math.min(Math.max(Math.round(minutes), 1), 240);
    const active: ActiveSession = {
      id: this.newId(),
      startedAt: t,
      label: cleanLabel(label),
      clock: clock.newClock(mins * 60000, t),
    };
    this.snap.active = active;
    await this.repo.saveActive(active);
    return active;
  }

  async pause(): Promise<void> {
    const a = this.snap.active;
    if (!a || a.clock.runningSince === null) return;
    a.clock = clock.pause(a.clock, this.now());
    await this.repo.saveActive(a);
  }

  async resume(): Promise<void> {
    const a = this.snap.active;
    if (!a || a.clock.runningSince !== null) return;
    a.clock = clock.resume(a.clock, this.now());
    await this.repo.saveActive(a);
  }

  elapsedMs(): number {
    return this.snap.active ? clock.elapsed(this.snap.active.clock, this.now()) : 0;
  }

  isDone(): boolean {
    return !!this.snap.active && clock.isDone(this.snap.active.clock, this.now());
  }

  /** Ends the active session (early or on time) and records it. */
  async finish(): Promise<SessionRecord | null> {
    const a = this.snap.active;
    if (!a) return null;
    const t = this.now();
    const focusedMs = clock.elapsed(a.clock, t);
    const record: SessionRecord = {
      id: a.id,
      companionId: this.snap.companion?.id ?? 'none',
      startedAt: a.startedAt,
      endedAt: t,
      day: dayKey(new Date(t)),
      plannedMs: a.clock.plannedMs,
      focusedMs,
      countedMinutes: countedMinutes(focusedMs),
      label: a.label,
      completed: focusedMs >= a.clock.plannedMs,
    };
    this.snap.history.push(record);
    this.snap.active = null;
    await this.repo.appendSession(record);
    await this.repo.saveActive(null);
    return record;
  }

  async clearAll(): Promise<void> {
    await this.repo.clearAll();
    this.snap = emptySnapshot();
  }
}
