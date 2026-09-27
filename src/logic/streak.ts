import { addDays, dayKey } from './dates';

/** Grace days must be at least this many days apart (one per week). */
const GRACE_SPACING = 7;

/**
 * Consecutive days with a qualifying session, walking back from today.
 * Today not having a session yet doesn't break the streak.
 * A single missed day is forgiven if no other grace day was used in the prior week.
 */
export function computeStreak(activeDays: Set<string>, today: Date): number {
  let cursor = activeDays.has(dayKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  let lastGraceOffset = -Infinity; // how many days back the last grace was used
  let offset = 0;

  while (true) {
    if (activeDays.has(dayKey(cursor))) {
      streak++;
    } else {
      const prevActive = activeDays.has(dayKey(addDays(cursor, -1)));
      const graceAvailable = offset - lastGraceOffset >= GRACE_SPACING;
      if (!(streak > 0 && prevActive && graceAvailable)) break;
      lastGraceOffset = offset;
    }
    cursor = addDays(cursor, -1);
    offset++;
  }
  return streak;
}
