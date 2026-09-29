import type { ClockState } from '../logic/timer';

/**
 * Domain types. These are the shapes a future backend API should speak, so keep them
 * serializable and free of UI concerns. Records are append-only and identified by UUID
 * so they can be merged across devices without conflicts.
 */
export type SpeciesId = 'bloomling' | 'cinder' | 'ripple' | 'moss';

export interface CompanionProfile {
  id: string;
  species: SpeciesId;
  name: string;
  adoptedAt: number; // epoch ms
}

/** One thing the user wants to get done in a session (up to MAX_TASKS). */
export interface FocusTask {
  text: string;
  done: boolean;
}

export const MAX_TASKS = 3;

export interface SessionRecord {
  id: string;
  companionId: string; // which companion this session grew (enables a future collection)
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  day: string; // YYYY-MM-DD in the user's local time at end
  plannedMs: number;
  focusedMs: number;
  countedMinutes: number; // minutes credited toward growth
  tasks: FocusTask[];
  completed: boolean; // ran the full planned duration
}

export interface ActiveSession {
  id: string;
  companionId: string; // who joined this session
  startedAt: number;
  tasks: FocusTask[];
  clock: ClockState;
  /** Focused ms saved periodically, so a reload or crash keeps earned time. */
  checkpointMs: number;
}

export interface BloomSnapshot {
  companions: CompanionProfile[];
  /** The companion shown on home and preselected for the next session. */
  currentId: string | null;
  history: SessionRecord[];
  active: ActiveSession | null;
}

export const emptySnapshot = (): BloomSnapshot => ({ companions: [], currentId: null, history: [], active: null });
