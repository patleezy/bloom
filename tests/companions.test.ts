import { describe, expect, it } from 'vitest';
import { SessionService } from '../src/domain/sessionService';
import { totalMinutes } from '../src/domain/stats';
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

describe('v4 → v5 migration', () => {
  it('turns the single companion into the first and current one, keeping an active session', () => {
    const s = parseStored(JSON.stringify({
      schemaVersion: 4,
      companion: { id: 'c1', species: 'ripple', name: 'Pip', adoptedAt: 1 },
      history: [],
      active: { id: 'a', startedAt: 1, tasks: [], clock: { plannedMs: 60000, bankedMs: 0, runningSince: 5 }, checkpointMs: 0 },
    }));
    expect(s.companions.map((c) => c.id)).toEqual(['c1']);
    expect(s.currentId).toBe('c1');
    expect(s.active?.companionId).toBe('c1');
  });

  it('drops an active session whose companion no longer exists', () => {
    const s = parseStored(JSON.stringify({
      schemaVersion: 5, companions: [], currentId: null, history: [],
      active: { id: 'a', companionId: 'gone', startedAt: 1, tasks: [], clock: { plannedMs: 60000, bankedMs: 0 }, checkpointMs: 0 },
    }));
    expect(s.active).toBeNull();
  });
});

describe('several companions', () => {
  async function setup() {
    const storage = new MemStorage();
    let t = 1_000_000;
    let n = 0;
    const svc = new SessionService(new LocalRepository(storage), () => t, () => `id-${++n}`);
    await svc.init();
    return { svc, storage, tick: (ms: number) => (t += ms) };
  }

  it('adopts one companion per species and switches the current one', async () => {
    const { svc } = await setup();
    const leaf = await svc.adopt('bloomling', 'Fern');
    const fire = await svc.adopt('cinder', 'Toasty');
    expect(svc.companions).toHaveLength(2);
    expect(svc.companion?.id).toBe(fire.id); // newest adoption becomes current
    const again = await svc.adopt('bloomling', 'Dup');
    expect(again.id).toBe(leaf.id); // no duplicate species
    expect(svc.companions).toHaveLength(2);
    expect(svc.companion?.id).toBe(leaf.id);
  });

  it('grows only the companion who joined the session, and remembers them as current', async () => {
    const { svc, storage, tick } = await setup();
    const leaf = await svc.adopt('bloomling', 'Fern');
    const water = await svc.adopt('ripple', 'Pip');
    await svc.setCurrent(leaf.id);

    await svc.start(25, [], water.id);
    expect(svc.companion?.id).toBe(water.id);
    tick(26 * 60000);
    const rec = await svc.finish();
    expect(rec?.companionId).toBe(water.id);
    expect(totalMinutes(svc.historyFor(water.id))).toBe(25);
    expect(totalMinutes(svc.historyFor(leaf.id))).toBe(0);

    const reloaded = new SessionService(new LocalRepository(storage));
    await reloaded.init();
    expect(reloaded.companions).toHaveLength(2);
    expect(reloaded.companion?.id).toBe(water.id);
  });

  it('renames a specific companion', async () => {
    const { svc } = await setup();
    const leaf = await svc.adopt('bloomling', 'Fern');
    await svc.adopt('cinder', 'Toasty');
    await svc.rename('Clover', leaf.id);
    expect(svc.companionById(leaf.id)?.name).toBe('Clover');
    expect(svc.companion?.name).toBe('Toasty');
  });

  it('round-trips several companions through a backup', async () => {
    const { svc } = await setup();
    await svc.adopt('bloomling', 'Fern');
    await svc.adopt('ripple', 'Pip');
    const other = (await setup()).svc;
    expect(await other.importBackup(svc.exportBackup())).toBe(true);
    expect(other.companions.map((c) => c.name)).toEqual(['Fern', 'Pip']);
    expect(other.companion?.name).toBe('Pip');
  });
});

describe('Moss (unlockable)', () => {
  async function svcWith(minutes: number) {
    let t = new Date('2026-09-01T12:00:00').getTime();
    let n = 0;
    const svc = new SessionService(new LocalRepository(new MemStorage()), () => t, () => `id-${++n}`);
    await svc.init();
    const leaf = await svc.adopt('bloomling', 'Fern');
    // Focus in 2-hour sessions until the target is reached.
    for (let done = 0; done < minutes; done += 120) {
      await svc.start(Math.min(120, minutes - done), [], leaf.id);
      t += Math.min(120, minutes - done) * 60000 + 1000;
      await svc.finish();
    }
    return svc;
  }

  it('is locked before the Ten Hours medal and refuses adoption', async () => {
    const svc = await svcWith(540);
    expect(svc.canAdopt('moss')).toBe(false);
    await expect(svc.adopt('moss', 'Moss')).rejects.toThrow(/locked/);
    expect(svc.companions.some((c) => c.species === 'moss')).toBe(false);
  });

  it('unlocks at 10 hours and can then be adopted', async () => {
    const svc = await svcWith(600);
    expect(svc.canAdopt('moss')).toBe(true);
    const m = await svc.adopt('moss', 'Moss');
    expect(m.species).toBe('moss');
    expect(svc.companion?.id).toBe(m.id);
  });

  it('survives storage parsing as a valid species', () => {
    const s = parseStored(JSON.stringify({ schemaVersion: 5, companions: [{ id: 'm', species: 'moss', name: 'Moss', adoptedAt: 1 }], currentId: 'm', history: [], active: null }));
    expect(s.companions[0]?.species).toBe('moss');
  });
});
