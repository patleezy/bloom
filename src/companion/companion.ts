/**
 * The companion: a small round creature that grows like a plant — a leaf sprout, then a bud,
 * then a flower crown. Each stage is a static SVG template (no user data ever enters this
 * markup). Animation is pure CSS, see styles.css.
 */

interface Form {
  rx: number; // body half-width
  ry: number; // body half-height
  feet: boolean;
  arms: boolean;
  crown: 'none' | 'sprout' | 'leaves' | 'bud' | 'flower' | 'elder';
}

const FORMS: Form[] = [
  { rx: 22, ry: 20, feet: false, arms: false, crown: 'none' }, // Seed
  { rx: 28, ry: 25, feet: false, arms: false, crown: 'sprout' }, // Sprout
  { rx: 33, ry: 29, feet: true, arms: true, crown: 'leaves' }, // Sapling
  { rx: 37, ry: 32, feet: true, arms: true, crown: 'bud' }, // Bud
  { rx: 40, ry: 34, feet: true, arms: true, crown: 'flower' }, // Bloom
  { rx: 43, ry: 36, feet: true, arms: true, crown: 'elder' }, // Elder Bloom
];

const GROUND = 178;

const leaf = (x: number, y: number, angle: number, size: number, cls = 'leaf') =>
  `<path class="${cls}" transform="translate(${x} ${y}) rotate(${angle}) scale(${size})"
     d="M0 0 C 6 -9, 20 -10, 26 -3 C 19 3, 8 5, 0 0 Z"/>`;

const petals = (cx: number, cy: number, n: number, len: number, cls = 'petal') =>
  Array.from({ length: n }, (_, i) =>
    `<ellipse class="${cls}" cx="${cx}" cy="${cy - len * 0.55}" rx="${len * 0.34}" ry="${len * 0.58}"
      transform="rotate(${(360 / n) * i} ${cx} ${cy})"/>`).join('');

function crown(kind: Form['crown'], top: number): string {
  const x = 100;
  const stem = (h: number) => `<path class="stem" d="M${x} ${top + 2} q-2 ${-h / 2} 0 ${-h}"/>`;
  switch (kind) {
    case 'none':
      return `<path class="stem" d="M${x} ${top + 2} q2 -5 6 -7"/>`;
    case 'sprout':
      return `${stem(12)}${leaf(x, top - 10, -160, 0.6)}${leaf(x, top - 10, -20, 0.6)}`;
    case 'leaves':
      return `${stem(18)}${leaf(x, top - 10, -165, 0.75)}${leaf(x, top - 12, -15, 0.8)}${leaf(x, top - 16, -95, 0.55)}`;
    case 'bud':
      return `${stem(20)}${leaf(x, top - 8, -165, 0.8)}${leaf(x, top - 10, -15, 0.8)}
        <path class="bud" d="M${x} ${top - 40} C ${x - 12} ${top - 34}, ${x - 12} ${top - 20}, ${x} ${top - 17}
          C ${x + 12} ${top - 20}, ${x + 12} ${top - 34}, ${x} ${top - 40} Z"/>
        <path class="bud-line" d="M${x} ${top - 37} C ${x - 4} ${top - 30}, ${x - 4} ${top - 23}, ${x} ${top - 18}"/>`;
    case 'flower':
      return `${stem(16)}${leaf(x, top - 6, -170, 0.8)}${leaf(x, top - 8, -10, 0.8)}
        <g class="flower">${petals(x, top - 26, 7, 16)}</g>
        <circle class="flower-center" cx="${x}" cy="${top - 26}" r="6"/>`;
    case 'elder':
      return `${stem(18)}${leaf(x, top - 6, -170, 0.9)}${leaf(x, top - 8, -10, 0.9)}
        ${leaf(x - 14, top + 6, -150, 0.6)}${leaf(x + 14, top + 6, -30, 0.6)}
        <g class="flower">${petals(x, top - 28, 9, 20)}</g>
        <g class="flower inner">${petals(x, top - 28, 7, 12, 'petal petal-2')}</g>
        <circle class="flower-center" cx="${x}" cy="${top - 28}" r="6"/>`;
  }
}

function face(cy: number, s: number): string {
  const eye = (cx: number) => `
    <ellipse class="eye eye-open" cx="${cx}" cy="${cy}" rx="${2.4 * s}" ry="${3.2 * s}"/>
    <circle class="eye-shine eye-open" cx="${cx + 0.9 * s}" cy="${cy - 1.2 * s}" r="${0.8 * s}"/>
    <path class="eye-closed" d="M${cx - 3 * s} ${cy} q${3 * s} ${2.6 * s} ${6 * s} 0"/>`;
  return `<g class="face">
    ${eye(100 - 9 * s)}${eye(100 + 9 * s)}
    <ellipse class="cheek" cx="${100 - 15 * s}" cy="${cy + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}"/>
    <ellipse class="cheek" cx="${100 + 15 * s}" cy="${cy + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}"/>
    <path class="mouth" d="M${100 - 3 * s} ${cy + 5 * s} q${3 * s} ${3 * s} ${6 * s} 0"/>
  </g>`;
}

function creature(f: Form): string {
  const cy = GROUND - f.ry - (f.feet ? 4 : 0);
  const top = cy - f.ry;
  const s = f.rx / 32;
  const feet = f.feet
    ? `<ellipse class="foot" cx="${100 - f.rx * 0.45}" cy="${GROUND - 3}" rx="${8 * s}" ry="${4.5 * s}"/>
       <ellipse class="foot" cx="${100 + f.rx * 0.45}" cy="${GROUND - 3}" rx="${8 * s}" ry="${4.5 * s}"/>`
    : '';
  const arms = f.arms
    ? `<g class="arm arm-l">${leaf(100 - f.rx + 3, cy + 4, 160, 0.6 * s, 'leaf arm-leaf')}</g>
       <g class="arm arm-r">${leaf(100 + f.rx - 3, cy + 4, 20, 0.6 * s, 'leaf arm-leaf')}</g>`
    : '';
  const halo = f.crown === 'elder' ? `<circle class="halo" cx="100" cy="${cy - 10}" r="${f.rx + 34}"/>` : '';
  const motes = f.crown === 'elder'
    ? `<g class="motes"><circle cx="38" cy="80" r="2.5"/><circle cx="164" cy="60" r="2"/><circle cx="160" cy="124" r="2.5"/></g>`
    : '';
  // Seed form is slightly pointed on top, like a seed.
  const body = f.crown === 'none'
    ? `<path class="body" d="M100 ${top - 4} C ${100 + f.rx} ${top + 4}, ${100 + f.rx} ${GROUND}, 100 ${GROUND}
         C ${100 - f.rx} ${GROUND}, ${100 - f.rx} ${top + 4}, 100 ${top - 4} Z"/>`
    : `<ellipse class="body" cx="100" cy="${cy}" rx="${f.rx}" ry="${f.ry}"/>`;
  return `${halo}
    <ellipse class="shadow" cx="100" cy="${GROUND + 2}" rx="${f.rx + 6}" ry="5"/>
    <g class="bounce">
      ${feet}
      <g class="crown">${crown(f.crown, top)}</g>
      ${arms}
      ${body}
      <ellipse class="belly" cx="100" cy="${cy + f.ry * 0.35}" rx="${f.rx * 0.55}" ry="${f.ry * 0.45}"/>
      ${face(cy - f.ry * 0.1, s)}
    </g>
    ${motes}
    <g class="zzz"><text x="${100 + f.rx}" y="${top}">z</text><text x="${112 + f.rx}" y="${top - 12}">z</text></g>`;
}

/** Build the companion SVG for a stage. `growth` (0–1) gently scales it during a session. */
export function renderCompanion(stage: number, opts: { growth?: number; label: string }): SVGSVGElement {
  const idx = Math.max(0, Math.min(FORMS.length - 1, stage));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', `companion stage-${idx}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', opts.label);
  // Static trusted template only.
  svg.innerHTML = `<g class="plant">${creature(FORMS[idx])}</g>`;
  setGrowth(svg, opts.growth ?? 1);
  return svg;
}

export function setGrowth(svg: SVGSVGElement, growth: number): void {
  const g = Math.max(0, Math.min(1, growth));
  svg.style.setProperty('--grow', String(0.9 + g * 0.1));
}

/** Sleeping pose (eyes closed, zzz) — used while a session is paused. */
export function setSleeping(svg: SVGSVGElement, sleeping: boolean): void {
  svg.classList.toggle('sleeping', sleeping);
}
