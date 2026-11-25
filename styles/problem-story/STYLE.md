# Problem Story — Founder Narrative Pitch (Warm Editorial + Visual Storytelling)

**Best for:** Indie SaaS products, productivity workflows, AI copilots, creator/agency tools, micro-SaaS founders pitching directly on X/Twitter, Product Hunt, LinkedIn, or landing page hero sections.
**Theme:** Warm Editorial Stone (`loadBrand('light')` on `#F7F5EE` warm canvas with crisp `#111827` ink, brand accent, and `Caladea-Bold` serif italic highlights).
**Audio Mode:** **Narrated Mode** (`voice: "af_heart"` or user voiceover + Whisper word captions, `"music": "upbeat"` marimba groove) OR **Beats Mode** (`114 BPM`).

## Narrative Beat Grammar (24–28s)
1. **S01 · THE HUMAN CHAOS SCENE (0–4.5s):** Tactile flat-vector storytelling (`chaosDeck`) showing what the founder/customer actually suffers through right now (e.g., 11:48 PM clock, messy spreadsheet tabs, overdue Slack pings) before literally popping apart!
2. **S02 · THE "BEFORE -> AFTER" WIPE (4.5–9.5s):** Real **light/clean UI capture** revealed via a spring-physics draggable vertical slider (`splitCompare`) wiping chaotic raw data into the finished result.
3. **S03 · REAL PRODUCT WORKFLOW + POINTER ANNOTATIONS (9.5–15.5s):** Crisp `browserFrame` walking through the core workflow with cursor click, UI spotlight focus, and hand-drawn-style crisp callout pills (`pointerTag`).
4. **S04 · TIME & MONEY RELIEF METRICS (15.5–20s):** Tactile visual "Old Friday vs New Friday" comparison cards + quantified weekly hours/dollars saved (`bentoCard`).
5. **S05 · WARM FOUNDER CTA ENDCARD (20–26s):** Brand logo + human value tagline + crisp pill button & cursor click (anchored above the bottom caption band).

## Core Motion Kit (`src/core/kit.js`)
- `paperBg(t, { pulse })` — Warm `#F7F5EE` stone canvas + subtle radial brand wash + delicate drafting grid.
- `editorialTitle(lines, opts)` — Combines bold geometric `Inter Black` with warm italic `Caladea` serif emphasis for `*words*`.
- `chaosDeck({ cx, cy, t, items, popT })` — Overlapping tilted sticky-alerts, spinning late-night clock badge, and scattered tab cards that visibly clutter and slide aside.
- `splitCompare(beforeFn, afterImg, { x, y, w, h, splitT, beforeLabel, afterLabel })` — Interactive draggable divider comparing raw messy chaos vs crisp scraped UI capture!
- `pointerTag(x, y, tx, ty, label, p)` — Clean elbow connector + floating annotation pill highlighting real UI details.
- `browserFrame`, `cursor`, `bentoCard`, `badge`, `ctaEndcard`.
