/**
 * Bloom's icon set: rounded strokes to match the characters. Static path data only.
 * Use icon('name') anywhere an emoji used to be.
 */
const PATHS = {
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
  sprout: '<path d="M12 20v-8"/><path d="M12 12c0-3.5-2.5-6-7-6 0 4 2.5 6 7 6Z"/><path d="M12 14c0-3 2.2-5 6-5 0 3.4-2.2 5-6 5Z"/>',
  sparkle: '<path d="M12 3c.6 4.6 1.8 5.9 6.5 6.5-4.7.6-5.9 1.9-6.5 6.5-.6-4.6-1.9-5.9-6.5-6.5C10.1 8.9 11.4 7.6 12 3Z"/><path d="M18.5 15.5c.2 1.6.7 2.1 2.3 2.3-1.6.2-2.1.7-2.3 2.3-.2-1.6-.7-2.1-2.3-2.3 1.6-.2 2.1-.7 2.3-2.3Z"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-.5 9-6 14-14 14Z"/><path d="M5 19 13 11"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.4-5.3 3.6-8.3.9 1.6 1.7 2.5 2.9 3.1-.2-2.6.7-5.1 2.6-6.6.5 3.3 4.4 5.8 4.4 11.1C19 18.4 16 21 12 21Z"/>',
  drop: '<path d="M12 3.5c3.3 4.2 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 2.7-6.8 6-11Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  close: '<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chevron: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M9 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  star: '<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/>',
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>',
  cloud: '<path d="M7.5 18a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17.6 9 4.5 4.5 0 0 1 17 18Z"/>',
  medal: '<path d="M8.5 3.5 12 9l3.5-5.5"/><circle cx="12" cy="14.5" r="5.5"/><path d="m12 12 .9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3Z"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  garden: '<path d="M4 20h16"/><path d="M7 20v-5M7 15c-2.2 0-3.2-1.6-3.2-3.5 2 0 3.2 1.4 3.2 3.5ZM7 15c0-2.4 1.3-3.8 3.4-3.8 0 2.1-1.3 3.8-3.4 3.8Z"/><path d="M16 20v-8"/><circle cx="16" cy="9" r="3"/>',
  heart: '<path d="M12 19.5s-7-4.3-7-9.4A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4Z"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function icon(name: IconName, cls = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', `icon icon-${name} ${cls}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = PATHS[name]; // static trusted markup
  return svg;
}
