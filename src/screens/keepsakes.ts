import { giftArt, keepsakeArt } from '../companion/keepsakeArt';
import { copy } from '../copy';
import { h } from '../dom';
import { ITEMS, PICK_COST, RARITIES, type KeepsakeItem, type KeepsakeState, type OpenedGift } from '../domain/keepsakes';
import { icon } from '../icons';

const rarityChip = (item: KeepsakeItem) => h('span', { class: `rarity-chip rarity-${item.rarity}` }, copy.rarity[item.rarity]);

/** What came out of a gift: the item, its rarity, and whether it was new or became Sparkles. */
function reveal(opened: OpenedGift): HTMLElement {
  const { item } = opened;
  return h('div', { class: 'gift-reveal' },
    keepsakeArt(item.id),
    rarityChip(item),
    h('strong', { class: 'gift-item-name' }, item.name),
    h('span', { class: 'muted small' }, opened.sparkles ? copy.giftDuplicate(opened.sparkles) : copy.giftNew));
}

/** A wrapped gift that opens in place. Used on the end screen and in Keepsakes. */
export function giftCard(opts: { title: string; body?: string; open: () => Promise<OpenedGift | null>; after?: HTMLElement | null }): HTMLElement {
  const live = h('div', { class: 'gift-live', 'aria-live': 'polite' });
  const btn = h('button', { class: 'btn primary', type: 'button' }, icon('gift'), ' ', copy.giftOpen);
  const card = h('section', { class: 'card gift-card', 'aria-label': opts.title },
    giftArt(), h('h3', {}, opts.title), opts.body ? h('p', { class: 'muted small' }, opts.body) : null, btn, live);
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const opened = await opts.open();
    if (!opened) return;
    card.classList.add('opened');
    card.replaceChildren(live);
    live.append(reveal(opened));
    if (opts.after) card.append(opts.after);
    // The button is gone, so keep keyboard focus on what was revealed.
    const name = live.querySelector<HTMLElement>('.gift-item-name');
    name?.setAttribute('tabindex', '-1');
    name?.focus({ preventScroll: true });
  }, { once: true });
  return card;
}

export function keepsakesScreen(state: KeepsakeState, opts: {
  onBack: () => void;
  openGift: (sessionId: string) => Promise<OpenedGift | null>;
  pick: (itemId: string) => Promise<boolean>;
  refresh: () => void;
}): HTMLElement {
  const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { dateStyle: 'medium' });
  // One gift at a time (newest first), so a pile of gifts doesn't become a long scroll.
  const next = state.unopened[state.unopened.length - 1];
  const waiting = next
    ? h('section', { class: 'gifts-waiting' },
        h('h3', {}, copy.giftsWaiting(state.unopened.length)),
        giftCard({
          title: copy.giftTitle, body: copy.giftFrom(fmtDate(next.endedAt)), open: () => opts.openGift(next.sessionId),
          after: h('button', { class: 'btn ghost', type: 'button', onclick: opts.refresh },
            state.unopened.length > 1 ? copy.giftNext : copy.giftDone),
        }))
    : null;

  const sections = RARITIES.map((rarity) => {
    const items = ITEMS.filter((i) => i.rarity === rarity);
    return h('section', { class: 'keepsake-section' },
      h('h3', {}, h('span', { class: `rarity-chip rarity-${rarity}` }, copy.rarity[rarity])),
      h('ul', { class: 'keepsake-grid' }, ...items.map((item) => {
        const have = state.owned.has(item.id);
        const cost = PICK_COST[item.rarity];
        const pick = have ? null : h('button', {
          class: 'btn small-btn pick', type: 'button', disabled: state.sparkles < cost,
          'aria-label': copy.pickLabel(item.name, cost),
          onclick: async () => {
            if (!confirm(copy.pickConfirm(item.name, cost))) return;
            if (await opts.pick(item.id)) opts.refresh();
          },
        }, icon('sparkle'), copy.pickFor(cost));
        return h('li', { class: `keepsake-card ${have ? 'have' : 'missing'}` },
          keepsakeArt(item.id, { locked: !have }),
          h('strong', {}, have ? item.name : copy.notFound),
          h('span', { class: 'muted small' }, have ? copy.kind[item.kind] : item.name),
          pick);
      })));
  });

  return h('main', { class: 'screen settings keepsakes' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn link back', onclick: opts.onBack }, icon('back'), copy.back),
      h('h2', {}, copy.keepsakesTitle),
      h('span', { class: 'spacer' })),
    h('p', { class: 'muted' }, copy.keepsakesSummary(state.owned.size, ITEMS.length)),
    h('div', { class: 'card sparkles-card' },
      h('p', { class: 'sparkles-balance' }, icon('sparkle'), h('strong', {}, copy.sparkles(state.sparkles))),
      h('p', { class: 'muted small' }, copy.sparklesHelp)),
    waiting,
    ...sections,
    h('p', { class: 'muted small' }, copy.keepsakesIntro),
    h('p', { class: 'muted small' }, copy.keepsakesSoon));
}
