import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_VERSION, CHANGELOG } from '../src/changelog';

describe('changelog', () => {
  it('matches package.json and lists the current version first', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(APP_VERSION).toBe(pkg.version);
    expect(CHANGELOG[0].version).toBe(APP_VERSION);
  });
  it('is mirrored in CHANGELOG.md', () => {
    const md = readFileSync('CHANGELOG.md', 'utf8');
    for (const r of CHANGELOG) expect(md).toContain(`## ${r.version}`);
  });
});
