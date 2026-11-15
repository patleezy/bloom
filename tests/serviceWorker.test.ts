import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** The service worker was once emptied by accident, which silently removed offline support. */
describe('service worker', () => {
  const sw = readFileSync('public/sw.js', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  it('names its cache after the current version, so each release drops the old one', () => {
    expect(sw).toContain(`const VERSION = 'bloom-${pkg.version}';`);
  });
  it('handles install, activate and fetch', () => {
    for (const ev of ['install', 'activate', 'fetch']) expect(sw).toContain(`addEventListener('${ev}'`);
  });
  it('only serves same-origin GET requests', () => {
    expect(sw).toContain("req.method !== 'GET' || new URL(req.url).origin !== self.location.origin");
  });
});
