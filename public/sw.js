/**
 * Offline support. Caches only BloomyBuds' own files (same origin, GET). It never touches or
 * caches user data, which lives in localStorage. VERSION must match package.json
 * (tests/serviceWorker.test.ts checks it), so every release drops the old cache.
 */
const VERSION = 'bloom-0.20.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './logo.svg'];

/** These are static files, the same for everyone, so a Vary header must not cause a cache miss. */
const STATIC = { ignoreVary: true };

/** Only complete, same-origin responses are worth keeping (no partial or opaque ones). */
const cacheable = (res) => res.status === 200 && res.type === 'basic';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    // Also keep the script and stylesheet the page needs, so the app opens offline after one visit.
    const html = await (await cache.match('./index.html')).text();
    const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[\w.-]+)"/g)].map((m) => m[1]);
    await cache.addAll(assets);
    // And the fonts the stylesheet points to (five small files), so offline looks the same.
    for (const sheet of assets.filter((a) => a.endsWith('.css'))) {
      const css = await (await cache.match(sheet)).text();
      await cache.addAll([...css.matchAll(/url\(\.\/([\w.-]+\.woff2)\)/g)].map((m) => `./assets/${m[1]}`));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Pages: network first so updates arrive, cache as the offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (cacheable(res)) {
            const copy = res.clone();
            event.waitUntil(caches.open(VERSION).then((c) => c.put('./index.html', copy)));
          }
          return res;
        })
        .catch(() => caches.match('./index.html', STATIC).then((hit) => hit || Response.error())),
    );
    return;
  }

  // Assets (hashed filenames, fonts, sounds): cache first.
  event.respondWith(
    caches.match(req, STATIC).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (cacheable(res)) {
          const copy = res.clone();
          event.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)));
        }
        return res;
      })),
  );
});
