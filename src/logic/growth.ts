export const MIN_COUNTED_MINUTES = 5;

export interface Stage {
  index: number;
  threshold: number; // cumulative focus minutes needed to reach this stage
}

/**
 * Fast first reward (the first 25-minute session evolves), then widening gaps.
 * At ~1–2 sessions/day: stage 2 ≈ day 3–4, stage 3 ≈ week 2, stage 4 ≈ month 1, stage 5 ≈ month 2–3.
 * Species give each stage its own name (see companion/species.ts).
 */
export const STAGES: Stage[] = [
  { index: 0, threshold: 0 },
  { index: 1, threshold: 25 },
  { index: 2, threshold: 150 },
  { index: 3, threshold: 500 },
  { index: 4, threshold: 1200 },
  { index: 5, threshold: 2500 },
];

/** Minutes still needed to reach the next stage, or null at the final stage. */
export function minutesToNext(totalMinutes: number): number | null {
  const next = STAGES[stageFor(totalMinutes).index + 1];
  return next ? next.threshold - totalMinutes : null;
}

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
