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
| 0.13 | — | Lumi (unlocked by Night Owl); all three announced friends shipped |

## Next up (in order)
1. **Scenes**: sound picker (‹ ›) during sessions with matching animated backgrounds. Scene 1 is the companion's signature sound; shared scenes: Rain, Night sky, Ocean, Snowfall, Silence. **Blocked on sound files from the owner** (see below).
2. **Opt-in analytics**: Vercel Web Analytics, cookieless, opt-in during onboarding and in Settings. Owner must enable Analytics in the Vercel dashboard first. Add the endpoint to CSP `connect-src` only.
3. **Earned cosmetics**: hats, pots, backgrounds unlocked by focus minutes or medals; some Scenes become unlockables. Largest art effort.
4. **Weekly recap card**: shareable image generated on the device (minutes, medals, companion).
5. **Floating mini-companion**: Document Picture-in-Picture, desktop Chrome and Edge only.
6. **Launch prep**: final name (leaning **BloomBuds**; check USPTO and domains), rename throughout, store screenshots, real-phone testing.
7. **More species** (optional, ongoing): follow "Adding a species" in CLAUDE.md. Each needs a new medal or reuses one as its unlock. Ideas: a crystal/gem friend (100 hours), a star friend (30-day streak).

## Later (needs a backend)
Accounts and sync (code is already behind a `BloomRepository` interface), reminders via push, focus rooms with friends, optional paid tier (extra species, cosmetics, scenes; growth always free). Follow the pre-backend checklist in SECURITY.md.

## Decisions made
- Encouragement, never punishment: nothing dies, medals are never lost, ending early still counts.
- Growth thresholds: 0 / 25 / 150 / 500 / 1200 / 2500 minutes. Sessions under 5 min don't count.
- All three starters are free. Unlockables (Moss, Nimbus, Lumi, future species) need a medal.
- Each companion grows separately; streaks and medals are account-wide.
- The start screen asks "Who's joining you?" every session.
- Pastel palette on surfaces; text always meets WCAG AA (enforced by tests/contrast.test.ts).
- No third-party network requests without an explicit decision. Fonts are bundled.
- One PR per feature; bump version and changelog in each.

## Waiting on the owner
- **Sound files for Scenes** (pixabay.com/sound-effects, free, MP3, 30–120 s, seamless loop, no voices or music): gentle rain, night crickets, calm ocean waves, soft winter wind, forest birds morning, fireplace crackling, small stream.
- **Final name** (BloomBuds?) before the recap card and launch prep.
- **Enable Vercel Analytics** before the analytics PR.
- Turn on GitHub private vulnerability reporting (Settings → Code security) if not done.
