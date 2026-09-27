/**
 * Timestamp-based session clock. Stores when it last started running plus time already banked,
 * so it stays accurate even if the browser throttles timers.
 */
export interface ClockState {
  plannedMs: number;
  bankedMs: number;
  runningSince: number | null;
}

export function newClock(plannedMs: number, now: number): ClockState {
  return { plannedMs, bankedMs: 0, runningSince: now };
}

export function elapsed(c: ClockState, now: number): number {
  const live = c.runningSince === null ? 0 : Math.max(0, now - c.runningSince);
  return Math.min(c.plannedMs, c.bankedMs + live);
}

export function pause(c: ClockState, now: number): ClockState {
  if (c.runningSince === null) return c;
  return { ...c, bankedMs: elapsed(c, now), runningSince: null };
}

export function resume(c: ClockState, now: number): ClockState {
  if (c.runningSince !== null) return c;
  return { ...c, runningSince: now };
}

export function remaining(c: ClockState, now: number): number {
  return c.plannedMs - elapsed(c, now);
}

export function isDone(c: ClockState, now: number): boolean {
  return remaining(c, now) <= 0;
}
