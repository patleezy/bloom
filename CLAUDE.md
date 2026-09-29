# Bloom: notes for Claude

Gentle, mobile-first focus timer where focus time grows a companion. Vite + TypeScript, no framework.
Read **ROADMAP.md** for what's shipped, what's next, and open decisions.

## Commands
- `npm test`: Vitest (includes the WCAG contrast guard in tests/contrast.test.ts)
- `npm run build`: typecheck + production build (adds a strict CSP)
- `npm run dev` / `npm run preview`

## Workflow
- Work on the designated branch; before starting a new PR, sync it to `origin/main` after the previous PR merged.
- One feature per PR. In each PR: bump `package.json` version, add an entry to `src/changelog.ts` **and** `CHANGELOG.md` (a test keeps them in sync), bump `VERSION` in `public/sw.js`, update ROADMAP.md.
- Verify before pushing: `npm test`, `npm run build`, and a browser pass for UI changes (Playwright with `executablePath: '/opt/pw-browsers/chromium'`; use `bypassCSP: true` to inject axe-core).

## Architecture
- `src/logic/`: pure rules (growth, streak, timer, dates)
- `src/domain/`: types, SessionService, medals (derived from history, never stored), breaks, evolution, stats
- `src/state/`: `BloomRepository` interface + `LocalRepository` (localStorage, schema-versioned with migrations in `migrate()`; parse all stored data as untrusted), device prefs
- `src/companion/`: species registry, SVG art (`render.ts`), activities, tap reactions
- `src/screens/`: one file per screen; `src/main.ts` wires navigation
- `src/copy.ts`: all user-facing text

## Rules
- Never insert user text as HTML; use `h()` from `src/dom.ts` (text nodes only). SVG templates contain numbers only.
- No new third-party network requests or scripts without the owner's decision; update CSP in `vite.config.ts` and `vercel.json` if one is approved.
- Colors: add tokens to `styles.css` and cover text/UI pairs in tests/contrast.test.ts. Tap targets ≥44px.
- Tone: warm, short, never guilt. No emoji as icons; use `src/icons.ts`.
- Data changes: bump `SCHEMA_VERSION`, add a migration step, add a migration test.

## Adding a species
1. `SpeciesId` in `src/domain/types.ts` and the allow-list in `src/state/localRepository.ts`.
2. Entry in `SPECIES` (+ `SPECIES_ORDER`, `unlockMedal` if unlockable) in `src/companion/species.ts`.
3. Art function in `src/companion/render.ts` (+ `PARTS`), an activity prop in `props()`.
4. Activities in `src/companion/activities.ts`, running lines and `ambientHelp` in `src/copy.ts`, a scene in `src/audio/ambient.ts`.
5. `.species-<id>` palette and activity CSS in `src/styles.css`.
6. Set `available: true` on its `UNLOCKABLES` entry in `src/domain/medals.ts`.
7. Tests for locked/unlocked adoption; render all six stages and check them visually.
