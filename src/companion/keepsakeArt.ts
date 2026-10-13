/**
 * Keepsake art: small 48×48 SVGs. Static trusted markup (shapes and colors only, no user text).
 * Locked items reuse the same shapes as a soft silhouette (see .keepsake-art.locked in styles.css).
 */
const O = 'stroke="#5d5249" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';

const ART: Record<string, string> = {
  // Seed
  'daisy-clip': `<rect x="10" y="30" width="28" height="5" rx="2.5" fill="#d9c9b6" ${O}/>
    <g fill="#fffaf2" ${O}><circle cx="24" cy="13" r="5"/><circle cx="33" cy="20" r="5"/><circle cx="29" cy="30" r="5"/><circle cx="19" cy="30" r="5"/><circle cx="15" cy="20" r="5"/></g>
    <circle cx="24" cy="22" r="5" fill="#f7cf6b" ${O}/>`,
  'leaf-cap': `<path d="M8 30c0-10 7-17 16-17s16 7 16 17Z" fill="#9ccf8a" ${O}/>
    <path d="M24 13v17M16 18l8 6M32 18l-8 6" fill="none" ${O}/><path d="M6 30h36" ${O}/>
    <path d="M24 13c1-4 4-6 8-6-1 4-4 6-8 6Z" fill="#7fb874" ${O}/>`,
  'acorn-hat': `<path d="M10 26c0-9 6-14 14-14s14 5 14 14Z" fill="#b98a5e" ${O}/>
    <path d="M14 20h20M12 24h24" stroke="#8f6844" stroke-width="1.2" fill="none"/>
    <path d="M24 12V7" ${O}/><path d="M8 26h32v4H8Z" fill="#d6ad7c" ${O}/>`,
  'cozy-scarf': `<path d="M8 18c5 4 27 4 32 0v8c-5 4-27 4-32 0Z" fill="#f2a99a" ${O}/>
    <path d="M28 26l2 14h7l-3-15Z" fill="#f2a99a" ${O}/>
    <path d="M14 21v7M20 22v7M26 22v7M30 30h5M31 35h5" stroke="#fbe0d6" stroke-width="2" fill="none"/>`,
  'berry-bow': `<path d="M24 24 9 15v18Z" fill="#e88aa6" ${O}/><path d="M24 24l15-9v18Z" fill="#e88aa6" ${O}/>
    <circle cx="24" cy="24" r="4.5" fill="#d0607f" ${O}/>
    <circle cx="14" cy="21" r="1.4" fill="#fbe0e8"/><circle cx="34" cy="21" r="1.4" fill="#fbe0e8"/><circle cx="14" cy="27" r="1.4" fill="#fbe0e8"/><circle cx="34" cy="27" r="1.4" fill="#fbe0e8"/>`,
  ladybug: `<ellipse cx="24" cy="28" rx="13" ry="11" fill="#ec7b6d" ${O}/>
    <circle cx="24" cy="16" r="6" fill="#5d5249" ${O}/><path d="M24 17v22" ${O}/>
    <circle cx="18" cy="25" r="2.2" fill="#5d5249"/><circle cx="30" cy="25" r="2.2" fill="#5d5249"/><circle cx="19" cy="33" r="2" fill="#5d5249"/><circle cx="29" cy="33" r="2" fill="#5d5249"/>
    <circle cx="22" cy="15" r="1" fill="#fff"/><circle cx="26" cy="15" r="1" fill="#fff"/>`,
  snail: `<path d="M6 36c0-4 3-6 7-6h22c4 0 7 2 7 6Z" fill="#d9ecc8" ${O}/>
    <circle cx="26" cy="23" r="10" fill="#f0c38e" ${O}/><path d="M26 23a4 4 0 1 1 4-4 7 7 0 0 1-7 9" fill="none" ${O}/>
    <path d="M10 30l-2-8M13 30l1-8" ${O}/><circle cx="8" cy="21" r="1.5" fill="#5d5249"/><circle cx="14" cy="21" r="1.5" fill="#5d5249"/>`,
  pebble: `<path d="M8 32c0-9 7-15 16-15s16 6 16 15c0 4-4 6-16 6S8 36 8 32Z" fill="#c9ccd6" ${O}/>
    <circle cx="19" cy="28" r="1.6" fill="#5d5249"/><circle cx="29" cy="28" r="1.6" fill="#5d5249"/>
    <path d="M22 32q2 2 4 0" fill="none" ${O}/><circle cx="16" cy="31" r="2" fill="#f2b5b0" opacity=".7"/><circle cx="32" cy="31" r="2" fill="#f2b5b0" opacity=".7"/>`,
  picnic: `<path d="M6 30 20 14h22L28 34Z" fill="#fbe3e0" ${O}/>
    <path d="M13 22h21M9 26h21M16 14 8 32M24 14l-8 19M32 14l-8 19" stroke="#ec9c95" stroke-width="2.2" fill="none"/>
    <path d="M6 30 20 14h22L28 34Z" fill="none" ${O}/>`,
  meadow: `<rect x="5" y="8" width="38" height="32" rx="8" fill="#e4f1f6" ${O}/>
    <path d="M5 30c8-6 16-6 24-2s10 2 14-1v5a8 8 0 0 1-8 8H13a8 8 0 0 1-8-8Z" fill="#b6dba3"/>
    <circle cx="14" cy="32" r="1.6" fill="#fff"/><circle cx="24" cy="35" r="1.6" fill="#f7cf6b"/><circle cx="33" cy="33" r="1.6" fill="#f2a99a"/>
    <rect x="5" y="8" width="38" height="32" rx="8" fill="none" ${O}/>`,
  // Sprout
  'sun-hat': `<ellipse cx="24" cy="30" rx="19" ry="6" fill="#f3d79a" ${O}/>
    <path d="M14 29c0-9 4-14 10-14s10 5 10 14" fill="#f3d79a" ${O}/>
    <path d="M14 26c6 2 14 2 20 0" stroke="#ec9c95" stroke-width="3" fill="none"/>`,
  'mushroom-cap': `<path d="M6 28C6 17 14 10 24 10s18 7 18 18Z" fill="#ef8f80" ${O}/>
    <circle cx="16" cy="19" r="3" fill="#fff6ee"/><circle cx="28" cy="15" r="2.5" fill="#fff6ee"/><circle cx="33" cy="23" r="2.5" fill="#fff6ee"/><circle cx="22" cy="24" r="2" fill="#fff6ee"/>
    <path d="M6 28h36" ${O}/>`,
  beanie: `<path d="M10 30c0-11 6-17 14-17s14 6 14 17Z" fill="#a9c6e8" ${O}/>
    <rect x="8" y="28" width="32" height="7" rx="3" fill="#8bb0dc" ${O}/>
    <circle cx="24" cy="11" r="4" fill="#fbe8ef" ${O}/><path d="M16 18v10M24 14v14M32 18v10" stroke="#c5d9f0" stroke-width="1.6" fill="none"/>`,
  bumblebee: `<ellipse cx="18" cy="17" rx="6" ry="8" fill="#eef7fb" ${O} transform="rotate(-25 18 17)"/>
    <ellipse cx="30" cy="17" rx="6" ry="8" fill="#eef7fb" ${O} transform="rotate(25 30 17)"/>
    <ellipse cx="24" cy="29" rx="12" ry="9" fill="#f7d26b" ${O}/>
    <path d="M20 21v16M28 21v16" stroke="#5d5249" stroke-width="3"/>
    <ellipse cx="24" cy="29" rx="12" ry="9" fill="none" ${O}/>`,
  frog: `<ellipse cx="24" cy="30" rx="15" ry="10" fill="#9fd08f" ${O}/>
    <circle cx="16" cy="19" r="5" fill="#9fd08f" ${O}/><circle cx="32" cy="19" r="5" fill="#9fd08f" ${O}/>
    <circle cx="16" cy="19" r="2" fill="#5d5249"/><circle cx="32" cy="19" r="2" fill="#5d5249"/>
    <path d="M18 31q6 4 12 0" fill="none" ${O}/>`,
  pond: `<rect x="5" y="8" width="38" height="32" rx="8" fill="#f2efe2" ${O}/>
    <ellipse cx="24" cy="29" rx="16" ry="8" fill="#a8d8d6"/>
    <path d="M14 28a5 3 0 1 0 8 0l-4 0Z" fill="#7fb874"/><circle cx="30" cy="27" r="3" fill="#f6b8c8"/><circle cx="30" cy="27" r="1" fill="#f7cf6b"/>
    <rect x="5" y="8" width="38" height="32" rx="8" fill="none" ${O}/>`,
  'sunset-hill': `<rect x="5" y="8" width="38" height="32" rx="8" fill="#f8d4c4" ${O}/>
    <circle cx="30" cy="22" r="6" fill="#fbe9b0"/>
    <path d="M5 34c6-9 14-12 22-8s12 2 16 0v6a8 8 0 0 1-8 8H13a8 8 0 0 1-8-8Z" fill="#c2a5cf"/>
    <rect x="5" y="8" width="38" height="32" rx="8" fill="none" ${O}/>`,
  // Bloom
  'flower-crown': `<path d="M8 30c5 4 27 4 32 0" fill="none" stroke="#7fb874" stroke-width="3"/>
    <g ${O}><circle cx="12" cy="27" r="4.5" fill="#f6b8c8"/><circle cx="20" cy="30" r="4.5" fill="#fbe9b0"/><circle cx="28" cy="30" r="4.5" fill="#c9b6e8"/><circle cx="36" cy="27" r="4.5" fill="#f6b8c8"/></g>
    <g fill="#fff8f0"><circle cx="12" cy="27" r="1.4"/><circle cx="20" cy="30" r="1.4"/><circle cx="28" cy="30" r="1.4"/><circle cx="36" cy="27" r="1.4"/></g>`,
  'star-scarf': `<path d="M8 18c5 4 27 4 32 0v8c-5 4-27 4-32 0Z" fill="#9aa6e0" ${O}/>
    <path d="M28 26l2 14h7l-3-15Z" fill="#9aa6e0" ${O}/>
    <g fill="#fbe9b0"><path d="m15 22 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3Z"/><path d="m25 23 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3Z"/><path d="m33 31 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3Z"/></g>`,
  butterfly: `<path d="M24 24C18 10 6 10 8 20s10 6 16 4Z" fill="#c9b6e8" ${O}/>
    <path d="M24 24c6-14 18-14 16-4s-10 6-16 4Z" fill="#c9b6e8" ${O}/>
    <path d="M24 25c-5 2-12 6-9 11s7-4 9-11ZM24 25c5 2 12 6 9 11s-7-4-9-11Z" fill="#f6b8c8" ${O}/>
    <path d="M24 16v18M24 16l-3-5M24 16l3-5" ${O}/>`,
  songbird: `<path d="M10 28c0-9 6-15 14-15 6 0 10 4 10 9 0 9-8 14-16 14-5 0-8-3-8-8Z" fill="#a8cdeb" ${O}/>
    <path d="M34 20l7-1-6 5Z" fill="#f7cf6b" ${O}/><circle cx="29" cy="19" r="1.6" fill="#5d5249"/>
    <path d="M14 27c4-1 9 0 12 4-5 2-10 1-12-4Z" fill="#7fb0dc" ${O}/><circle cx="27" cy="25" r="2" fill="#f2b5b0" opacity=".8"/>`,
  blossom: `<rect x="5" y="8" width="38" height="32" rx="8" fill="#fde9ef" ${O}/>
    <path d="M10 40c4-8 8-14 18-22M20 30c4 0 8-2 10-4" fill="none" stroke="#a07c66" stroke-width="2.4"/>
    <g fill="#f6b8c8"><circle cx="28" cy="17" r="4"/><circle cx="34" cy="23" r="3.5"/><circle cx="20" cy="24" r="3.5"/><circle cx="31" cy="29" r="3"/></g>
    <g fill="#fff"><circle cx="28" cy="17" r="1.2"/><circle cx="34" cy="23" r="1"/><circle cx="20" cy="24" r="1"/></g>
    <rect x="5" y="8" width="38" height="32" rx="8" fill="none" ${O}/>`,
  // Golden Bloom
  'golden-crown': `<path d="M8 34 6 15l10 8 8-13 8 13 10-8-2 19Z" fill="#f5cf5e" ${O}/>
    <rect x="8" y="33" width="32" height="5" rx="2" fill="#e9b843" ${O}/>
    <circle cx="24" cy="25" r="3" fill="#f6b8c8" ${O}/><circle cx="15" cy="28" r="2" fill="#a8d8d6" ${O}/><circle cx="33" cy="28" r="2" fill="#c9b6e8" ${O}/>`,
  rainbow: `<rect x="5" y="8" width="38" height="32" rx="8" fill="#eef6fb" ${O}/>
    <g fill="none" stroke-width="3.2"><path d="M10 36a14 14 0 0 1 28 0" stroke="#f2a99a"/><path d="M13.5 36a10.5 10.5 0 0 1 21 0" stroke="#f7d79a"/><path d="M17 36a7 7 0 0 1 14 0" stroke="#b6dba3"/><path d="M20.5 36a3.5 3.5 0 0 1 7 0" stroke="#a8cdeb"/></g>
    <rect x="5" y="8" width="38" height="32" rx="8" fill="none" ${O}/>`,
};

/** Wrapped gift (shown before opening). */
const GIFT = `<rect x="9" y="20" width="30" height="20" rx="3" fill="#f6c6d4" ${O}/>
  <rect x="7" y="14" width="34" height="8" rx="3" fill="#f9d8e2" ${O}/>
  <path d="M24 14v26" stroke="#9aa6e0" stroke-width="4"/>
  <path d="M24 14c-6-8-12-4-8 0ZM24 14c6-8 12-4 8 0Z" fill="#9aa6e0" ${O}/>`;

function svg(markup: string, cls: string, label?: string): SVGSVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 48 48');
  el.setAttribute('class', cls);
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
  } else el.setAttribute('aria-hidden', 'true');
  el.innerHTML = markup; // static trusted markup
  return el;
}

export function keepsakeArt(itemId: string, opts: { locked?: boolean; label?: string } = {}): SVGSVGElement {
  return svg(ART[itemId] ?? '', `keepsake-art${opts.locked ? ' locked' : ''}`, opts.label);
}

export const giftArt = (label?: string) => svg(GIFT, 'keepsake-art gift-art', label);

/** Raw markup for drawing an item inside another SVG (e.g. worn by a companion). */
export const keepsakeMarkup = (itemId: string): string => ART[itemId] ?? '';

/** Exposed for tests: every catalog item must have art. */
export const hasArt = (itemId: string) => itemId in ART;
