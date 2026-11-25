---
name: launch-video
description: Create non-generic, human-studio viral SaaS & devtool launch videos directly from a product URL. Probed for real 2x Retina UI captures and brand DNA, staged inside a living atmospheric world with Apple Liquid Glass, transparent 3D dual comparison windows, optical macro camera pushes, pixel-mosaic wipes, 60 FPS lossless PNG rendering, and wide-stereo sidechained electronic audio (-14 LUFS) for $0.
---

# Launch Video — Human-Studio Viral Launch Film Pipeline

Generate studio-grade launch videos for SaaS products, devtools, and indie launches directly from a URL, engineered so **no viewer can guess it was AI-generated**.

## Flagship Style Selection (Default: `cinema-launch`)

| Style | When to pick | Visual & Audio Signature |
| :--- | :--- | :--- |
| **`cinema-launch`** *(FLAGSHIP DEFAULT)* | Viral X/Twitter launch films, Product Hunt hero trailers, design-forward AI/SaaS demos (Soar / Linear / Raycast caliber). | Living photographic daylight sky & editorial paper plates + film grain, chromatic scramble-decode opener, true Apple Liquid Glass frosted cards, 2.8x optical macro push + Bezier cursor click + spinner morph, transparent-alpha 3D dual Before/After macOS windows, split frosted-glass live strikethrough diff, pixel-mosaic & pill-portal wipes, 60 FPS lossless PNG pipe, wide-stereo `-14 LUFS` `anthem` soundtrack. |
| `macro-studio` | Minimalist architectural UI walkthroughs with voiceover script export (`--mode beats`). | Warm studio sand/carbon contrast, macro UI focus cuts, upgraded stereo `mix.py`. |
| `bento-proof` | Metric-heavy founder launches & proof grids. | Crisp bento metric cards, browser mockup staging. |
| `kinetic-noir` | High-contrast dark-mode developer tools & infra launches. | Deep matte noir canvas, sharp kinetic typography. |
| `problem-story` | Narrative pain-to-payoff SaaS explainers. | Story-driven problem/solution arc. |
| `terminal-launch` | CLI tools, SDKs, and developer APIs. | Authentic interactive terminal command typing + output proof. |

---

## Mandatory 6-Step Production Pipeline

### 1. Probe the Live Product (2x Retina Real Captures)
```bash
node scripts/probe.mjs <url> <out-dir> [--wait 1800] [--actions actions.json]
```
- Captures crisp **`deviceScaleFactor: 2`** (`2880×1800`) Retina PNGs into `assets/captures/` and extracts `data/brand.json` (palette, typography, SVG/PNG logo, live copy, proof metrics).
- **Zero fake UI rule**: Always capture real interactive product screens (including Before/After states via `--actions` or authentic product assets). Never show cookie banners, blurred paywall decoys, or placeholder Lorem text.

### 2. Generate 1–3 Text-Free Photographic Atmospheric Plates (`cinema-launch`)
Generate clean, **strictly text-free and UI-free** 16:9 photographic plates (e.g. sunlit morning sky/clouds, architectural cotton paper light, subtle brand-tinted optical prism) into `assets/ai/` and register them under `"aiImages"` in `data/brand.json` (`"skyDaylight"`, `"studioPaper"`, `"accentPrism"`). Never fall back to flat static fills or 2019 rainbow CSS bokeh blobs.

### 3. Scaffold the Project
```bash
node scripts/new_video.mjs cinema-launch <slug> --from <probe-dir> --aspect 16:9 --mode beats
```
Read `styles/cinema-launch/STYLE.md`, `references/growth-playbook.md`, and `references/motion-patterns.md` before writing `script.json` and `src/shots.js`.

### 4. Write `script.json` + Bespoke `src/shots.js`
- Follow the **Viral X Craft Launch Arc** (`references/growth-playbook.md`):
  1. **0.0–2.0s Chromatic Scramble-Decode Hook** (5-word punchy thesis on stark paper, zero cold logo spin, zero fluff).
  2. **2.0–5.5s Unified Sky World -> Brand Reveal -> Liquid Glass Prompt Macro Push (`2.8x`) + Bezier Cursor Click + Spinner Morph**.
  3. **5.5–12.5s Radial Evidence Fan -> Pill-Portal Mask Expand -> Real Interactive Mechanism Proof**.
  4. **12.5–22.5s Signature Dual 3D Angled Before/After Windows + Real-Time Scan Wipe + Split Frosted-Glass Live Diff**.
  5. **22.5–28.5s Beat-Locked 0.49s Kinetic Sprint -> Pixel-Mosaic Block Dissolve -> Annotated Workspace Callout Arrows**.
  6. **28.5–32.5s Stark Editorial Meta Endcard** (inline aspect-safe emblem + crisp URL).
- **Non-Negotiable Anti-Slop Copy & Craft Rules**:
  - ZERO em dashes (`—`), ZERO AI sparkles, ZERO SaaS clichés (*revolutionize, seamlessly, empower, unlock, supercharge, elevate, cutting-edge, streamline*).
  - Every `promptCapsule` returns exact `{ btnX, btnY, cardRect }` so `withCamera` and `macCursor` (on `bezier2` curves) hit the exact button pixel.
  - Every logo uses `drawContain` or `inlineEmblemSentence` (never squashed).

### 5. Build Timing, Cues & Studio `-14 LUFS` Stereo Audio
```bash
node scripts/py.mjs scripts/beats.py <project-dir>
node tools/capture.mjs check
node tools/capture.mjs cues
node scripts/py.mjs tools/mix.py <project-dir>
```
- `tools/mix.py` outputs true `48 kHz` wide-stereo `data/mix.wav` (`16.8 kHz` crisp air ceiling, sidechained supersaw pads, formant vocal motif, stereo ping-pong delay, algorithmic reverb, tactile Foley SFX, mastered to **`-14 LUFS` / `-1.0 dBTP`**).
- If supplying a real licensed music track (`"music": "audio/track.mp3"`), `mix.py` preserves **full true stereo** without mono downmixing.

### 6. Mandatory Dual-Gate Visual, Motion & Audio QA (NEVER SKIP!)
Before declaring ANY video done, run and inspect ALL FOUR checks:
1. **Contact Sheet (`0.5s` step)**:
   ```bash
   node tools/capture.mjs sheet review/all.jpg 0.5 6
   ```
2. **Full-Resolution Lossless PNG Keyframes** at every hero beat, macro zoom, 3D dual window, transition mid-frame, and endcard:
   ```bash
   node tools/capture.mjs frames review/keyframes "0.9,2.6,4.9,6.2,8.4,14.2,20.6,25.8,27.4,31.6"
   ```
   Open and visually inspect the contact sheet AND full-res PNGs. Verify zero clipping, zero text overlap, pixel-exact cursor clicks, crisp 2x Retina captures, and zero AI-slop tells.
3. **Final 60 FPS Lossless-Pipe H.264/AAC Render**:
   ```bash
   node tools/capture.mjs video renders/<slug>-16x9.mp4 --fps=60
   ```
   Verify the automated `QA:` telemetry printed by `capture.mjs`:
   - `1920x1080`, `60/1` fps, stereo `48000 Hz`, `mean_volume` between `-16 dB` and `-11.5 dB`, `max_volume <= -0.5 dB` (zero clipping).
4. **Watch the Rendered MP4**: Open/inspect the final `.mp4` (and run a ruthless Human-vs-AI Sniff Test). If ANY cut drags, looks synthetic, or misses a beat, iterate and re-render until it looks 100% hand-edited in After Effects / Cinema 4D.
