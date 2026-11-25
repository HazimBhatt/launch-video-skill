# Kinetic Noir: Linear / Vercel / Raycast Launch Style (16:9 & 9:16)

Sharp, architectural, dark-mode software reveal. Floats real product screenshots inside a 3D Three.js studio stage, spotlights specific UI actions with spring-physics cursor choreography, and snaps bold tight-tracked headlines to a driving musical beat (or local voiceover).

Example: `example/` = **BranchBox** (`branchbox.dev`, 24 s, 6 shots, beat-synced). Style sheet: `style-sheet.png`.

## 1. The Look & Conversion Arc
- **Brand-tinted obsidian**: `brand.js` automatically reads `data/brand.json` and tints the `#090A0F` stage + rim bloom with the product's actual CTA accent color (`B.accentBright`).
- **Real captures, never generic boxes**: Every product shot displays `B.imgs.hero`, `B.imgs.showcase`, `B.imgs.mobile`, or custom interactive captures inside `E3D.render(...)` or `K.browserFrame(...)`.
- **Arc**: Status-quo pain stack (jitter -> wipe) -> 3D hero reveal (`drop`) -> Live cursor click + UI spotlight zoom (`click` + `shutter`) -> Hard benchmark / bento proof -> Auto-expire / anywhere fit -> Brand logo + CLI/CTA click endcard (`chime`).
- **Dual Audio**: Default `"mode": "beats"` (`124` BPM, `"music": "pulse"`) for muted-first X/PH timelines; seamlessly supports `"mode": "narrated"` with Kokoro TTS + bottom word-synced captions.

## 2. Format & Responsive Coordinates
- **Default**: `1920x1080` (`16:9`, 30 fps) for X, Product Hunt, Landing Page hero.
- **Vertical**: Pass `--aspect=9:16` (`1080x1920`) or set `"aspect": "9:16"` in `script.json` — `LOUT.pane(...)` and `PORTRAIT` adapt all shots cleanly.

## 3. Engine & Component Map (`example/src/`)
| file | gives you |
|---|---|
| `core/lib.js` | `W H CX CY U PORTRAIT LOUT`, `spring(t)`, `rr`, `imageViewport`, `rgba`, `mixHex` |
| `core/brand.js` | `B` (`name`, `domain`, `accent`, `accentBright`, `bg`, `surface`, `copy`, `imgs`, `logoImg`) |
| `core/engine3d.js` | `makeStage3D` (Three.js tilted glass screen + floor reflection + bloom) |
| `core/kit.js` | `K.obsidianBg`, `K.badge`, `K.kineticTitle`, `K.browserFrame` (zoom/pan/spotlight), `K.cursor`, `K.painCard`, `K.bentoCard`, `K.ctaEndcard` |
| `core/timing.js` | `L(i)`, `Le(i)`, `Wd(word, line)`, `beatPulse(t)`, `beatTime(idx)` |
| `tools/mix.py` | `"pulse"` synth groove + `whoosh riser drop click type pop snap chime slam shutter` |

## 4. QA Pitfalls
- **3D card too small in 9:16**: Push `camPos` z slightly closer or switch to `PORTRAIT` offsets (`cardX: 0`, `cardY: -0.35`, title below).
- **Cursor landing on empty white space**: Inspect `assets/captures/ui-showcase.png` first and aim normalized `[u, v]` coordinates accurately at real buttons/panels.
- **Dark accent invisible on obsidian**: `brand.js` enforces contrast guard (`lum < 0.09` auto-lifts toward `#FFFFFF`).
