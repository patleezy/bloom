import type { Meadow, Plant, PlantKind } from '../domain/meadow';
import type { SpeciesId } from '../domain/types';
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
export function meadowScene(m: Meadow, friends: readonly MeadowFriend[], layout: 'home' | 'garden'): HTMLElement {
  const el = document.createElement('div');
  el.className = `meadow meadow-${layout}`;
  el.append(svgEl(`0 0 ${W} ${H}`, 'meadow-svg', `
    <circle class="mdw-sun" cx="286" cy="62" r="26"/>
    <g class="mdw-cloud drift-a"><ellipse cx="78" cy="58" rx="30" ry="11"/><ellipse cx="98" cy="50" rx="18" ry="11"/></g>
    <g class="mdw-cloud drift-b"><ellipse cx="212" cy="96" rx="22" ry="8"/><ellipse cx="226" cy="90" rx="13" ry="8"/></g>
    ${hill(farTop, 'mdw-hill-far')}${hill(midTop, 'mdw-hill-mid')}${hill(frontTop, 'mdw-ground')}
    ${m.plants.map(plantMarkup).join('')}`));

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
