/**
 * The companion: a small plant spirit drawn in SVG. Each stage is a static template
 * (no user data ever enters this markup). Animation is pure CSS, see styles.css.
 */
const face = (cx: number, cy: number, r = 1) => `
  <g class="face">
    <ellipse class="eye" cx="${cx - 5 * r}" cy="${cy}" rx="${1.6 * r}" ry="${2.2 * r}"/>
    <ellipse class="eye" cx="${cx + 5 * r}" cy="${cy}" rx="${1.6 * r}" ry="${2.2 * r}"/>
    <ellipse class="cheek" cx="${cx - 8.5 * r}" cy="${cy + 4 * r}" rx="${2.4 * r}" ry="${1.4 * r}"/>
    <ellipse class="cheek" cx="${cx + 8.5 * r}" cy="${cy + 4 * r}" rx="${2.4 * r}" ry="${1.4 * r}"/>
    <path class="mouth" d="M${cx - 2.5 * r} ${cy + 4 * r} q${2.5 * r} ${2.4 * r} ${5 * r} 0"/>
  </g>`;

const leaf = (x: number, y: number, dir: 1 | -1, size = 1, cls = '') =>
  `<path class="leaf ${cls}" transform="translate(${x} ${y}) scale(${dir * size} ${size})"
     d="M0 0 C 8 -12, 26 -12, 32 -4 C 24 4, 10 6, 0 0 Z"/>`;

const stem = (top: number) => `<path class="stem" d="M100 150 C 98 ${(150 + top) / 2}, 102 ${(150 + top) / 2}, 100 ${top}"/>`;

const petals = (cx: number, cy: number, n: number, len: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (360 / n) * i;
    return `<ellipse class="petal" cx="${cx}" cy="${cy - len * 0.55}" rx="${len * 0.36}" ry="${len * 0.6}"
      transform="rotate(${a} ${cx} ${cy})"/>`;
  }).join('');

const STAGE_ART: string[] = [
  // 0 Seed
  `<g class="sway">
     <ellipse class="seed" cx="100" cy="138" rx="18" ry="14"/>
     <path class="seed-tip" d="M100 124 q3 -7 8 -8"/>
     ${face(100, 138, 0.8)}
   </g>`,
  // 1 Sprout
  `<g class="sway">
     ${stem(112)}
     ${leaf(100, 116, -1, 0.8)}${leaf(100, 116, 1, 0.8)}
     <circle class="head" cx="100" cy="106" r="13"/>
     ${face(100, 106, 0.75)}
   </g>`,
  // 2 Sapling
  `<g class="sway">
     ${stem(86)}
     ${leaf(100, 132, -1, 0.9)}${leaf(100, 120, 1, 1)}
     ${leaf(100, 100, -1, 1.05)}${leaf(100, 92, 1, 0.8)}
     <circle class="head" cx="100" cy="78" r="15"/>
     ${face(100, 78, 0.85)}
   </g>`,
  // 3 Bud
  `<g class="sway">
     ${stem(70)}
     ${leaf(100, 136, -1, 1)}${leaf(100, 124, 1, 1.1)}
     ${leaf(100, 104, -1, 1.15)}${leaf(100, 92, 1, 0.95)}
     <path class="bud" d="M100 34 C 78 44, 78 70, 100 76 C 122 70, 122 44, 100 34 Z"/>
     <path class="bud-line" d="M100 38 C 94 50, 94 64, 100 74"/>
     ${face(100, 60, 0.85)}
   </g>`,
  // 4 Bloom
  `<g class="sway">
     ${stem(66)}
     ${leaf(100, 138, -1, 1.1)}${leaf(100, 126, 1, 1.15)}
     ${leaf(100, 104, -1, 1.2)}${leaf(100, 90, 1, 1)}
     <g class="flower">${petals(100, 52, 7, 30)}</g>
     <circle class="head" cx="100" cy="52" r="16"/>
     ${face(100, 52, 0.9)}
   </g>`,
  // 5 Elder Bloom
  `<circle class="halo" cx="100" cy="52" r="52"/>
   <g class="sway">
     ${stem(66)}
     ${leaf(100, 140, -1, 1.2)}${leaf(100, 130, 1, 1.25)}
     ${leaf(100, 110, -1, 1.3)}${leaf(100, 94, 1, 1.1)}
     ${leaf(100, 80, -1, 0.8, 'leaf-small')}
     <g class="flower">${petals(100, 52, 9, 36)}</g>
     <g class="flower inner">${petals(100, 52, 7, 22)}</g>
     <circle class="head" cx="100" cy="52" r="16"/>
     ${face(100, 52, 0.9)}
   </g>
   <g class="motes">
     <circle cx="44" cy="70" r="2.5"/><circle cx="160" cy="46" r="2"/><circle cx="150" cy="104" r="2.5"/>
   </g>`,
];

const POT = `
  <ellipse class="shadow" cx="100" cy="186" rx="44" ry="6"/>
  <path class="pot" d="M66 150 H134 L126 184 Q125 188 120 188 H80 Q75 188 74 184 Z"/>
  <rect class="pot-rim" x="62" y="144" width="76" height="12" rx="6"/>
  <ellipse class="soil" cx="100" cy="146" rx="32" ry="4"/>`;

/** Build the companion SVG for a stage. `growth` (0–1) gently scales it during a session. */
export function renderCompanion(stage: number, opts: { growth?: number; label: string }): SVGSVGElement {
  const idx = Math.max(0, Math.min(STAGE_ART.length - 1, stage));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', `companion stage-${idx}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', opts.label);
  // Static trusted template only.
  svg.innerHTML = `${POT}<g class="plant">${STAGE_ART[idx]}</g>`;
  setGrowth(svg, opts.growth ?? 1);
  return svg;
}

export function setGrowth(svg: SVGSVGElement, growth: number): void {
  const g = Math.max(0, Math.min(1, growth));
  svg.style.setProperty('--grow', String(0.9 + g * 0.1));
}
