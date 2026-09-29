import type { SpeciesId } from '../domain/types';
import type { IconName } from '../icons';

export interface Species {
  id: SpeciesId;
  name: string;
  element: string;
  icon: IconName;
  blurb: string;
  /** One name per growth stage (see logic/growth.ts STAGES). */
  stageNames: [string, string, string, string, string, string];
  /** Unlockable species need this medal before they can be adopted. Starters have none. */
  unlockMedal?: string;
}

/** Every species. Starters are free; unlockables name the medal that unlocks them. Add new species here. */
export const SPECIES: Record<SpeciesId, Species> = {
  bloomling: {
    id: 'bloomling',
    name: 'Bloomling',
    element: 'Leaf',
    icon: 'leaf',
    blurb: 'Gentle and steady. Grows a flower crown from calm, patient focus.',
    stageNames: ['Seed', 'Sprout', 'Leafling', 'Budling', 'Bloom', 'Elder Bloom'],
  },
  cinder: {
    id: 'cinder',
    name: 'Cinder',
    element: 'Ember',
    icon: 'flame',
    blurb: 'Warm and spirited. Its little flame grows brighter the longer you stay with it.',
    stageNames: ['Spark', 'Kindling', 'Flicker', 'Blaze', 'Sunflare', 'Elder Flame'],
  },
  ripple: {
    id: 'ripple',
    name: 'Ripple',
    element: 'Tide',
    icon: 'drop',
    blurb: 'Curious and calm. A water lily unfolds as your focus runs deep.',
    stageNames: ['Droplet', 'Puddle', 'Brooklet', 'Lilybud', 'Lily', 'Elder Tide'],
  },
  moss: {
    id: 'moss',
    name: 'Moss',
    element: 'Earth',
    icon: 'mushroom',
    blurb: 'Patient and cozy. A mossy little garden grows on its cap, one quiet hour at a time.',
    stageNames: ['Spore', 'Button', 'Capling', 'Mossling', 'Toadstool', 'Elder Grove'],
    unlockMedal: 'hours-10',
  },
  nimbus: {
    id: 'nimbus',
    name: 'Nimbus',
    element: 'Sky',
    icon: 'cloud',
    blurb: 'Light and dreamy. Shows up every day, and one day brings a rainbow.',
    stageNames: ['Wisp', 'Puff', 'Cumulus', 'Drizzle', 'Rainbow', 'Elder Sky'],
    unlockMedal: 'streak-7',
  },
};

/** Free starters, offered in onboarding. */
export const STARTERS: SpeciesId[] = ['bloomling', 'cinder', 'ripple'];
/** Display order everywhere else (garden, picker). */
export const SPECIES_ORDER: SpeciesId[] = [...STARTERS, 'moss', 'nimbus'];

/** Whether a species can be adopted given the medals earned so far. */
export function isUnlocked(species: SpeciesId, earnedMedalIds: ReadonlySet<string>): boolean {
  const medal = SPECIES[species].unlockMedal;
  return !medal || earnedMedalIds.has(medal);
}

export function stageName(species: SpeciesId, stage: number): string {
  const names = SPECIES[species].stageNames;
  return names[Math.max(0, Math.min(names.length - 1, stage))];
}
