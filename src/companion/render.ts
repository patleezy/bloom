import type { SpeciesId } from '../domain/types';

/**
 * Companion art. Each species is a small round creature that grows something on its head:
 * a flower (Bloomling), a flame (Kindle), or a water lily (Ripple). All markup is built from
 * static templates and numbers — no user data ever enters it. Colors come from CSS classes
 * (.species-*), animation is pure CSS (see styles.css).
 */

const GROUND = 178;
const X = 100;

/** Visible frame size per stage (viewBox width/height). */
const FRAME = [110, 125, 145, 165, 185, 200];

/** Body size per stage — shared by all species so growth feels consistent. */
const SIZES = [
  { rx: 22, ry: 20 },
  { rx: 28, ry: 25 },
  { rx: 33, ry: 29 },
  { rx: 37, ry: 32 },
  { rx: 40, ry: 34 },
  { rx: 43, ry: 36 },
];

interface Geo {
  stage: number;
  rx: number;
  ry: number;
  cy: number; // body center
  top: number; // body top
  s: number; // scale factor for details
}

// ---------- shared shapes ----------

const leaf = (x: number, y: number, angle: number, size: number, cls = 'leaf') =>
  `<path class="${cls}" transform="translate(${x} ${y}) rotate(${angle}) scale(${size})"
     d="M0 0 C 6 -9, 20 -10, 26 -3 C 19 3, 8 5, 0 0 Z"/>`;

const roundPetals = (cx: number, cy: number, n: number, len: number, cls: string) =>
  Array.from({ length: n }, (_, i) =>
    `<ellipse class="${cls}" cx="${cx}" cy="${cy - len * 0.55}" rx="${len * 0.34}" ry="${len * 0.58}"
      transform="rotate(${(360 / n) * i} ${cx} ${cy})"/>`).join('');

/** Pointed petal fanned around a base point (for the water lily). */
const lilyPetals = (cx: number, cy: number, n: number, len: number, spread: number, cls: string) =>
  Array.from({ length: n }, (_, i) => {
    const a = n === 1 ? 0 : -spread / 2 + (spread / (n - 1)) * i;
    const w = len * 0.32;
    return `<path class="${cls}" transform="translate(${cx} ${cy}) rotate(${a})"
      d="M0 0 C ${w} ${-len * 0.35}, ${w * 0.7} ${-len * 0.8}, 0 ${-len} C ${-w * 0.7} ${-len * 0.8}, ${-w} ${-len * 0.35}, 0 0 Z"/>`;
  }).join('');

const flame = (x: number, base: number, h: number, cls = 'flame') =>
  `<path class="${cls}" d="M${x} ${base}
     C ${x - h * 0.5} ${base - h * 0.15}, ${x - h * 0.35} ${base - h * 0.6}, ${x - h * 0.05} ${base - h}
     C ${x + h * 0.02} ${base - h * 0.75}, ${x + h * 0.25} ${base - h * 0.72}, ${x + h * 0.22} ${base - h * 0.55}
     C ${x + h * 0.5} ${base - h * 0.4}, ${x + h * 0.45} ${base - h * 0.1}, ${x} ${base} Z"/>`;

const stem = (top: number, h: number) => `<path class="stem" d="M${X} ${top + 2} q-2 ${-h / 2} 0 ${-h}"/>`;

function face(g: Geo): string {
  const { s } = g;
  const cy = g.cy - g.ry * 0.1;
  const eye = (cx: number) => `
    <ellipse class="eye eye-open" cx="${cx}" cy="${cy}" rx="${2.4 * s}" ry="${3.2 * s}"/>
    <circle class="eye-shine eye-open" cx="${cx + 0.9 * s}" cy="${cy - 1.2 * s}" r="${0.8 * s}"/>
    <path class="eye-closed" d="M${cx - 3 * s} ${cy} q${3 * s} ${2.6 * s} ${6 * s} 0"/>`;
  return `<g class="face">
    ${eye(X - 9 * s)}${eye(X + 9 * s)}
    <ellipse class="cheek" cx="${X - 15 * s}" cy="${cy + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}"/>
    <ellipse class="cheek" cx="${X + 15 * s}" cy="${cy + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}"/>
    <path class="mouth" d="M${X - 3 * s} ${cy + 5 * s} q${3 * s} ${3 * s} ${6 * s} 0"/>
  </g>`;
}

// ---------- species parts ----------

interface Parts {
  back: string; // drawn behind the body (tails, gills)
  crown: string; // on top of the head
  arms: string;
  front: string; // drawn over the body (ears in front, etc.)
}

function bloomling(g: Geo): Parts {
  const { stage, top } = g;
  const crowns = [
    `<path class="stem" d="M${X} ${top + 2} q2 -5 6 -7"/>`,
    `${stem(top, 12)}${leaf(X, top - 10, -160, 0.6)}${leaf(X, top - 10, -20, 0.6)}`,
    `${stem(top, 18)}${leaf(X, top - 10, -165, 0.75)}${leaf(X, top - 12, -15, 0.8)}${leaf(X, top - 16, -95, 0.55)}`,
    `${stem(top, 20)}${leaf(X, top - 8, -165, 0.8)}${leaf(X, top - 10, -15, 0.8)}
      <path class="accent" d="M${X} ${top - 40} C ${X - 12} ${top - 34}, ${X - 12} ${top - 20}, ${X} ${top - 17}
        C ${X + 12} ${top - 20}, ${X + 12} ${top - 34}, ${X} ${top - 40} Z"/>
      <path class="accent-line" d="M${X} ${top - 37} C ${X - 4} ${top - 30}, ${X - 4} ${top - 23}, ${X} ${top - 18}"/>`,
    `${stem(top, 16)}${leaf(X, top - 6, -170, 0.8)}${leaf(X, top - 8, -10, 0.8)}
      <g class="spin">${roundPetals(X, top - 26, 7, 16, 'accent')}</g>
      <circle class="accent-center" cx="${X}" cy="${top - 26}" r="6"/>`,
    `${stem(top, 18)}${leaf(X, top - 6, -170, 0.9)}${leaf(X, top - 8, -10, 0.9)}
      ${leaf(X - 14, top + 6, -150, 0.6)}${leaf(X + 14, top + 6, -30, 0.6)}
      <g class="spin">${roundPetals(X, top - 28, 9, 20, 'accent')}</g>
      <g class="spin">${roundPetals(X, top - 28, 7, 12, 'accent-2')}</g>
      <circle class="accent-center" cx="${X}" cy="${top - 28}" r="6"/>`,
  ];
  return { back: '', crown: crowns[stage], arms: leafArms(g, 'leaf arm-leaf'), front: '' };
}

function kindle(g: Geo): Parts {
  const { stage, top, rx, cy, s } = g;
  const tuft = (h: number) =>
    `<g class="flicker">${flame(X, top + 4, h)}${flame(X, top + 4, h * 0.6, 'flame-core')}</g>`;
  const sunflare = (r: number, n: number) =>
    `<g class="spin">${roundPetals(X, top - r * 0.9, n, r, 'accent')}</g>
     <circle class="accent-center" cx="${X}" cy="${top - r * 0.9}" r="${r * 0.4}"/>
     <g class="flicker">${flame(X, top - r * 0.9 + r * 0.45, r * 0.9, 'flame-core')}</g>`;
  const crowns = [
    `<g class="flicker">${flame(X + 2, top - 2, 10, 'flame-core')}</g>`,
    tuft(20),
    tuft(24),
    `${tuft(30)}<circle class="ember-dot" cx="${X - 12}" cy="${top - 18}" r="2"/><circle class="ember-dot" cx="${X + 14}" cy="${top - 26}" r="1.6"/>`,
    sunflare(16, 8),
    sunflare(20, 10),
  ];
  const ears = stage >= 1
    ? [-1, 1].map((d) => {
        const bx = X + d * rx * 0.55;
        const tipX = X + d * rx * 0.95;
        return `<path class="ear" d="M${bx - d * 9 * s} ${cy - g.ry * 0.7} L${tipX} ${top - 12 * s} L${bx + d * 9 * s} ${cy - g.ry * 0.55} Z"/>
          <path class="ear-inner" d="M${bx - d * 4 * s} ${cy - g.ry * 0.68} L${tipX - d * 3 * s} ${top - 5 * s} L${bx + d * 5 * s} ${cy - g.ry * 0.58} Z"/>`;
      }).join('')
    : '';
  const tail = stage >= 2
    ? `<g class="tail">${flame(X + rx * 0.9, GROUND - 6, 22 * s)}${flame(X + rx * 0.9, GROUND - 6, 13 * s, 'flame-core')}</g>`
    : '';
  const paws = stage >= 2
    ? `<ellipse class="paw arm arm-l" cx="${X - rx + 3}" cy="${cy + 6}" rx="${6 * s}" ry="${4.5 * s}"/>
       <ellipse class="paw arm arm-r" cx="${X + rx - 3}" cy="${cy + 6}" rx="${6 * s}" ry="${4.5 * s}"/>`
    : '';
  return { back: tail + ears, crown: crowns[stage], arms: paws, front: '' };
}

function ripple(g: Geo): Parts {
  const { stage, top, rx, cy, s } = g;
  const pad = (w: number) =>
    `<path class="pad" d="M${X - w} ${top + 1} Q ${X} ${top - w * 0.5} ${X + w} ${top + 1} Q ${X} ${top + w * 0.25} ${X - w} ${top + 1} Z"/>`;
  const lily = (len: number, n: number, inner: boolean) =>
    `${pad(len * 1.1)}
     <g class="spin-slow">${lilyPetals(X, top - 2, n, len, 150, 'accent')}</g>
     ${inner ? lilyPetals(X, top - 2, 5, len * 0.65, 90, 'accent-2') : ''}
     <circle class="accent-center" cx="${X}" cy="${top - 4}" r="${len * 0.16}"/>`;
  const crowns = [
    `<path class="droplet bob" d="M${X + 3} ${top - 16} C ${X - 3} ${top - 6}, ${X - 2} ${top - 1}, ${X + 3} ${top - 1} C ${X + 8} ${top - 1}, ${X + 9} ${top - 6}, ${X + 3} ${top - 16} Z"/>`,
    `${pad(12)}<path class="droplet bob" d="M${X} ${top - 20} C ${X - 5} ${top - 12}, ${X - 4} ${top - 7}, ${X} ${top - 7} C ${X + 4} ${top - 7}, ${X + 5} ${top - 12}, ${X} ${top - 20} Z"/>`,
    `${pad(16)}${lilyPetals(X, top - 1, 1, 12, 0, 'accent')}`,
    `${pad(18)}${lilyPetals(X, top - 2, 3, 20, 30, 'accent')}`,
    lily(20, 7, false),
    lily(24, 9, true),
  ];
  // Axolotl-style frills on each side of the head.
  const gills = stage >= 2
    ? [-1, 1].map((d) => [0, 1, 2].map((i) => {
        const bx = X + d * rx * 0.75;
        const by = cy - g.ry * 0.35 + i * 7 * s;
        const len = (stage >= 3 ? 14 : 10) * s;
        const ang = d === 1 ? -35 + i * 30 : 215 - i * 30;
        return `<path class="gill" transform="translate(${bx} ${by}) rotate(${ang})"
          d="M0 -${2.5 * s} Q ${len * 0.6} -${4 * s} ${len} 0 Q ${len * 0.6} ${4 * s} 0 ${2.5 * s} Z"/>`;
      }).join('')).join('')
    : '';
  return { back: gills, crown: crowns[stage], arms: stage >= 2 ? leafArms(g, 'fin arm-leaf') : '', front: '' };
}

function leafArms(g: Geo, cls: string): string {
  if (g.stage < 2) return '';
  return `<g class="arm arm-l">${leaf(X - g.rx + 3, g.cy + 4, 160, 0.6 * g.s, cls)}</g>
          <g class="arm arm-r">${leaf(X + g.rx - 3, g.cy + 4, 20, 0.6 * g.s, cls)}</g>`;
}


// ---------- activity props ----------
// Hidden by default; CSS reveals one when the svg carries a matching .act-* class
// (see companion/activities.ts). All static markup built from numbers only.

function props(species: SpeciesId, g: Geo): string {
  const { cy, ry, rx, top, s } = g;
  const mouthY = cy - ry * 0.1 + 5 * s;
  const by = cy + ry * 0.48; // book spine top (below the smile)
  const common = `
    <g class="prop prop-read">
      <path class="book-cover" d="M${X} ${by + 2 * s} L${X - 14 * s} ${by - 2 * s} L${X - 14 * s} ${by + 10 * s} L${X} ${by + 14 * s} L${X + 14 * s} ${by + 10 * s} L${X + 14 * s} ${by - 2 * s} Z"/>
      <path class="book-page" d="M${X} ${by + 1 * s} L${X - 12 * s} ${by - 2 * s} L${X - 12 * s} ${by + 9 * s} L${X} ${by + 12 * s} Z"/>
      <path class="book-page" d="M${X} ${by + 1 * s} L${X + 12 * s} ${by - 2 * s} L${X + 12 * s} ${by + 9 * s} L${X} ${by + 12 * s} Z"/>
      <path class="book-page page-flip" d="M${X} ${by + 1 * s} L${X + 12 * s} ${by - 2 * s} L${X + 12 * s} ${by + 9 * s} L${X} ${by + 12 * s} Z"/>
    </g>
    <g class="prop prop-hum">
      <text class="note-glyph" x="${X + rx * 0.6}" y="${top + 4}">♪</text>
      <text class="note-glyph" x="${X + rx * 0.9}" y="${top - 6}">♫</text>
      <text class="note-glyph" x="${X + rx * 0.4}" y="${top - 10}">♪</text>
    </g>`;
  const own: Record<SpeciesId, string> = {
    bloomling: `
      <g class="prop prop-water">
        <g class="can">
          <path class="can-body" d="M${X - rx - 22} ${top - 30} h18 v14 a3 3 0 0 1 -3 3 h-12 a3 3 0 0 1 -3 -3 Z"/>
          <path class="can-spout" d="M${X - rx - 4} ${top - 24} L${X - rx + 10} ${top - 32}"/>
          <path class="can-handle" d="M${X - rx - 22} ${top - 26} q-6 4 0 10"/>
        </g>
        <circle class="drop" cx="${X - 6}" cy="${top - 26}" r="2.4"/>
        <circle class="drop" cx="${X - 1}" cy="${top - 24}" r="2.1"/>
        <circle class="drop" cx="${X - 11}" cy="${top - 22}" r="2"/>
      </g>
      <g class="prop prop-butterfly" transform="translate(${X + rx * 0.8} ${top - 8})">
        <g class="fly"><g class="flap">
          <ellipse class="wing" cx="-4.5" cy="0" rx="5.5" ry="7.5"/>
          <ellipse class="wing" cx="4.5" cy="0" rx="5.5" ry="7.5"/>
          <ellipse class="wing-body" cx="0" cy="0" rx="1.2" ry="5.5"/>
        </g></g>
      </g>`,
    kindle: `
      <g class="prop prop-sparks">
        ${[-14, -5, 6, 15].map((dx, i) => `<circle class="spark spark-${i}" cx="${X + dx * 0.3}" cy="${top - 14}" r="1.8"/>`).join('')}
      </g>`,
    ripple: `
      <g class="prop prop-bubbles">
        ${[0, 1, 2, 3].map((i) => `<circle class="bubble bubble-${i}" cx="${X + 6 * s + i * 2}" cy="${mouthY}" r="${2.6 + (i % 2) * 1.2}"/>`).join('')}
      </g>`,
  };
  return common + own[species];
}

const PARTS: Record<SpeciesId, (g: Geo) => Parts> = { bloomling, kindle, ripple };

// ---------- assembly ----------

function creature(species: SpeciesId, stage: number): string {
  const { rx, ry } = SIZES[stage];
  const hasFeet = stage >= 2;
  const cy = GROUND - ry - (hasFeet ? 4 : 0);
  const g: Geo = { stage, rx, ry, cy, top: cy - ry, s: rx / 32 };
  const p = PARTS[species](g);

  const feet = hasFeet
    ? `<ellipse class="foot" cx="${X - rx * 0.45}" cy="${GROUND - 3}" rx="${8 * g.s}" ry="${4.5 * g.s}"/>
       <ellipse class="foot" cx="${X + rx * 0.45}" cy="${GROUND - 3}" rx="${8 * g.s}" ry="${4.5 * g.s}"/>`
    : '';
  // Stage 0 is egg/seed shaped: slightly pointed on top.
  const body = stage === 0
    ? `<path class="body" d="M${X} ${g.top - 4} C ${X + rx} ${g.top + 4}, ${X + rx} ${GROUND}, ${X} ${GROUND}
         C ${X - rx} ${GROUND}, ${X - rx} ${g.top + 4}, ${X} ${g.top - 4} Z"/>`
    : `<ellipse class="body" cx="${X}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const elder = stage === 5;

  return `${elder ? `<circle class="halo" cx="${X}" cy="${cy - 10}" r="${rx + 34}"/>` : ''}
    <ellipse class="shadow" cx="${X}" cy="${GROUND + 2}" rx="${rx + 6}" ry="5"/>
    <g class="bounce">
      ${p.back}
      ${feet}
      <g class="crown">${p.crown}</g>
      ${p.arms}
      ${body}
      <ellipse class="belly" cx="${X}" cy="${cy + ry * 0.35}" rx="${rx * 0.55}" ry="${ry * 0.45}"/>
      ${p.front}
      ${face(g)}
      ${props(species, g)}
    </g>
    ${elder ? `<g class="motes"><circle cx="38" cy="80" r="2.5"/><circle cx="164" cy="60" r="2"/><circle cx="160" cy="124" r="2.5"/></g>` : ''}
    <g class="zzz"><text x="${X + rx + 4}" y="${g.top}">z</text><text x="${X + rx + 16}" y="${g.top - 12}">z</text></g>`;
}

/** Build the companion SVG. `growth` (0–1) gently scales it during a session. */
export function renderCompanion(
  species: SpeciesId,
  stage: number,
  opts: { growth?: number; label: string },
): SVGSVGElement {
  const idx = Math.max(0, Math.min(SIZES.length - 1, stage));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // Frame tighter on young stages so they read clearly; zoom out as the companion grows.
  const v = FRAME[idx];
  svg.setAttribute('viewBox', `${X - v / 2} ${GROUND + 12 - v} ${v} ${v}`);
  svg.setAttribute('class', `companion species-${species} stage-${idx}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', opts.label);
  // Static trusted template only.
  svg.innerHTML = `<g class="plant">${creature(species, idx)}</g>`;
  setGrowth(svg, opts.growth ?? 1);
  return svg;
}

export function setGrowth(svg: SVGSVGElement, growth: number): void {
  const g = Math.max(0, Math.min(1, growth));
  svg.style.setProperty('--grow', String(0.9 + g * 0.1));
}

/** Sleeping pose (eyes closed, zzz), used while a session is paused. */
export function setSleeping(svg: SVGSVGElement, sleeping: boolean): void {
  svg.classList.toggle('sleeping', sleeping);
}
