import { describe, expect, it } from 'vitest';
import { SessionService } from '../src/domain/sessionService';
import { emptySnapshot } from '../src/domain/types';
import { LocalRepository, parseStored } from '../src/state/localRepository';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

const rec = (id: string, extra: object = {}) => ({
  id, companionId: 'c1', startedAt: 1, endedAt: 2, day: '2026-09-27', plannedMs: 1, focusedMs: 1,
  countedMinutes: 5, tasks: [], completed: true, ...extra,
});

describe('parseStored', () => {
  it('survives garbage', () => {
    expect(parseStored('not json')).toEqual(emptySnapshot());
    expect(parseStored('{"schemaVersion":99}')).toEqual(emptySnapshot());
    expect(parseStored('null')).toEqual(emptySnapshot());
  });

  it('drops invalid records, duplicates, and sanitizes text', () => {
    const s = parseStored(JSON.stringify({
      schemaVersion: 3,
      active: null,
      companion: { id: 'c1', species: 'kindle', name: '  Fi\u0000ery<b>' + 'x'.repeat(50), adoptedAt: 1 },
      history: [
        rec('a', { tasks: [{ text: 'x'.repeat(200), done: true }, { text: '' }, { text: 'b' }, { text: 'c' }, { text: 'd' }] }),
        { id: 'b', day: 'bad' },
        rec('a'),
      ],
    }));
    expect(s.history).toHaveLength(1);
    expect(s.history[0].tasks).toHaveLength(3); // empty dropped, capped at 3
    expect(s.history[0].tasks[0]).toEqual({ text: 'x'.repeat(60), done: true });
    expect(s.companion?.name.length).toBeLessThanOrEqual(20);
    expect(s.companion?.name).not.toContain('\u0000');
  });

  it('rejects unknown species', () => {
    const s = parseStored(JSON.stringify({ schemaVersion: 3, companion: { id: 'c', species: 'dragon', name: 'x', adoptedAt: 1 }, history: [], active: null }));
    expect(s.companion).toBeNull();
  });

  it('migrates v2 labels to focus tasks', () => {
    const { tasks: _t, ...v2rec } = rec('a', { label: 'Essay' });
    const s = parseStored(JSON.stringify({ schemaVersion: 2, companion: { id: 'c1', species: 'ripple', name: 'P', adoptedAt: 1 },
      history: [v2rec, { ...v2rec, id: 'b', label: '' }], active: null }));
    expect(s.history[0].tasks).toEqual([{ text: 'Essay', done: false }]);
    expect(s.history[1].tasks).toEqual([]);
  });

  it('migrates v1 data to a Bloomling that keeps its growth', () => {
    const { companionId: _, tasks: _t, ...v1rec } = rec('a', { countedMinutes: 300 });
    const s = parseStored(JSON.stringify({ schemaVersion: 1, history: [v1rec], active: null }));
    expect(s.companion?.species).toBe('bloomling');
    expect(s.history[0].companionId).toBe(s.companion?.id);
  });
});

describe('SessionService', () => {
  it('adopts, records a session, and restores an active one paused', async () => {
    const storage = new MemStorage();
    let t = 1_000_000;
    let n = 0;
    const svc = new SessionService(new LocalRepository(storage), () => t, () => `id-${++n}`);
    await svc.init();
    const c = await svc.adopt('ripple', 'Pip');
    await svc.start(25, ['  Write essay  ', '', 'Email']);
    t += 10 * 60000;
    await svc.checkpoint();
    expect(await svc.toggleTask(1)).toBe(true);

    // Reload mid-session: restored paused, keeping the time earned up to the checkpoint.
    const svc2 = new SessionService(new LocalRepository(storage), () => t);
    await svc2.init();
    expect(svc2.companion?.name).toBe('Pip');
    expect(svc2.active?.tasks).toEqual([{ text: 'Write essay', done: false }, { text: 'Email', done: true }]);
    expect(svc2.active?.clock.runningSince).toBeNull();
    expect(svc2.elapsedMs()).toBe(10 * 60000);

    t += 60 * 60000;
    const r = await svc.finish();
    expect(r?.countedMinutes).toBe(25);
    expect(r?.companionId).toBe(c.id);
    expect(r?.tasks[1].done).toBe(true);
    expect(svc.companionHistory).toHaveLength(1);
  });

  it('round-trips a backup and rejects bad files without changing anything', async () => {
    const a = new SessionService(new LocalRepository(new MemStorage()));
    await a.init();
    await a.adopt('kindle', 'Ember');
    await a.start(25);
    await a.finish();
    const backup = a.exportBackup();

    const b = new SessionService(new LocalRepository(new MemStorage()));
    await b.init();
    await b.adopt('bloomling', 'Other');
    expect(await b.importBackup('{"nope":1}')).toBe(false);
    expect(b.companion?.name).toBe('Other');
    expect(await b.importBackup(backup)).toBe(true);
    expect(b.companion?.name).toBe('Ember');
    expect(b.history).toHaveLength(1);
  });
});

describe('away grace period', () => {
  it('pauseAt credits time only up to the given moment', async () => {
    let t = 0;
    const svc = new SessionService(new LocalRepository(new MemStorage()), () => t);
    await svc.init();
    await svc.adopt('bloomling', 'B');
    await svc.start(25);
    t = 5 * 60000; // user leaves at 5:00
    const hiddenAt = t;
    t = 12 * 60000; // comes back 7 minutes later
    await svc.pauseAt(hiddenAt + 60_000); // grace: first minute away counts
    expect(svc.elapsedMs()).toBe(6 * 60000);
    expect(svc.active?.clock.runningSince).toBeNull();
    expect(svc.isDone()).toBe(false);
  });
});
