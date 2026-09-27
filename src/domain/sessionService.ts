import { dayKey } from '../logic/dates';
import { countedMinutes } from '../logic/growth';
import * as clock from '../logic/timer';
import { cleanLabel } from '../state/localRepository';
import type { BloomRepository } from '../state/repository';
import type { ActiveSession, BloomSnapshot, SessionRecord } from './types';

export type Now = () => number;

/**
 * Application logic for focus sessions. Owns the in-memory snapshot and writes through
 * to the repository. UI calls this; it never touches storage directly.
 */
export class SessionService {
  private snap: BloomSnapshot = { history: [], active: null };

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
    this.snap = { history: [], active: null };
  }
}
