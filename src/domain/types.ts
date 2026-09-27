import type { ClockState } from '../logic/timer';

/**
 * Domain types. These are the shapes a future backend API should speak, so keep them
 * serializable and free of UI concerns. Records are append-only and identified by UUID
 * so they can be merged across devices without conflicts.
 */
export interface SessionRecord {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  day: string; // YYYY-MM-DD in the user's local time at end
  plannedMs: number;
  focusedMs: number;
  countedMinutes: number; // minutes credited toward growth
  label: string;
  completed: boolean; // ran the full planned duration
}

export interface ActiveSession {
  id: string;
  startedAt: number;
  label: string;
  clock: ClockState;
}

export interface BloomSnapshot {
  history: SessionRecord[];
  active: ActiveSession | null;
}
