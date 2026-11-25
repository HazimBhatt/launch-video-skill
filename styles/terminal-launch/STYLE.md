# Terminal Launch — DevTool / CLI / SDK Launch Style

**Best for:** CLI tools, developer SDKs, APIs, observability platforms, databases, local-first dev tools, open-source launches (Show HN, X/Twitter dev community, GitHub README videos).
**Theme:** Deep Phosphor Carbon (`loadBrand('dark')` with high-contrast brand accent & emerald/amber ANSI tokens).
**Audio Mode:** **Narrated Mode** (`voice: "am_puck"` + Whisper word-synced captions, `"music": "pulse"`) OR **Beats Mode** (`128 BPM`).

## Narrative Beat Grammar (22–28s)
1. **S01 · THE BOILERPLATE PAIN (0–4s):** Live animated **`codeDiff`** showing 24+ lines of brittle boilerplate / curl / debug noise (`-`) striking through cleanly as you announce the problem.
2. **S02 · THE 3-LINE / 1-COMMAND FIX (4–8s):** Animated **`terminalWindow`** typing the exact CLI install/init command (`typeText`) with streaming ANSI output (`✓ Connected`, latency, trace IDs) synced to mechanical `type` + `chime` SFX.
3. **S03 · REAL WEB CONSOLE REVEAL (8–14s):** Split pane or 3D -> 2D cut (`LOUT.pane('left')` + `LOUT.pane('right')`) combining live terminal telemetry beside the probed **real product UI capture** inside `browserFrame`, driven by `cursor` click + `spotlight` zoom.
4. **S04 · LATENCY / COST PROOF (14–19s):** Crisp animated **`benchmarkBars`** + **`bentoCard`** metrics showing real benchmark speedup (`1.8ms` overhead vs `140ms`, `$0` egress, etc.).
5. **S05 · CONVERSION CTA ENDCARD (19–25s):** Brand logo + punchy closing hook + interactive copyable install command pill (`npx ...`) + glowing CTA button + cursor click.

## Core Motion Kit (`src/core/kit.js`)
- `terminalGridBg(t, { pulse })` — Carbon slate canvas + faint terminal coordinate grid + brand glow.
- `terminalWindow({ x, y, w, h, title, lines, lt, cps, scale, alpha })` — macOS terminal frame with progressive line typing (`cmd`), instant color-coded stdout (`ok`, `warn`, `muted`, `accent`), and blinking cursor.
- `codeDiff({ x, y, w, h, title, leftLabel, rightLabel, beforeLines, afterLines, swapT, scale })` — Shows messy legacy integration dissolving into the crisp 3-line SDK replacement.
- `browserFrame(img, opts)` — Real UI capture with `zoom`, `panX`, `panY`, `spotlight: [u, v, rw, rh, alpha]`, `sheenT`.
- `benchmarkBars({ x, y, w, title, bars, p })` — Animated comparison bars with hard unit labels.
- `bentoCard`, `badge`, `kineticTitle`, `cursor`, `ctaEndcard`.

## Responsive Rules (`16:9` & `9:16`)
- Always use `LOUT.pane('left')` / `LOUT.pane('right')` and `PORTRAIT` checks so split Terminal + Browser UI stacks vertically in `9:16` without clipping code lines (`wrap` or `maxW` auto-fit on monospaced font sizes).
- Keep code snippets inside `terminalWindow` to `<= 42` chars per line in `9:16` (or scale font via `U`).
