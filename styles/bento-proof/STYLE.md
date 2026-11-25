# Bento Proof — Editorial Swiss Grid + Social Proof + Price Anchoring

**Best for:** Re-launches, v2/Product Hunt launches, SaaS products replacing expensive enterprise suites, Waitlist -> GA rollouts, and landing pages rich with metrics, pricing tiers, or customer testimonials.
**Theme:** Architectural Swiss Light (`loadBrand('light')` on `#F4F4F7` neutral paper with crisp elevated white Bento cells, vivid brand accent highlights, and `FreeMono` stat labels).
**Audio Mode:** **Voice-Free Kinetic Beat Mode** (`118 BPM` + `"music": "upbeat"` grooved percussive cuts) OR **Narrated Mode**.

## Narrative Beat Grammar (22–26s)
1. **S01 · HERO RESULT HOOK (0–4s):** Bold Swiss grid headline + live animating sparkline + key outcome number (`$1,420 MRR Saved / mo`) — leads with **the outcome**, not features.
2. **S02 · MULTI-CELL LIVE BENTO DASHBOARD (4–8.5s):** 4-cell asymmetric Swiss Bento assembling on musical beats, pairing real scraped UI (`ui-showcase`) inside a Bento cell alongside live animated rolling counters.
3. **S03 · REAL PRODUCT WORKFLOW & FOCUS (8.5–13s):** Full clean browser frame (`desktop-hero` / `ui-showcase`) with `cursor` click triggering a `spotlight` zoom over the core win-back playbook.
4. **S04 · FOUNDER QUOTE + STRIKETHROUGH PRICE ANCHOR (13–18.5s):** Side-by-side **Verified Customer Proof (`quoteCard`)** + **Price Anchoring (`priceAnchorCard`)** literally slashing a bloated competitor stack (`$248/mo`) down to one transparent indie tier (`$19/mo`).
5. **S05 · CONVERSION CTA ENDCARD (18.5–24s):** Brand emblem + risk-reversal hook ("14-day free trial · Zero card") + button click.

## Core Motion Kit (`src/core/kit.js`)
- `swissGridBg(t, { pulse })` — Clean `#F4F4F7` architectural sheet with subtle `48px` hairline grid rules.
- `bentoTile({ x, y, w, h, label, value, sub, accent, dark, spark, sparkP, sparkColor, img, clock, glyph, chip, scale })` — Unified Bento tile supporting numbers, animated sparklines, integrated `clockDial` timers, crisp `drawGlyph` icons (`clock`, `chain`, `trophy`, `swords`, `check`), OR clipped real UI screenshots.
- `clockDial({ cx, cy, r, hour, min, sec, sweepFrac, accent, dark })` & `clockPill({ x, y, clockText, sweep, dark })` — Tactile analog watch dial & digital readout pill for real elapsed time, SLAs, or countdowns (replaces fake pulse dots).
- `typeUrlBar({ x, y, w, typed, caret, btnText, pressed, scale })` — Interactive keystroke-typing input bar synced to `type` SFX + click button squish.
- `rankFeed({ x, y, w, h, scrollP, rows, header, scale })` — Interactive scrolling leaderboard feed contrasting sponsored slots against organic discovery pain.
- `duelCard({ x, y, w, h, leftTitle, rightTitle, leftImg, rightImg, leftShare, duelP, clockText, sweep, dark, scale })` — Live 1v1 showdown stage with real product cards, `VS` badge, vote split bar, and ticking `clockPill`.
- `aiPlate(img, { x, y, w, h, zoom, panX, panY, veil, scale })` — Framed bespoke `B.ai.*` illustration plate with Ken Burns motion & optional legibility veil.
- `quoteCard({ x, y, w, h, quote, author, role, resultPill, scale })` — Authentic editorial quote with verified outcome badge (no cheesy 5-star clip-art).
- `priceAnchorCard({ x, y, w, h, header, oldItems, oldTotal, newPrice, newNote, strikeT, scale })` — Animated diagonal slash across legacy tool costs before springing in the simple price.
- `browserFrame`, `cursor`, `kineticTitle`, `badge` (`dot = false`, `icon`), `drawGlyph`, `ctaEndcard`.
