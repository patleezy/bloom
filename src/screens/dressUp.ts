import { keepsakeArt } from '../companion/keepsakeArt';
import { renderCompanion } from '../companion/render';
import { copy } from '../copy';
import { h } from '../dom';
import { ITEMS } from '../domain/keepsakes';
import type { CompanionProfile } from '../domain/types';
import { icon } from '../icons';

/**
 * Dress up: pick what a companion wears from the keepsakes you own. Each companion has its
 * own outfit. Changes save right away; the preview redraws.
 */
export function dressUpScreen(
  companions: readonly CompanionProfile[],
  selected: CompanionProfile,
  stageOf: (c: CompanionProfile) => number,
  owned: ReadonlySet<string>,
  opts: { onBack: () => void; onPick: (companionId: string) => void; onWear: (itemId: string | null) => void; onKeepsakes: () => void },
): HTMLElement {
  const wearables = ITEMS.filter((i) => i.kind === 'wear' && owned.has(i.id));
  const current = selected.outfit.wear;

  const who = companions.length > 1
    ? h('div', { class: 'chips dress-who three', role: 'radiogroup', 'aria-label': copy.dressWho },
        ...companions.map((c) => h('button', {
          class: 'chip', type: 'button', role: 'radio',
          'aria-checked': String(c.id === selected.id), onclick: () => opts.onPick(c.id),
        }, c.name)))
    : null;

  const option = (itemId: string | null, label: string, art: Element) => h('button', {
    class: `dress-option${itemId === current ? ' on' : ''}`, type: 'button', role: 'radio',
    'aria-checked': String(itemId === current), onclick: () => opts.onWear(itemId),
  }, art, h('span', { class: 'small' }, label));

  const wearList = wearables.length
    ? h('div', { class: 'dress-grid', role: 'radiogroup', 'aria-label': copy.kind.wear },
        option(null, copy.dressNone, icon('close', 'dress-none')),
        ...wearables.map((i) => option(i.id, i.name, keepsakeArt(i.id))))
    : h('div', { class: 'card dress-empty' },
        h('p', { class: 'muted' }, copy.dressEmpty),
        h('button', { class: 'btn ghost', type: 'button', onclick: opts.onKeepsakes }, copy.keepsakesOpen));

  const wearing = current ? ITEMS.find((i) => i.id === current)?.name : null;
  return h('main', { class: 'screen settings dress-up' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn link back', onclick: opts.onBack }, icon('back'), copy.back),
      h('h2', {}, copy.dressTitle),
      h('span', { class: 'spacer' })),
    who,
    h('div', { class: 'dress-preview' },
      renderCompanion(selected.species, stageOf(selected), {
        label: wearing ? copy.dressWearing(selected.name, wearing) : selected.name, wear: current,
      })),
    h('section', { class: 'dress-section' }, h('h3', {}, copy.kind.wear), wearList),
    h('p', { class: 'muted small' }, copy.dressSoon));
}
