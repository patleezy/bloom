# Bloom

A gentle, mobile-first focus timer. Staying present grows a small plant companion through six stages.
It encourages focus rather than enforcing it: no app blocking, no guilt.

## Run
```sh
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # static site in dist/ (strict CSP added)
```

## How it works
- **Growth:** cumulative focus minutes → Seed 0 · Sprout 60 · Sapling 300 · Bud 900 · Bloom 2000 · Elder Bloom 4000.
  Sessions under 5 minutes are recorded but don't add growth. Ending early still credits minutes focused.
- **Streak:** consecutive days with a counted session; one missed day per 7 is forgiven.
- **Honest timer:** pauses when the tab is hidden and resumes on return. A reload restores the session paused.

## Architecture (built to grow a backend)
```
src/
  logic/        pure rules: growth, streak, timer, dates (no DOM, no storage)
  domain/       types (API-shaped, UUID, append-only records), stats, SessionService
  state/        BloomRepository interface + LocalRepository (localStorage, validated, versioned)
  companion/    SVG companion art
  screens/      home, start, running, end
  copy.ts       all user-facing text
```
- UI → `SessionService` → `BloomRepository`. To add a backend, implement `BloomRepository`
  (e.g. `ApiRepository`, or a sync wrapper around `LocalRepository`) and swap it in `main.ts`.
- Growth totals and streaks are **derived** from session history, so server and client agree.
- Stored data has a `schemaVersion`; add migration steps in `localRepository.ts#migrate`.

## Privacy & security
- No network requests, analytics, third-party scripts, or fonts. Production CSP sets `connect-src 'none'`.
  When a backend is added, allow only its origin there.
- User text is rendered via text nodes only (never `innerHTML`); stored data is validated and size-limited on load.
- "Clear my data" wipes everything from the device.
