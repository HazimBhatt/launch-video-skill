# `macro-studio` Style Guide (Apple / Base44 Rapid Macro Film)

High-velocity, single-focus studio motion system alternating **Warm Alabaster Sand (`#EFECE6`)**, **Matte Carbon (`#161719`)**, **Luminous Soft Bokeh (`bokehMeshBg`)**, and **Edge-to-Edge Full-Bleed UI (`macroStageBleed`)** over crisp 1.3s-2.6s beats (12-16 scenes). Built natively for **SFX-only video + external voiceover script** (`"music": "none"` -> balanced Foley mix + `data/voiceover-script.md`).

## When to Pick `macro-studio`
- Default flagship pick when a founder wants **studio launch-trailer craft** (Base44 / Linear / Apple-keynote feel) with rapid dopamine pacing (`30-50s`) and zero cramped multi-box dashboard clutter.
- Ideal when recording/generating the voiceover on an external tool (ElevenLabs / mic) and dropping it onto a crisp tactile SFX-only master video.

## Choreography & Pacing Rules
1. **1 Focus Per Screen:** Never stack 3-4 boxes onto a single frame. Center ONE unmistakable subject (prompt box, macro file tree, full-bleed UI zoom, floating action card, terminal command, or solitary button) inside generous negative space.
2. **Short Punchy Beats (`1.3s-2.6s`):** Keep each `script.json` line to `2-6` spoken words (`beats: 3..6` @ `122-128 BPM`). Every visual cut must happen on a concrete micro-action (keystroke finish, cursor click, blur smear, or light->dark contrast flip).
3. **Atmosphere Contrast Rhythm:** Alternate light sand -> full-bleed product UI -> soft iris bokeh -> matte carbon `#161719` terminal/code/shield matrix -> solitary publish button -> expanding hairline capsule endcard.
4. **Zero Slop Rule:** Never use circular pulse dots (`dot: true`), ✨ sparkles, unnecessary abstract AI plinth renders when real clean UI fits better, or filler SaaS buzzwords. When time appears, drive an authentic `clockDial` hand sweep or live countdown.
5. **Studio Typography (`DM Sans` / `Inter` + `JetBrains Mono`):** Always bundle modern offline `.woff2` geometric sans (`DM Sans` / `Inter` weights `500–700`, tight `-0.03em` display tracking) paired with `JetBrains Mono` (`500–700`) — never fall back to Windows `Segoe UI` or retro GNU `FreeMono`.

## Kit Primitives (`src/core/kit.js`)
- `sandBg(t, { skyHorizon })` — Warm `#EFECE6` studio background with optional lower sky fade for publish lockup.
- `carbonBg(t, { glow })` — Deep matte carbon `#161719` studio background.
- `bokehMeshBg(t, { colors })` / `velocitySmear(p, { colors })` — Fast luminous gradient aurora & horizontal motion-blurred streak transitions.
- `scatterSyntaxCloud({ headline, sub, tokens, lt, disperse })` — Opener: centered clean sans phrase surrounded by orbiting syntax/proof nodes that disperse cleanly.
- `solitaryPromptCard({ typed, placeholder, caret, pressed, btnText, glyph, lt })` — Centered white studio input bar with real line-wrapping keystrokes + dark `[→]` button press.
- `macroFileTree({ rows, scrollY, activeIdx, lt })` — Oversized clean architectural hierarchy sliding upward with opacity taper.
- `morphConnector({ leftText, rightText, glyph, openP, lt })` — Centered node popping open horizontally into two crisp black-bordered pill capsules.
- `macroTimelineScrub({ columns, lanes, scrubP, zoom })` — Oversized horizontal timeline/queue scrub with smooth camera zoom.
- `macroStageBleed(img, { zoom, panX, panY, cover, displayText, scrim, radius, inset, card, portraitCard, crop, desktopCrop, bg })` — Edge-to-edge or shadow-framed real screenshot / visual card (`card: true, cover: false` + normalized `crop` / `desktopCrop` gives crisp zero-clipping UI framing in both `16:9` and `9:16`; `portraitCard: true` enables card framing on `9:16` only).
- `floatingPhoneStage({ img, zoom, panY, timerText, statText, statLabel, t, lt })` — Sleek matte mobile mockup floating over aurora bokeh with crisp live stats.
- `terminalTypeScreen({ tokens, typedChars, caret, lt })` / `codeEditorSlab({ lines, highlightIdx, lt })` — High-contrast carbon syntax typing and dark zoomed code lines.
- `scanGridOverlay({ img, crop, metricVal, metricLabel, scanTag, calloutBottom, scanP, lt })` — Hairline architectural grid + contain-fitted macro UI plate (zero sliced cards) + active sweeping scan line.
- `floatingActionModal({ title, pillText, warnText, rowText, btnText, btnPressed, t, lt })` — Centered card over glowing bokeh returning `{ btnX, btnY }` for razor-sharp cursor click targeting.
- `matrixGrid({ cols, rows, waveP, glyph, activeColor, lt })` — Geometric vector outline shield/verified grid lighting diagonally.
- `solitaryPublishBtn({ label, pressed, skyHorizon, lt })` — Solitary black CTA pill over serene empty canvas before the showcase burst.
- `capsuleEndcard({ lt, tagline, splitAt })` — Clean brand wordmark slide -> expanding `2.6px` hairline capsule pill around final punchline & domain.
