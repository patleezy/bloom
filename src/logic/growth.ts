export const MIN_COUNTED_MINUTES = 5;

export interface Stage {
  index: number;
  name: string;
  threshold: number; // cumulative focus minutes needed to reach this stage
}

export const STAGES: Stage[] = [
  { index: 0, name: 'Seed', threshold: 0 },
  { index: 1, name: 'Sprout', threshold: 60 },
  { index: 2, name: 'Leafling', threshold: 300 },
  { index: 3, name: 'Bud', threshold: 900 },
  { index: 4, name: 'Bloom', threshold: 2000 },
  { index: 5, name: 'Elder Bloom', threshold: 4000 },
];

export function stageFor(totalMinutes: number): Stage {
  let current = STAGES[0];
  for (const s of STAGES) if (totalMinutes >= s.threshold) current = s;
  return current;
}

/** Progress (0–1) from the current stage toward the next. 1 at the final stage. */
export function progressToNext(totalMinutes: number): number {
  const cur = stageFor(totalMinutes);
  const next = STAGES[cur.index + 1];
  if (!next) return 1;
  return (totalMinutes - cur.threshold) / (next.threshold - cur.threshold);
}

/** Whole minutes a session contributes to growth. Short sessions contribute nothing. */
export function countedMinutes(focusedMs: number): number {
  const mins = Math.floor(focusedMs / 60000);
  return mins >= MIN_COUNTED_MINUTES ? mins : 0;
}
