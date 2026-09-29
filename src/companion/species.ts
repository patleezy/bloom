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
}

/** The three starters: distinct elements, same growth rules. Add new species here. */
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
};

export const SPECIES_ORDER: SpeciesId[] = ['bloomling', 'cinder', 'ripple'];

export function stageName(species: SpeciesId, stage: number): string {
  const names = SPECIES[species].stageNames;
  return names[Math.max(0, Math.min(names.length - 1, stage))];
}
