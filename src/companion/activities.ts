import type { SpeciesId } from '../domain/types';

/**
 * Small things the companion does on its own, like a friend working beside you.
 * One activity at a time, with calm gaps in between. Each is a CSS class (.act-*)
 * on the companion svg; styles.css animates it and reveals any prop it uses.
 */
interface Activity {
  name: string;
  ms: number;
}

const SHARED: Activity[] = [
  { name: 'read', ms: 12000 },
  { name: 'hum', ms: 6000 },
  { name: 'look', ms: 5000 },
  { name: 'stretch', ms: 5000 },
];

const OWN: Record<SpeciesId, Activity[]> = {
  bloomling: [{ name: 'water', ms: 6000 }, { name: 'butterfly', ms: 8000 }],
  cinder: [{ name: 'sparks', ms: 5000 }, { name: 'wiggle', ms: 4000 }],
  ripple: [{ name: 'bubbles', ms: 6000 }, { name: 'swim', ms: 6000 }],
  moss: [{ name: 'spores', ms: 6000 }, { name: 'tip', ms: 4000 }],
  nimbus: [{ name: 'drizzle', ms: 6000 }, { name: 'puff', ms: 3000 }],
};

export const activitiesFor = (species: SpeciesId): Activity[] => [...SHARED, ...OWN[species]];

export interface ActivityOptions {
  /** Pause between activities, in ms. */
  gap: [min: number, max: number];
  /** When true, activities are skipped (e.g. the companion is napping). */
  isResting?: () => boolean;
  random?: () => number;
}

export interface ActivityController {
  /** Stop the current activity right away (e.g. on pause). */
  interrupt(): void;
  dispose(): void;
}

export function startActivities(svg: SVGSVGElement, species: SpeciesId, opts: ActivityOptions): ActivityController {
  const noop = { interrupt() {}, dispose() {} };
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;
  } catch {
    /* matchMedia unavailable: continue */
  }
  const rand = opts.random ?? Math.random;
  const list = activitiesFor(species);
  let timer = 0;
  let current: string | null = null;
  let last: string | null = null;

  const clear = () => {
    if (current) svg.classList.remove('act', `act-${current}`);
    current = null;
  };

  const schedule = (delay: number) => {
    timer = window.setTimeout(run, delay);
  };

  const run = () => {
    if (opts.isResting?.() || document.hidden) return schedule(3000);
    const choices = list.filter((a) => a.name !== last);
    const pick = choices[Math.floor(rand() * choices.length)];
    current = last = pick.name;
    svg.classList.add('act', `act-${pick.name}`);
    timer = window.setTimeout(() => {
      clear();
      const [min, max] = opts.gap;
      schedule(min + rand() * (max - min));
    }, pick.ms);
  };

  schedule(opts.gap[0] / 2);
  return {
    interrupt: clear,
    dispose: () => {
      window.clearTimeout(timer);
      clear();
    },
  };
}
