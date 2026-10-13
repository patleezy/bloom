import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * WCAG 2.2 AA contrast guard. Reads the real tokens from styles.css so a palette tweak
 * that breaks accessibility fails the build. Text needs 4.5:1; UI parts (borders, the
 * progress fill, focus rings) need 3:1.
 */
const css = readFileSync('src/styles.css', 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`missing ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT: [string, string][] = [
  ['ink', 'bg'], ['ink', 'surface'], ['muted', 'bg'], ['muted', 'surface'],
  ['accent', 'bg'], ['accent', 'surface'], ['ink', 'accent-soft'], ['accent-ink', 'accent'],
  ['danger', 'bg'], ['danger', 'surface'],
];
const UI: [string, string][] = [
  ['border', 'bg'], ['border', 'surface'], ['accent', 'track'], ['ink', 'bg'],
  // Medal icons on their pastel badges
  ['cat-time-ink', 'cat-time'], ['cat-streak-ink', 'cat-streak'], ['cat-habit-ink', 'cat-habit'], ['cat-growth-ink', 'cat-growth'],
  ['muted', 'track'],
];

describe.each([
  ['light', block(':root {')],
  ['night', block(":root[data-theme='night']")],
  ['auto dark', block(":root:not([data-theme='light'])")],
])('%s theme meets WCAG AA', (_name, t) => {
  it.each(TEXT)('text %s on %s ≥ 4.5:1', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(UI)('UI %s on %s ≥ 3:1', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(3);
  });
});

describe('species tags meet WCAG AA', () => {
  it.each(['bloomling', 'cinder', 'ripple'])('%s tag text', (sp) => {
    const t = block(`.species-${sp} {`);
    expect(contrast(t['tag-ink'], t.tag)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('scene palettes meet WCAG AA', () => {
  const pastel = block('.running.scene-pastel {');
  const night = block('.running.scene-night {');
  const scenes: [string, Record<string, string>][] = [
    ['signature', { ...pastel, ...block('.running.scene-signature {') }],
    ['rain', { ...pastel, ...block('.running.scene-rain {') }],
    ['ocean', { ...pastel, ...block('.running.scene-ocean {') }],
    ['snow', { ...pastel, ...block('.running.scene-snow {') }],
    ['night', night],
  ];
  describe.each(scenes)('%s scene', (_name, t) => {
    // Text sits over the whole sky, so check both ends of its gradient.
    it.each([['ink'], ['muted'], ['accent']])('%s text on the sky', (fg) => {
      expect(contrast(t[fg], t['scene-bg'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t[fg], t['scene-deep'])).toBeGreaterThanOrEqual(4.5);
    });
    it.each([['ink', 'surface'], ['muted', 'surface'], ['accent-ink', 'accent']])('%s on %s', (fg, bg) => {
      expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
    });
    it('UI parts ≥ 3:1', () => {
      expect(contrast(t.border, t['scene-bg'])).toBeGreaterThanOrEqual(3);
      expect(contrast(t.accent, t.track)).toBeGreaterThanOrEqual(3);
    });
  });
});
