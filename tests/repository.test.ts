import { describe, expect, it } from 'vitest';
import { SessionService } from '../src/domain/sessionService';
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

describe('parseStored', () => {
  it('survives garbage', () => {
    expect(parseStored('not json')).toEqual({ history: [], active: null });
    expect(parseStored('{"schemaVersion":99}')).toEqual({ history: [], active: null });
    expect(parseStored('null')).toEqual({ history: [], active: null });
  });
  it('drops invalid records and sanitizes labels', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      active: null,
      history: [
        { id: 'a', startedAt: 1, endedAt: 2, day: '2026-09-27', plannedMs: 1, focusedMs: 1, countedMinutes: 5,
          label: 'x'.repeat(200) + '\u0000', completed: true },
        { id: 'b', day: 'bad' },
        { id: 'a', startedAt: 1, endedAt: 2, day: '2026-09-27', plannedMs: 1, focusedMs: 1, countedMinutes: 5 },
      ],
    });
    const s = parseStored(raw);
    expect(s.history).toHaveLength(1);
    expect(s.history[0].label).toHaveLength(60);
  });
});

describe('SessionService', () => {
  it('records a session and restores an active one paused', async () => {
    const storage = new MemStorage();
    let t = 1_000_000;
    const svc = new SessionService(new LocalRepository(storage), () => t, () => 'id-1');
    await svc.init();
    await svc.start(25, '  Write essay  ');
    t += 10 * 60000;

    // Simulate reload mid-session: restored paused, time closed doesn't count.
    const svc2 = new SessionService(new LocalRepository(storage), () => t);
    await svc2.init();
    expect(svc2.active?.label).toBe('Write essay');
    expect(svc2.active?.clock.runningSince).toBeNull();

    t += 60 * 60000;
    expect(svc.elapsedMs()).toBe(25 * 60000);
    const rec = await svc.finish();
    expect(rec?.countedMinutes).toBe(25);
    expect(rec?.completed).toBe(true);

    const svc3 = new SessionService(new LocalRepository(storage));
    await svc3.init();
    expect(svc3.history).toHaveLength(1);
    expect(svc3.active).toBeNull();
  });
});
