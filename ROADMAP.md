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

## Next up (in order)
1. **Collectibles (cosmetics)**: every session of 5+ minutes ends with a gift to open. Themed rarities: **Seed, Sprout, Bloom, Golden Bloom**. Longer sessions improve odds; a guaranteed rare at least every 10 sessions; duplicates become Sparkles to pick a specific item. Drops are derived from session history (seeded by session id, so they can't be rerolled). No retroactive gifts (no existing users). Never sell randomness. PR A (gifts + Keepsakes book) shipped in 0.17. PR B (next): wearing items, little friends, backgrounds.
2. **Opt-in analytics**: Vercel Web Analytics, cookieless, opt-in during onboarding and in Settings. Analytics is enabled in Vercel (Hobby). Add the endpoint to CSP `connect-src` only.
3. **Weekly recap card**: shareable image generated on the device (minutes, medals, companion).
4. **Floating mini-companion**: Document Picture-in-Picture, desktop Chrome and Edge only.
5. **Launch prep**: trademark check for BloomyBuds, store screenshots, real-phone testing.
6. **More species** (optional, ongoing): follow "Adding a species" in CLAUDE.md. Each needs a new medal or reuses one as its unlock. Ideas: a crystal/gem friend (100 hours), a star friend (30-day streak).

## Later (needs a backend)
Accounts and sync (code is already behind a `BloomRepository` interface), reminders via push, focus rooms with friends, optional paid tier (extra species, cosmetics, scenes; growth always free). Follow the pre-backend checklist in SECURITY.md.

## Decisions made
- Encouragement, never punishment: nothing dies, medals are never lost, ending early still counts.
- Growth thresholds: 0 / 25 / 150 / 500 / 1200 / 2500 minutes. Sessions under 5 min don't count.
- Keepsake odds (percent Seed/Sprout/Bloom/Golden): 60/28/10/2 under 25 min, 50/32/15/3 for 25–49, 40/35/20/5 for 50+. Duplicates give 1/3/8/20 Sparkles; picking costs 5/15/40/100. The odds and the catalog are in `src/domain/keepsakes.ts`; changing them changes what unopened gifts contain.
- Gifts only count sessions after the v6 migration (`keepsakes.giftsFrom`); fresh installs start at 0.
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
