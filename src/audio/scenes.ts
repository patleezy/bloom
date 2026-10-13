import type { SpeciesId } from '../domain/types';

/**
 * Scenes: a sound plus a matching background for the session screen.
 * The first scene is the companion's signature; the rest are shared.
 * Recordings live in public/sounds (Pixabay, free to use; processed to seamless mono loops).
 */
export type SceneId = 'signature' | 'rain' | 'night' | 'ocean' | 'snow' | 'silence';

export interface Scene {
  id: SceneId;
  /** Recording to loop, or null for the synthesized signature / silence. */
  file: string | null;
  name: string;
}

/** Signature scenes that use a recording instead of the synthesized sound. */
const SIGNATURE: Record<SpeciesId, { name: string; file: string | null }> = {
  bloomling: { name: 'Forest morning', file: 'forest' },
  cinder: { name: 'Fireside', file: 'fire' },
  ripple: { name: 'Brookside', file: 'stream' },
  moss: { name: 'Rainy woods', file: null },
  nimbus: { name: 'High breeze', file: null },
  lumi: { name: 'Summer night', file: null },
};

export const SCENE_ORDER: SceneId[] = ['signature', 'rain', 'night', 'ocean', 'snow', 'silence'];

export function sceneFor(id: SceneId, species: SpeciesId): Scene {
  switch (id) {
    case 'signature': return { id, ...SIGNATURE[species] };
    case 'rain': return { id, name: 'Rain', file: 'rain' };
    case 'night': return { id, name: 'Night sky', file: 'night' };
    case 'ocean': return { id, name: 'Ocean', file: 'ocean' };
    case 'snow': return { id, name: 'Snowfall', file: 'snow' };
    case 'silence': return { id, name: 'Silence', file: null };
  }
}

export function nextScene(id: SceneId, step: 1 | -1): SceneId {
  const i = SCENE_ORDER.indexOf(id);
  return SCENE_ORDER[(i + step + SCENE_ORDER.length) % SCENE_ORDER.length];
}

export const isSceneId = (v: unknown): v is SceneId => SCENE_ORDER.includes(v as SceneId);
