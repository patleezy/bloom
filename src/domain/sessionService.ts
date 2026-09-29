import { isUnlocked } from '../companion/species';
import { dayKey } from '../logic/dates';
import { earnedMedalIds } from './medals';
import { countedMinutes } from '../logic/growth';
import * as clock from '../logic/timer';
import { cleanLabel, cleanName, parseSnapshot, serialize } from '../state/localRepository';
import type { BloomRepository } from '../state/repository';
import { MAX_TASKS, emptySnapshot, type ActiveSession, type BloomSnapshot, type CompanionProfile, type SessionRecord, type SpeciesId } from './types';

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

  get companions(): readonly CompanionProfile[] {
    return this.snap.companions;
  }

  /** The companion on the home screen (and preselected for the next session). */
  get companion(): CompanionProfile | null {
    return this.snap.companions.find((c) => c.id === this.snap.currentId) ?? this.snap.companions[0] ?? null;
  }

  companionById(id: string): CompanionProfile | null {
    return this.snap.companions.find((c) => c.id === id) ?? null;
  }

  /** Sessions that grew a given companion. */
  historyFor(companionId: string): SessionRecord[] {
    return this.snap.history.filter((r) => r.companionId === companionId);
  }

  /** Sessions that grew the current companion. */
  get companionHistory(): SessionRecord[] {
    return this.companion ? this.historyFor(this.companion.id) : [];
  }

  /** The companion joining the active session. */
  get sessionCompanion(): CompanionProfile | null {
    return this.snap.active ? this.companionById(this.snap.active.companionId) : null;
  }

  /** Species that can be adopted right now (starters, plus unlockables whose medal is earned). */
  canAdopt(species: SpeciesId): boolean {
    return isUnlocked(species, earnedMedalIds(this.snap.history));
  }

  /** Adopt a companion (one per species) and make it current. Locked species are refused. */
  async adopt(species: SpeciesId, name: string): Promise<CompanionProfile> {
    const existing = this.snap.companions.find((c) => c.species === species);
    if (existing) {
      await this.setCurrent(existing.id);
      return existing;
    }
    if (!this.canAdopt(species)) throw new Error(`${species} is still locked`);
    const companion: CompanionProfile = {
      id: this.newId(),
      species,
      name: cleanName(name) || 'Buddy',
      adoptedAt: this.now(),
    };
    this.snap.companions.push(companion);
    await this.repo.saveCompanion(companion);
    await this.setCurrent(companion.id);
    return companion;
  }

  async setCurrent(companionId: string): Promise<void> {
    if (!this.companionById(companionId)) return;
    this.snap.currentId = companionId;
    await this.repo.setCurrent(companionId);
  }

  async rename(name: string, companionId = this.companion?.id): Promise<void> {
    const c = companionId ? this.companionById(companionId) : null;
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
    if (!snap || !snap.companions.length) return false;
    snap.active = null;
    await this.repo.replaceAll(snap);
    this.snap = snap;
    return true;
  }

  get active(): ActiveSession | null {
    return this.snap.active;
  }

  /** Start a session with a companion (defaults to the current one, which it then becomes). */
  async start(minutes: number, tasks: string[] = [], companionId = this.companion?.id): Promise<ActiveSession> {
    if (!companionId || !this.companionById(companionId)) throw new Error('No companion to focus with');
    await this.setCurrent(companionId);
    const t = this.now();
    const mins = Math.min(Math.max(Math.round(minutes), 1), 240);
    const active: ActiveSession = {
      id: this.newId(),
      companionId,
      startedAt: t,
      tasks: tasks.map(cleanLabel).filter(Boolean).slice(0, MAX_TASKS).map((text) => ({ text, done: false })),
      clock: clock.newClock(mins * 60000, t),
      checkpointMs: 0,
    };
    this.snap.active = active;
    await this.repo.saveActive(active);
    return active;
  }

  async pause(): Promise<void> {
    const a = this.snap.active;
    if (!a || a.clock.runningSince === null) return;
    a.clock = clock.pause(a.clock, this.now());
    a.checkpointMs = a.clock.bankedMs;
    await this.repo.saveActive(a);
  }

  /** Pause as of an earlier moment (used when the user was away past the grace period). */
  async pauseAt(t: number): Promise<void> {
    const a = this.snap.active;
    if (!a || a.clock.runningSince === null) return;
    a.clock = clock.pause(a.clock, Math.max(a.clock.runningSince, Math.min(t, this.now())));
    a.checkpointMs = a.clock.bankedMs;
    await this.repo.saveActive(a);
  }

  /** Save focused time so far, so a reload doesn't lose it. */
  async checkpoint(): Promise<void> {
    const a = this.snap.active;
    if (!a) return;
    a.checkpointMs = clock.elapsed(a.clock, this.now());
    await this.repo.saveActive(a);
  }

  async toggleTask(index: number): Promise<boolean> {
    const task = this.snap.active?.tasks[index];
    if (!task) return false;
    task.done = !task.done;
    await this.repo.saveActive(this.snap.active);
    return task.done;
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
      companionId: a.companionId,
      startedAt: a.startedAt,
      endedAt: t,
      day: dayKey(new Date(t)),
      plannedMs: a.clock.plannedMs,
      focusedMs,
      countedMinutes: countedMinutes(focusedMs),
      tasks: a.tasks.map((t) => ({ ...t })),
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
