import { STAGES, stageFor } from '../logic/growth';

export type StageState = 'reached' | 'current' | 'next' | 'locked';

export interface EvolutionStep {
  index: number;
  threshold: number;
  state: StageState;
  /** Minutes still needed (0 once reached). */
  minutesLeft: number;
}

/**
 * The full evolution path for a companion with `totalMinutes` of growth.
 * Future stages are shown as silhouettes; only the next one reveals its name.
 */
export function evolutionPath(totalMinutes: number): EvolutionStep[] {
  const cur = stageFor(totalMinutes).index;
  return STAGES.map((s) => ({
    index: s.index,
    threshold: s.threshold,
    state: s.index < cur ? 'reached' : s.index === cur ? 'current' : s.index === cur + 1 ? 'next' : 'locked',
    minutesLeft: Math.max(0, s.threshold - totalMinutes),
  }));
}
