# Cinema Launch — Flagship Viral X / Product Hunt Studio Style

Human-studio motion direction modeled after elite viral launch films (Soar, Linear, Raycast): **one unified atmospheric world**, real refractive **Apple Liquid Glass**, **transparent-alpha 3D dual comparison windows**, **optical macro camera pushes**, **pixel-mosaic & pill-portal transitions**, **60 FPS lossless PNG rendering**, and a **wide-stereo sidechained electronic anthem (`-14 LUFS`)**.

## Core Rules (Zero AI-Slop Standard)
- **Zero static flat backgrounds**: Always render `livingPlateBg(B.ai.skyDaylight, t)` (photographic drifting sky/studio plate + subtle film grain), `paperWorldBg(t)` (moving morning light sweep + paper grain), or `darkStudioBg(t)`.
- **Zero synthetic filler icons or corner syntax clutter**: Show real 2x Retina product captures (`probe.mjs`) and genuine interactive Before/After proof.
- **Zero uniform cut thump or TV watermarks**: Use `shot.punch` intentionally on sprint cuts only, and `transitionIn` (`mosaic`, `pill-expand`, `whip`, `mist`) for editorial continuity.
- **Zero squashed logos**: Always use `drawContain()` or `inlineEmblemSentence()`.
- **Zero em dashes (`—`) or generic SaaS buzzwords** anywhere in on-screen copy.

## Available `kit.js` Primitives
- **Worlds & Camera**: `livingPlateBg`, `paperWorldBg`, `darkStudioBg`, `drawFilmGrain`, `withCamera`
- **Kinetic Typography**: `chromaticDecodeText`, `caretTypeText`, `blurRevealText`, `inlineEmblemSentence`
- **Apple Liquid Glass & Interactive Chrome**: `frostedGlassCard`, `promptCapsule` (returns exact `{ btnX, btnY, cardRect }`), `floatingGlassPill`, `macWindowFrame`, `macCursor` + `bezier2`
- **Product Proof & Staging**: `floatingCardFan`, `rubberStamp`, `liveDiffGlassCard`, `calloutBubble`, `drawBuilderMark`
- **Transparent 3D (`engine3d.js`)**: `E3D.renderDualCompare`, `E3D.renderSingleHero`, `E3D.renderFanStack`
- **Cross-Shot Transitions (`shot.transitionIn`)**: `{ type: 'mosaic' | 'pill-expand' | 'whip' | 'mist' | 'fade', dur }`

## Audio (`tools/mix.py`)
- Default `"music": "anthem"` (true 48 kHz wide-stereo 5-section electronic soundtrack with sidechain pump, vocal-formant motif, stereo ping-pong delay, algorithmic reverb, 16.8 kHz air ceiling, `-14 LUFS` master).
- Custom licensed tracks (`"music": "audio/track.mp3"`) preserve full stereo without mono downmix.
- Foley cues: `decode_tick`, `mac_click`, `glass_whoosh`, `portal_morph`, `stamp_thud`, `strikethrough_snip`, `mosaic_sweep`, `score_lift`, `prompt_copy`, `snap`, `pop`, `type`, `riser`, `drop`, `shutter`, `chime`.
