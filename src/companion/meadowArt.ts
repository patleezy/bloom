import type { Decor } from '../domain/keepsakes';
import type { Meadow, Plant, PlantKind } from '../domain/meadow';
import type { SpeciesId } from '../domain/types';
import { keepsakeMarkup } from './keepsakeArt';
import { renderCompanion } from './render';

/**
 * Meadow art: three rolling hills with the plants your sessions grew. Like the companion
 * art, all markup is built from static templates and numbers; no user data enters it.
 * Colors come from the --mdw-* tokens in styles.css.
 */
const W = 360;
const H = 300;
const r1 = (n: number) => Math.round(n * 10) / 10;

// Hill tops as gentle waves, so plants can be placed exactly on the ground.
const wave = (base: number, amp: number, cycles: number, phase: number) => (x: number) =>
  base + amp * Math.sin((x / W) * Math.PI * 2 * cycles + phase);
const farTop = wave(152, 11, 1.1, 0.6);
const midTop = wave(192, 8, 0.9, 2.4);
const frontTop = wave(232, 5, 0.7, 4.2);

const hill = (top: (x: number) => number, cls: string) => {
  const pts = Array.from({ length: W / 12 + 1 }, (_, i) => `L${i * 12} ${r1(top(i * 12))}`).join(' ');
  return `<path class="${cls}" d="M0 ${H} ${pts} L${W} ${H} Z"/>`;
};

/** Where a plant's base sits, and how big it is drawn, for a 0–1 position and depth. */
function place(xFrac: number, depth: number): { x: number; y: number; scale: number } {
  const x = 14 + xFrac * (W - 28);
  const far = farTop(x), mid = midTop(x), front = frontTop(x);
  const y = depth <= 0.33
    ? far + 4 + (depth / 0.33) * (mid - far - 6)
    : depth <= 0.6
    ? mid + 4 + ((depth - 0.33) / 0.27) * (front - mid - 6)
    : front + 5 + ((depth - 0.6) / 0.4) * (H - 14 - front);
  return { x: r1(x), y: r1(y), scale: r1(0.7 + depth * 0.55) };
}

// Plants are drawn with their base at (0, 0), growing upward.
const SHAPES: Record<PlantKind, (tint: number) => string> = {
  flower: (t) => `
    <path class="mdw-stem" d="M0 0 Q 1.5 -9 0 -17"/>
    <path class="mdw-leaf" d="M0 -5 C 4 -9, 9 -8, 10 -5 C 7 -3, 3 -3, 0 -5 Z"/>
    <path class="mdw-leaf" d="M0 -8 C -4 -12, -8 -11, -9 -8 C -6 -6, -3 -6, 0 -8 Z"/>
    ${[0, 72, 144, 216, 288].map((a) =>
      `<ellipse class="mdw-petal t${t}" cx="0" cy="-23" rx="3" ry="4.4" transform="rotate(${a} 0 -18.5)"/>`).join('')}
    <circle class="mdw-heart" cx="0" cy="-18.5" r="2.6"/>`,
  bush: (t) => `
    <ellipse class="mdw-shade" cx="0" cy="0" rx="17" ry="3"/>
    <circle class="mdw-bush" cx="-9" cy="-8" r="9"/>
    <circle class="mdw-bush" cx="9" cy="-7" r="8"/>
    <circle class="mdw-bush lit" cx="0" cy="-13" r="11"/>
    <circle class="mdw-petal t${t}" cx="-8" cy="-11" r="2"/>
    <circle class="mdw-petal t${t}" cx="4" cy="-18" r="2"/>
    <circle class="mdw-petal t${t}" cx="10" cy="-9" r="2"/>
    <circle class="mdw-petal t${t}" cx="-1" cy="-7" r="1.7"/>`,
  tree: (t) => `
    <ellipse class="mdw-shade" cx="0" cy="0" rx="15" ry="3"/>
    <path class="mdw-trunk" d="M-3 0 C -2 -8, -2.5 -16, -2 -26 H 2 C 2.5 -16, 2 -8, 3 0 Z"/>
    ${t % 2
      ? `<ellipse class="mdw-canopy" cx="0" cy="-38" rx="15" ry="19"/>
         <ellipse class="mdw-canopy lit" cx="-3" cy="-43" rx="9" ry="11"/>`
      : `<circle class="mdw-canopy" cx="-10" cy="-30" r="11"/>
         <circle class="mdw-canopy" cx="10" cy="-31" r="11"/>
         <circle class="mdw-canopy lit" cx="0" cy="-40" r="14"/>`}
    <circle class="mdw-petal t${t}" cx="-6" cy="-36" r="1.8"/>
    <circle class="mdw-petal t${t}" cx="7" cy="-42" r="1.8"/>
    <circle class="mdw-petal t${t}" cx="3" cy="-30" r="1.6"/>`,
};

function plantMarkup(p: Plant): string {
  const { x, y, scale } = place(p.x, p.depth);
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="mdw-plant mdw-${p.kind}${p.recent ? ' recent' : ''}">${SHAPES[p.kind](p.tint)}</g></g>`;
}

const svgEl = (viewBox: string, cls: string, markup: string): SVGSVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = markup; // static trusted template only
  return svg;
};

/** One plant on its own, for the end screen. */
export function plantIcon(kind: PlantKind, tint = 0): SVGSVGElement {
  const box = { flower: '-13 -29 26 31', bush: '-20 -27 40 31', tree: '-24 -58 48 62' }[kind];
  return svgEl(box, `plant-icon mdw-plant mdw-${kind}`, SHAPES[kind](tint));
}

// ---------- keepsakes in the meadow ----------

/**
 * Where each little friend lives and how it moves (a CSS class, see .fr-* in styles.css).
 * Ground friends give a position and depth; flyers give a point in the sky.
 */
const FRIEND_SPOTS: Record<string, { at: readonly [number, number]; fly?: true; move: string }> = {
  snail: { at: [0.33, 0.93], move: 'creep' },
  ladybug: { at: [0.71, 0.97], move: 'amble' },
  pebble: { at: [0.23, 0.8], move: 'still' },
  frog: { at: [0.63, 0.5], move: 'hop' },
  bumblebee: { at: [112, 158], fly: true, move: 'buzz' },
  butterfly: { at: [238, 132], fly: true, move: 'flutter' },
  songbird: { at: [0.5, 0.06], move: 'bob' },
};

function friendMarkup(id: string): string {
  const spot = FRIEND_SPOTS[id];
  if (!spot) return '';
  // Keepsake drawings are 48×48 with their feet near y=40.
  const g = spot.fly ? { x: spot.at[0], y: spot.at[1], scale: 0.4 } : place(spot.at[0], spot.at[1]);
  const s = r1(spot.fly ? 0.4 : g.scale * 0.36);
  return `<g transform="translate(${r1(g.x - 24 * s)} ${r1(g.y - 40 * s)}) scale(${s})"><g class="mdw-critter fr-${spot.move}">${keepsakeMarkup(id)}</g></g>`;
}

/** Deterministic scatter for the wildflower backdrop. */
const WILDFLOWERS = Array.from({ length: 34 }, (_, i) => {
  const { x, y } = place(((i * 37) % 100) / 100, 0.04 + ((i * 53) % 90) / 100);
  return `<circle class="mdw-petal t${i % 4}" cx="${x}" cy="${r1(y - 2)}" r="${i % 3 ? 1.6 : 2.1}"/>`;
}).join('');

/** Backdrops: `behind` is painted before the hills, `ground` on them (under the plants), `front` last. */
const BACKDROPS: Record<string, { behind?: string; ground?: string; front?: string }> = {
  meadow: { ground: WILDFLOWERS },
  picnic: { ground: `
    <path d="M34 266 72 246 132 252 98 274Z" fill="#fbe3e0"/>
    <path d="M47 259 109 265M60 252 121 258M53 256 85 272M72 246 110 270M91 248 123 262" stroke="#ec9c95" stroke-width="2.4" fill="none" opacity=".8"/>
    <path d="M96 246h20l-3 12H99Z" fill="#d6ad7c"/><path d="M98 246c1-9 15-9 16 0" fill="none" stroke="#b98a5e" stroke-width="2"/>` },
  pond: { ground: `
    <ellipse cx="276" cy="216" rx="50" ry="11" fill="#a9d6e6"/>
    <ellipse cx="270" cy="214" rx="34" ry="6" fill="#c9e7f1"/>
    <ellipse cx="252" cy="218" rx="8" ry="2.6" fill="#7fb874"/><ellipse cx="296" cy="213" rx="7" ry="2.3" fill="#7fb874"/>
    <circle cx="296" cy="211.5" r="2.2" fill="#f6c6d6"/>` },
  'sunset-hill': {},
  blossom: { front: `
    <path d="M0 22C40 26 76 40 118 34" fill="none" stroke="#8f6844" stroke-width="5" stroke-linecap="round"/>
    <path d="M52 30C60 44 74 52 88 54" fill="none" stroke="#8f6844" stroke-width="3" stroke-linecap="round"/>
    ${[[14, 20, 9], [36, 28, 10], [60, 30, 8], [84, 38, 10], [110, 34, 8], [70, 48, 8], [90, 56, 7]].map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6c3d2"/><circle cx="${x - 2}" cy="${y - 2}" r="${r * 0.55}" fill="#fbdde6"/>`).join('')}
    ${[[60, 0], [130, 4], [200, 1], [270, 6], [320, 2]].map(([x, d], i) =>
      `<ellipse class="mdw-fall d${d}" cx="${x}" cy="${70 + i * 9}" rx="2.6" ry="1.6" fill="#f6c3d2"/>`).join('')}` },
  rainbow: { behind: ['#f2a99a', '#f5cd72', '#b6dba3', '#a9d6e6', '#c5b0e8'].map((c, i) =>
    `<circle cx="180" cy="214" r="${150 - i * 9}" fill="none" stroke="${c}" stroke-width="9" opacity=".75"/>`).join('') },
};

/** Exposed for tests: every friend and backdrop in the catalog must show up in the meadow. */
export const hasMeadowArt = (itemId: string) => itemId in FRIEND_SPOTS || itemId in BACKDROPS;

export interface MeadowFriend {
  species: SpeciesId;
  stage: number;
}

/** Spots for companions standing behind the one on home: [left %, bottom %, width %]. */
const BEHIND: readonly (readonly [number, number, number])[] = [
  [2, 12, 25], [73, 14, 25], [15, 27, 19], [66, 28, 19], [84, 32, 15],
];

/**
 * The meadow with companions standing in it. `home` leaves the middle of the foreground
 * free (the home screen puts the pettable companion there); `garden` lines everyone up.
 */
export function meadowScene(
  m: Meadow,
  friends: readonly MeadowFriend[],
  layout: 'home' | 'garden',
  decor: Decor = { friends: [], backdrop: null },
): HTMLElement {
  const bd = decor.backdrop ? BACKDROPS[decor.backdrop] : undefined;
  const el = document.createElement('div');
  el.className = `meadow meadow-${layout}${bd ? ` bd-${decor.backdrop}` : ''}`;
  el.append(svgEl(`0 0 ${W} ${H}`, 'meadow-svg', `
    <circle class="mdw-sun" cx="286" cy="62" r="26"/>
    <g class="mdw-cloud drift-a"><ellipse cx="78" cy="58" rx="30" ry="11"/><ellipse cx="98" cy="50" rx="18" ry="11"/></g>
    <g class="mdw-cloud drift-b"><ellipse cx="212" cy="96" rx="22" ry="8"/><ellipse cx="226" cy="90" rx="13" ry="8"/></g>
    <g class="mdw-decor">${bd?.behind ?? ''}</g>
    ${hill(farTop, 'mdw-hill-far')}${hill(midTop, 'mdw-hill-mid')}${hill(frontTop, 'mdw-ground')}
    <g class="mdw-decor">${bd?.ground ?? ''}</g>
    ${m.plants.map(plantMarkup).join('')}
    <g class="mdw-decor">${decor.friends.map(friendMarkup).join('')}${bd?.front ?? ''}</g>`));

  const n = friends.length;
  friends.slice(0, layout === 'home' ? BEHIND.length : n).forEach((f, i) => {
    const art = renderCompanion(f.species, f.stage, { label: '' });
    art.removeAttribute('role');
    art.setAttribute('aria-hidden', 'true');
    art.classList.add('meadow-friend');
    const width = layout === 'home' ? BEHIND[i][2] : Math.min(30, 94 / n);
    const left = layout === 'home' ? BEHIND[i][0] : 3 + (94 - width * n) / 2 + width * i;
    const bottom = layout === 'home' ? BEHIND[i][1] : i % 2 ? 13 : 4;
    art.style.width = `${width}%`;
    art.style.left = `${left}%`;
    art.style.bottom = `${bottom}%`;
    el.append(art);
  });
  return el;
}
