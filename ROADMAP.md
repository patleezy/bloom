# Bloom roadmap

Living plan for Bloom. Update it in the same PR whenever something ships or a decision changes.
A new Claude Code session should read this first.

## Shipped
| Version | PR | What |
|---|---|---|
| 0.1–0.3 | #1 | Timer, growth, streaks with weekly grace day, 3 starters, onboarding, Night theme, PWA, backups |
| 0.4 | #1 | Companion activities, What's new log, logo, share image |
| 0.5 | #1 | Focus list (3 items), 60s away grace period, petting, fonts and icons, voice pass |
| 0.6 | #2, #3 | Ambient sound, breaks, Kindle renamed to Cinder, tap reactions, outlined buttons |
| 0.7 | #4 | Evolution path (stage silhouettes) |
| 0.8 | #5 | Pastel palette, WCAG 2.2 AA, CI, Dependabot, SECURITY.md |
| 0.9 | #9 | 16 medals (derived from history), unlock teasers |
| 0.10 | #10 | Several companions, garden, "Who's joining you?" picker |
| 0.11 | #11 | Moss (unlocked by Ten Hours) |
| 0.12 | #12 | Nimbus (unlocked by a 7-day streak), ROADMAP.md and CLAUDE.md |
| 0.13 | #13 | Lumi (unlocked by Night Owl); all three announced friends shipped |
| 0.14 | #15, #16 | Renamed to **BloomyBuds** on bloomybuds.app: SEO title and description, canonical URL, structured data, robots.txt, sitemap, logo, share image; CI audit fix |
| 0.15 | — | Scenes: ‹ › sound picker with matching backgrounds (signature, Rain, Night sky, Ocean, Snowfall, Silence); recorded loops in public/sounds |
| 0.16 | #18 | Scenes art pass: Ghibli-pastel skies with their own text palettes, seamless loops (fixed rain stutter) |
| 0.17 | — | Collectibles PR A: a gift after each 5+ min session (derived from history, seeded by session id), 24 keepsakes in 4 rarities, pity every 10, duplicates → Sparkles to pick items, Keepsakes book; schema v6 |
| 0.18 | — | A garden to grow: a meadow backdrop on home and in the garden; every counted session plants a flower, bush (50+ min) or tree (90+ min), derived from history; older plants merge upward; no schema change |
| 0.19 | — | Collectibles PR B1: little friends and backdrops appear in the meadow; toggles in Keepsakes; schema v7 (`keepsakes.away`, `keepsakes.backdrop`). Also restored the service worker (emptied by accident in 0.7), with a test that keeps its cache name on the package version |

## Next up (in order)
1. **Tap a plant to see its session**: in the meadow, tapping one of the newest plants shows the session it came from (day, minutes, focus items). Recommended before B2 because it makes the meadow a personal record rather than decoration. Derived from history; nothing new stored, nothing leaves the device. Focus-item text must go through `h()`. Merged older plants have no single session, so decide what tapping them shows (for example a count).
2. **Collectibles (cosmetics)**: every session of 5+ minutes ends with a gift to open. Themed rarities: **Seed, Sprout, Bloom, Golden Bloom**. Longer sessions improve odds; a guaranteed rare at least every 10 sessions; duplicates become Sparkles to pick a specific item. Drops are derived from session history (seeded by session id, so they can't be rerolled). No retroactive gifts (no existing users). Never sell randomness. PR A (gifts + Keepsakes book) shipped in 0.17. PR B1 (friends and backdrops in the meadow) shipped in 0.19. PR B2 (next): wearing items, which need a fit on each species at each stage.
3. **Opt-in analytics**: Vercel Web Analytics, cookieless, opt-in during onboarding and in Settings. Analytics is enabled in Vercel (Hobby). Add the endpoint to CSP `connect-src` only.
4. **Weekly recap card**: shareable image generated on the device (minutes, medals, companion).
5. **Floating mini-companion**: Document Picture-in-Picture, desktop Chrome and Edge only.
6. **Launch prep**: trademark check for BloomyBuds, store screenshots, real-phone testing.
7. **More species** (optional, ongoing): follow "Adding a species" in CLAUDE.md. Each needs a new medal or reuses one as its unlock. Ideas: a crystal/gem friend (100 hours), a star friend (30-day streak).

## Art direction: making it feel hand-made
Open ideas from the 0.18–0.19 review. The app currently reads as generic: round symmetric shapes, pastel gradients, rounded fonts, perfect geometry. None of these are decided; the first and third need the owner.
1. **The owner's hand in the art**: the owner sketches the companions on paper and the lines get traced, instead of perfect ellipses. Wobble and asymmetry do the most here.
2. **The meadow as a real record**: see "Tap a plant" in Next up.
3. **A point of view per companion**: a temperament that shows in its running lines and behavior (for example Cinder impatient, Moss slow and literal), written by the owner.
4. **Drop borrowed game framing**: rarity tiers, Sparkles and pity counters come from gacha games. Consider a plainer rule such as "every tenth session brings something special". This changes `src/domain/keepsakes.ts` and what unopened gifts contain, so it needs its own decision.
5. **Lean into the stance**: no accounts, no tracking, nothing dies. Say it plainly in onboarding and copy.
6. **Small odd details**: like the pebble friend that never moves. A few choices like that, chosen by the owner.

Smaller follow-ups from the same review:
- Scenes during a session are flat gradients: give them a horizon and ground, and let the companion react (umbrella in Rain, scarf in Snowfall). The Ocean hill currently cuts through the timer digits and the Night sky moon overlaps the ring.
- Tint the meadow by time of day from the device clock.
- Medal icons repeat (four streak medals share a flame, two hour medals share a star); early growth stages look alike at small sizes.
- The meadow stops changing past 8 merged trees (about 200 older sessions); add a further tier.
- On home, the lily pond and picnic blanket can sit partly behind companions.
- Keepsakes opens gifts one at a time; add "open all" for a stack.

## Later (needs a backend)
Accounts and sync (code is already behind a `BloomRepository` interface), reminders via push, focus rooms with friends, optional paid tier (extra species, cosmetics, scenes; growth always free). Follow the pre-backend checklist in SECURITY.md.

## Decisions made
- Encouragement, never punishment: nothing dies, medals are never lost, ending early still counts.
- Growth thresholds: 0 / 25 / 150 / 500 / 1200 / 2500 minutes. Sessions under 5 min don't count.
- Keepsake odds (percent Seed/Sprout/Bloom/Golden): 60/28/10/2 under 25 min, 50/32/15/3 for 25–49, 40/35/20/5 for 50+. Duplicates give 1/3/8/20 Sparkles; picking costs 5/15/40/100. The odds and the catalog are in `src/domain/keepsakes.ts`; changing them changes what unopened gifts contain.
- Gifts only count sessions after the v6 migration (`keepsakes.giftsFrom`); fresh installs start at 0.
- Meadow: derived from history like medals (`src/domain/meadow.ts`). The newest 12 sessions are their own plants; older ones merge 5 flowers → 1 bush, 5 bushes → 1 tree, up to 8 trees. Nothing wilts or disappears.
- Owned little friends are out in the meadow by default; the user can tuck one away. One backdrop at a time. Only these choices are stored; whether an item is owned is always re-derived.
- All three starters are free. Unlockables (Moss, Nimbus, Lumi, future species) need a medal.
- Each companion grows separately; streaks and medals are account-wide.
- The start screen asks "Who's joining you?" every session.
- Pastel palette on surfaces; text always meets WCAG AA (enforced by tests/contrast.test.ts).
- No third-party network requests without an explicit decision. Fonts are bundled.
- One PR per feature; bump version and changelog in each.

## Waiting on the owner
- **Enable Vercel Analytics** before the analytics PR.
- Turn on GitHub private vulnerability reporting (Settings → Advanced Security) if not done.
- Add bloomybuds.app in Vercel → Project → Settings → Domains, and set the repo's default branch to `main`.
