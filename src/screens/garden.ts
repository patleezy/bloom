import { renderCompanion } from '../companion/render';
import { SPECIES, SPECIES_ORDER, stageName } from '../companion/species';
import { copy } from '../copy';
import { h } from '../dom';
import type { CompanionProfile, SpeciesId } from '../domain/types';
import { icon } from '../icons';

export interface GardenEntry {
  species: SpeciesId;
  companion: CompanionProfile | null; // null = starter not adopted yet
  stage: number;
  minutes: number;
  isCurrent: boolean;
  /** Set while an unlockable species hasn't been earned yet. */
  locked: { requirement: string; progress: string; current: number; target: number } | null;
}

/**
 * All companions in one place: who's on home, how far each has grown, and the starters you
 * haven't met yet (free to adopt). Unlockable friends are previewed on the Medals screen.
 */
export function gardenScreen(
  entries: GardenEntry[],
  opts: {
    onBack: () => void;
    onSetHome: (id: string) => void;
    onJourney: (id: string) => void;
    onAdopt: (species: SpeciesId) => void;
    onMedals: () => void;
  },
): HTMLElement {
  const ordered = SPECIES_ORDER.map((sp) => entries.find((e) => e.species === sp)!).filter(Boolean);

  const cards = ordered.map((e) => {
    const sp = SPECIES[e.species];
    const art = renderCompanion(e.species, e.stage, { label: '' });
    art.removeAttribute('role');
    art.setAttribute('aria-hidden', 'true');

    if (e.locked) {
      art.classList.add('silhouette');
      const pct = Math.round((e.locked.current / e.locked.target) * 100);
      const fill = h('div', { class: 'progress-fill' });
      fill.style.width = `${pct}%`;
      return h('li', { class: `garden-card locked species-${e.species}` },
        h('div', { class: 'garden-art' }, art),
        h('div', { class: 'garden-text' },
          h('strong', {}, sp.name),
          h('span', { class: `element-tag species-${e.species}` }, icon('lock'), sp.element),
          h('span', { class: 'muted small' }, copy.gardenLocked(e.locked.requirement)),
          h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100',
            'aria-valuenow': String(pct), 'aria-label': `${sp.name}: ${e.locked.requirement}` }, fill),
          h('span', { class: 'small' }, e.locked.progress)));
    }

    if (!e.companion) {
      return h('li', { class: `garden-card new species-${e.species}` },
        h('div', { class: 'garden-art' }, art),
        h('div', { class: 'garden-text' },
          h('strong', {}, sp.name),
          h('span', { class: `element-tag species-${e.species}` }, icon(sp.icon), sp.element),
          h('span', { class: 'muted small' }, copy.gardenNotMet),
          h('button', { class: 'btn primary', type: 'button', onclick: () => opts.onAdopt(e.species) }, copy.gardenAdopt(sp.name))));
    }

    const c = e.companion;
    return h('li', { class: `garden-card species-${e.species}${e.isCurrent ? ' current' : ''}` },
      h('div', { class: 'garden-art' }, art),
      h('div', { class: 'garden-text' },
        h('strong', {}, c.name),
        h('span', { class: `element-tag species-${e.species}` }, icon(sp.icon), stageName(e.species, e.stage)),
        h('span', { class: 'muted small' }, copy.gardenMinutes(e.minutes)),
        h('div', { class: 'row wrap garden-actions' },
          e.isCurrent
            ? h('span', { class: 'evo-here' }, copy.gardenOnHome)
            : h('button', { class: 'btn ghost small-btn', type: 'button', onclick: () => opts.onSetHome(c.id) }, copy.gardenSetHome),
          h('button', { class: 'btn ghost small-btn', type: 'button', onclick: () => opts.onJourney(c.id) }, copy.gardenJourney))));
  });

  return h('main', { class: 'screen settings garden' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn link back', onclick: opts.onBack }, icon('back'), copy.back),
      h('h2', {}, copy.gardenTitle),
      h('span', { class: 'spacer' })),
    h('p', { class: 'muted small' }, copy.gardenIntro),
    h('ul', { class: 'garden-list' }, ...cards),
    h('p', { class: 'muted small garden-foot' }, copy.gardenUnlocks, ' ',
      h('button', { class: 'btn link', type: 'button', onclick: opts.onMedals }, copy.gardenSeeMedals)));
}
