# Studio Motion, Camera & Transition Reference (`cinema-launch`)

Every primitive documented here exists and is verified inside `styles/cinema-launch/example/src/core/kit.js` and `engine3d.js`.

## 1. Camera & Depth Principles
- **Optical Macro Push (`K.withCamera`)**: Anchor `focusX, focusY` directly on the exact `{ btnX, btnY }` returned by `K.promptCapsule(...)`. Push `zoom: 1.0 -> 2.85` with `eio(...)` while scaling background plate zoom at ~`0.25x` rate for physical foreground/background parallax.
- **Opt-In Cut Energy (`shot.punch`)**: Never apply a uniform zoom thump to every shot. Keep `punch: 0` on breathing sky/editorial shots and reserve `punch: 0.035–0.05` strictly for rapid 1-beat sprint cuts (`S12A–D`).
- **Curved Human Pointer Motion (`bezier2` + `K.macCursor`)**: Never slide cursors on linear straight tracks. Use quadratic Bezier arcs with natural deceleration (`eo`) and switch `kind: 'arrow' -> 'pointer'` as the cursor arrives over a button.

## 2. Verified `kit.js` Primitives (`styles/cinema-launch/example/src/core/kit.js`)
- **Living Worlds**:
  - `K.livingPlateBg(img, t, { driftX, driftY, zoom, grain, vignette, warmTint })`
  - `K.paperWorldBg(t, { bg, grain, lightSweep })`
  - `K.darkStudioBg(t, { bg, accent, grain })`
  - `K.drawFilmGrain(t, alpha)`
- **Kinetic Typography**:
  - `K.chromaticDecodeText({ text, progress, t, x, y, size, weight, ink, glow, glowAlt, accentWord, accentColor, underlineP })`
  - `K.caretTypeText({ text, progress, x, y, size, weight, ink, caretColor, blinkT })`
  - `K.blurRevealText({ text, progress, x, y, size, weight, ink, sub, subInk })`
  - `K.inlineEmblemSentence({ prefix, suffix, emblemImg, emblemBg, x, y, size, weight, ink, emblemPop, underlineWord, underlineP })`
- **Apple Liquid Glass & Interactive Product Chrome**:
  - `K.frostedGlassCard({ x, y, w, h, r, dark, blurPx, tintAlpha, rimGlow, rimColor, shadow })` — live backdrop pixel sampling & blur.
  - `K.promptCapsule({ typed, placeholder, domainChip, chips, caret, caretT, pressed, spinnerP, btnColor, btnIcon, dark, yOffset, rimGlow, compact })` -> returns `{ btnX, btnY, cardRect }`.
  - `K.floatingGlassPill({ text, x, y, dark, accentDot, badge, popP })`
  - `K.macWindowFrame({ x, y, w, h, r, title, badge, badgeBg, badgeFg, dark, drawBody })`
  - `K.macCursor(x, y, { kind, click, rippleColor, scale })`
- **Evidence, Stamps & Annotations**:
  - `K.floatingCardFan({ cards, lt, gatherP })`
  - `K.rubberStamp({ label, x, y, rot, tone, slamP, scale })`
  - `K.liveDiffGlassCard({ x, y, w, h, header, badge, beforeText, afterText, strikeP, swapP, ctaBefore, ctaAfter, ctaSwapP })`
  - `K.calloutBubble({ text, x, y, targetX, targetY, borderColor, curve, popP })`
  - `K.drawBuilderMark(id, cx, cy, size, color)` (`claude`, `codex`, `antigravity`, `cursor`, `lovable`, `v0`)

## 3. Transparent Alpha 3D Staging (`styles/cinema-launch/example/src/core/engine3d.js`)
- `E3D.renderDualCompare({ left, right, t, portrait, enterP, spread, angle, orbitX, camZ, fov })` — renders two rounded macOS windows with live optical scan-wipe (`wipeP: 0 -> 1`) over transparent alpha so `ctx.drawImage(E3D.canvas, 0, 0, W, H)` floats directly over `livingPlateBg(...)`.
- `E3D.renderSingleHero({ spec, t, rotY, rotX, camZ, scale, portrait })`
- `E3D.renderFanStack({ cards, t, spreadP, camZ, portrait })`

## 4. Studio Cross-Shot Transitions (`shot.transitionIn`)
Declared directly on the incoming shot object; automatically composited by `src/main.js` using offscreen `bufA`/`bufB`:
- `{ type: 'mosaic', dur: 0.48, tile: 36, palette }` — diagonal pixel-mosaic block dissolve with optical color edge.
- `{ type: 'pill-expand', dur: 0.32, startW: 680, startH: 76 }` — horizontal pill-portal opening edge-to-edge.
- `{ type: 'whip', dur: 0.28, dir: 'left' | 'right' }` — directional 7-tap optical motion-blur whip pan.
- `{ type: 'mist', dur: 0.22, color: '#FAF9F7' }` — bright warm daylight exposure wash.
- `{ type: 'fade', dur: 0.25 }` — clean crossfade.
