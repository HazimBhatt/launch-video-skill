// Cinema Launch Studio Kit — True Liquid Glass, Living Photographic Worlds, Kinetic Typography,
// Optical Macro Camera, Pixel-Mosaic & Pill-Portal Transitions, Live Diff Glass, Annotated Callouts.
// Zero leaked template copy, zero static fills, zero candy bokeh, zero squashed logos.
import {
  W, H, CX, CY, U, PORTRAIT,
  clamp, lerp, seg, eo, eo4, eio, spring, bezier2,
  rr, wrapLines, fontSpec, rnd, rgba, mixHex, drawContain, drawCover,
} from './lib.js';
import { B } from './brand.js';

let ctx = null;
let E3D = null;

export function bindCtx(c, e3d = null) {
  ctx = c;
  if (e3d) E3D = e3d;
}
export function getCtx() { return ctx; }
export function get3D() { return E3D; }

// ---------- Film grain tile (deterministic 256x256 organic micro-dither; kills H.264 banding) ----------
let _grainTile = null;
function getGrainTile() {
  if (_grainTile) return _grainTile;
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const g = cv.getContext('2d');
  const id = g.createImageData(256, 256);
  const d = id.data;
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.round(128 + (rnd(i * 1.37 + 19.1) - 0.5) * 96);
    const k = i * 4;
    d[k] = v; d[k + 1] = v; d[k + 2] = v; d[k + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  _grainTile = cv;
  return cv;
}

export function drawFilmGrain(t = 0, alpha = 0.032) {
  if (alpha <= 0.001) return;
  const tile = getGrainTile();
  const frame = Math.floor(t * 24);
  const ox = -Math.floor(rnd(frame * 3.1 + 7) * 256);
  const oy = -Math.floor(rnd(frame * 5.7 + 13) * 256);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  for (let y = oy; y < H; y += 256) {
    for (let x = ox; x < W; x += 256) {
      ctx.drawImage(tile, x, y);
    }
  }
  ctx.restore();
}

// ---------- Scratch buffer for TRUE Apple Liquid Glass backdrop refraction ----------
let _glassBuf = null;
function getGlassBuf() {
  if (!_glassBuf) {
    _glassBuf = document.createElement('canvas');
    _glassBuf.width = 384;
    _glassBuf.height = 216;
  }
  return _glassBuf;
}

// ---------- Optical Macro Camera (anchored on any off-center widget coordinate) ----------
export function withCamera({ zoom = 1, focusX = CX, focusY = CY, viewX = CX, viewY = CY, tilt = 0 } = {}, drawFn) {
  ctx.save();
  ctx.translate(viewX, viewY);
  if (tilt) ctx.rotate(tilt);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusX, -focusY);
  drawFn();
  ctx.restore();
}

// ---------- Living Atmospheric Photographic World (with high-craft daylight sky fallback) ----------
export function livingPlateBg(img, t = 0, {
  driftX = 24,
  driftY = 8,
  zoom = 1.09,
  grain = 0.032,
  vignette = 0.14,
  warmTint = null,
} = {}) {
  ctx.save();
  if (img && (img.naturalWidth || img.width)) {
    const panX = clamp(0.5 + Math.sin(t * 0.12) * 0.035 + (t * driftX) / (W * 4.5), 0.08, 0.92);
    const panY = clamp(0.5 + Math.cos(t * 0.09) * 0.02 + (t * driftY) / (H * 5), 0.1, 0.9);
    drawCover(ctx, img, 0, 0, W, H, { panX, panY, zoom });
  } else {
    // High-key sunlit cerulean-to-ivory sky fallback (layered atmospheric horizon, zero oval seams)
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#78B3E6');
    sky.addColorStop(0.38, '#AED4F2');
    sky.addColorStop(0.76, '#E4EEF6');
    sky.addColorStop(1, '#FAF1EC');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Wide diffused sunlit horizon haze bands (smooth full-bleed atmospheric light)
    const drift = Math.sin(t * 0.22) * W * 0.14;
    const haze1 = ctx.createRadialGradient(W * 0.25 + drift, H * 0.88, W * 0.05, W * 0.25 + drift, H * 0.88, W * 0.82);
    haze1.addColorStop(0, 'rgba(255,252,248,0.88)');
    haze1.addColorStop(0.5, 'rgba(255,248,242,0.34)');
    haze1.addColorStop(1, 'rgba(255,248,242,0)');
    ctx.fillStyle = haze1;
    ctx.fillRect(0, 0, W, H);

    const haze2 = ctx.createRadialGradient(W * 0.78 - drift * 0.7, H * 0.72, W * 0.04, W * 0.78 - drift * 0.7, H * 0.72, W * 0.74);
    haze2.addColorStop(0, 'rgba(255,255,255,0.72)');
    haze2.addColorStop(0.55, 'rgba(248,244,240,0.22)');
    haze2.addColorStop(1, 'rgba(248,244,240,0)');
    ctx.fillStyle = haze2;
    ctx.fillRect(0, 0, W, H);
  }

  if (warmTint) {
    ctx.fillStyle = warmTint;
    ctx.fillRect(0, 0, W, H);
  }

  if (vignette > 0.001) {
    const v = ctx.createRadialGradient(CX, CY, Math.min(W, H) * 0.32, CX, CY, Math.max(W, H) * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(14,16,22,${vignette})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  drawFilmGrain(t, grain);
}

// ---------- Sunlit Editorial Paper World (moving morning light sweep + organic paper grain) ----------
export function paperWorldBg(t = 0, { bg = B.bg, grain = 0.026, lightSweep = true } = {}) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (lightSweep) {
    const shift = Math.sin(t * 0.38) * W * 0.08;
    const g = ctx.createLinearGradient(shift, 0, W + shift, H);
    g.addColorStop(0, 'rgba(255,255,255,0.52)');
    g.addColorStop(0.42, 'rgba(255,255,255,0)');
    g.addColorStop(0.78, 'rgba(255,158,138,0.055)');
    g.addColorStop(1, 'rgba(17,17,16,0.03)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  drawFilmGrain(t, grain);
}

// ---------- Matte Obsidian Dark Studio World (breathing architectural edge sheen + grain) ----------
export function darkStudioBg(t = 0, { bg = B.darkBg, accent = B.accent, grain = 0.036 } = {}) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const gx = CX + Math.sin(t * 0.45) * W * 0.16;
  const gy = H * 0.18 + Math.cos(t * 0.35) * H * 0.06;
  const rad = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.72);
  rad.addColorStop(0, rgba(accent, 0.11));
  rad.addColorStop(0.45, rgba(accent, 0.03));
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  drawFilmGrain(t, grain);
}

// ---------- 1. Chromatic Scramble-Decode Kinetic Typography (Soar 0:00 signature) ----------
const SCRAMBLE_POOL = 'Xk9#aQ>r3%zM=7vB2$cF';
export function chromaticDecodeText({
  text = '',
  progress = 1,
  t = 0,
  x = CX,
  y = CY,
  size = 76,
  weight = 700,
  ink = B.text,
  glow = B.accentDeep,
  glowAlt = '#38BDF8',
  maxW = W * 0.86,
  accentWord = null,
  accentColor = B.accent,
  underlineP = 0,
} = {}) {
  const s = String(text);
  const fontSz = size * U;
  ctx.save();
  ctx.font = fontSpec(weight, fontSz, B.displayFont);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const lines = wrapLines(ctx, s, maxW);
  const lineH = fontSz * 1.16;
  const startY = y - ((lines.length - 1) * lineH) / 2;
  const totalLen = s.length;
  const lockCount = Math.floor(clamp(progress) * (totalLen + 4));
  const step = Math.floor(t * 28);

  let globalIdx = 0;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lw = ctx.measureText(line).width;
    let cx = x - lw / 2;
    const cy = startY + li * lineH;

    // Optional highlight underline under accentWord
    if (accentWord && underlineP > 0.01) {
      const idxW = line.indexOf(accentWord);
      if (idxW >= 0) {
        const preW = ctx.measureText(line.slice(0, idxW)).width;
        const wordW = ctx.measureText(accentWord).width;
        const up = eo4(clamp(underlineP));
        ctx.save();
        ctx.fillStyle = rgba(accentColor, 0.42);
        rr(ctx, cx + preW - 4 * U, cy + fontSz * 0.24, (wordW + 8 * U) * up, fontSz * 0.22, 6 * U);
        ctx.fill();
        ctx.restore();
      }
    }

    for (let ci = 0; ci < line.length; ci++) {
      const ch = line[ci];
      const chW = ctx.measureText(ch).width;
      const gIdx = globalIdx++;
      if (ch === ' ') { cx += chW; continue; }

      if (gIdx < lockCount - 4) {
        ctx.fillStyle = ink;
        ctx.fillText(ch, cx, cy);
      } else if (gIdx <= lockCount + 1) {
        // Active chromatic scramble frontier
        const glyph = gIdx < lockCount - 1
          ? ch
          : SCRAMBLE_POOL[Math.floor(rnd(gIdx * 17.3 + step * 3.7) * SCRAMBLE_POOL.length)];
        const alpha = clamp(1 - (gIdx - (lockCount - 4)) * 0.14);
        ctx.save();
        ctx.globalAlpha = alpha * 0.42;
        ctx.fillStyle = glowAlt;
        ctx.fillText(glyph, cx - 2.5 * U, cy);
        ctx.fillStyle = glow;
        ctx.fillText(glyph, cx + 2.5 * U, cy);
        ctx.globalAlpha = alpha;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 16 * U;
        ctx.fillStyle = mixHex(ink, glow, 0.55);
        ctx.fillText(glyph, cx, cy);
        ctx.restore();
      }
      cx += chW;
    }
    globalIdx++; // space between wrapped lines
  }
  ctx.restore();
}

// ---------- 2. Crisp Live Caret Type Reveal ----------
export function caretTypeText({
  text = '',
  progress = 1,
  x = CX,
  y = CY,
  size = 76,
  weight = 700,
  ink = B.text,
  caretColor = B.accentDeep,
  blinkT = 0,
} = {}) {
  const shown = text.slice(0, Math.round(text.length * clamp(progress)));
  ctx.save();
  ctx.font = fontSpec(weight, size * U, B.displayFont);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.fillText(shown, x, y);

  const tw = ctx.measureText(shown).width;
  const caretOn = Math.floor(blinkT * 2.4) % 2 === 0 || progress < 0.99;
  if (caretOn) {
    ctx.fillStyle = caretColor;
    rr(ctx, x + tw / 2 + 6 * U, y - size * U * 0.44, 4.5 * U, size * U * 0.88, 2.2 * U);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- 3. Blur-to-Sharp Spring Headline ----------
export function blurRevealText({
  text = '',
  progress = 1,
  x = CX,
  y = CY,
  size = 74,
  weight = 700,
  ink = B.text,
  sub = '',
  subInk = B.muted,
} = {}) {
  const p = eo4(clamp(progress));
  const blurPx = Math.max(0, (1 - p) * 14 * U);
  ctx.save();
  ctx.globalAlpha = clamp(p * 1.15);
  if (blurPx > 0.4) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
  ctx.font = fontSpec(weight, size * U, B.displayFont);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + (1 - p) * 22 * U);
  if (sub) {
    ctx.font = fontSpec(500, size * 0.36 * U, B.bodyFont);
    ctx.fillStyle = subInk;
    ctx.fillText(sub, x, y + size * 0.78 * U + (1 - p) * 16 * U);
  }
  ctx.restore();
}

// ---------- 4. Inline Emblem Typography ("Your page [icon] fixed in 1 prompt.") ----------
export function inlineEmblemSentence({
  prefix = '',
  suffix = '',
  emblemImg = B.logoImg,
  emblemBg = '#FFFFFF',
  x = CX,
  y = CY,
  size = 54,
  weight = 600,
  ink = B.text,
  emblemPop = 1,
  underlineWord = null,
  underlineColor = B.accent,
  underlineP = 0,
} = {}) {
  const fs = size * U;
  const icoS = fs * 1.18;
  const gap = 16 * U;

  ctx.save();
  ctx.font = fontSpec(weight, fs, B.displayFont);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const wPre = prefix ? ctx.measureText(prefix).width : 0;
  const wSuf = suffix ? ctx.measureText(suffix).width : 0;
  const totalW = wPre + (prefix ? gap : 0) + icoS + (suffix ? gap : 0) + wSuf;
  let curX = x - totalW / 2;

  if (prefix) {
    ctx.fillStyle = ink;
    ctx.fillText(prefix, curX, y);
    curX += wPre + gap;
  }

  // Inline rounded squircle emblem (aspect-safe drawContain!)
  const sc = spring(clamp(emblemPop, 0, 1.5), { stiffness: 280, damping: 20 });
  ctx.save();
  ctx.translate(curX + icoS / 2, y);
  ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(17,17,16,0.16)';
  ctx.shadowBlur = 18 * U;
  ctx.shadowOffsetY = 6 * U;
  rr(ctx, -icoS / 2, -icoS / 2, icoS, icoS, icoS * 0.24);
  ctx.fillStyle = emblemBg;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(17,17,16,0.09)';
  ctx.lineWidth = 1.4 * U;
  ctx.stroke();

  if (emblemImg) {
    ctx.save();
    rr(ctx, -icoS / 2, -icoS / 2, icoS, icoS, icoS * 0.24);
    ctx.clip();
    const pad = icoS * 0.08;
    drawContain(ctx, emblemImg, -icoS / 2 + pad, -icoS / 2 + pad, icoS - pad * 2, icoS - pad * 2);
    ctx.restore();
  }
  ctx.restore();
  curX += icoS + gap;

  if (suffix) {
    if (underlineWord && underlineP > 0.01) {
      const idxW = suffix.indexOf(underlineWord);
      if (idxW >= 0) {
        const preW = ctx.measureText(suffix.slice(0, idxW)).width;
        const wordW = ctx.measureText(underlineWord).width;
        ctx.fillStyle = rgba(underlineColor, 0.42);
        rr(ctx, curX + preW - 3 * U, y + fs * 0.25, (wordW + 6 * U) * eo4(underlineP), fs * 0.2, 5 * U);
        ctx.fill();
      }
    }
    ctx.fillStyle = ink;
    ctx.fillText(suffix, curX, y);
  }
  ctx.restore();
}

// ---------- 5. TRUE Apple Liquid Glass Card (samples & blurs underlying live canvas!) ----------
export function frostedGlassCard({
  x, y, w, h,
  r = 24 * U,
  dark = false,
  blurPx = 14,
  tintAlpha = null,
  rimGlow = 0,
  rimColor = B.accent,
  shadow = true,
} = {}) {
  const srcCv = ctx.canvas;
  const gb = getGlassBuf();
  const gctx = gb.getContext('2d');

  // 1. Multi-layered ambient & contact shadow
  if (shadow) {
    ctx.save();
    ctx.shadowColor = dark ? 'rgba(8,10,16,0.42)' : 'rgba(17,17,16,0.16)';
    ctx.shadowBlur = (dark ? 48 : 38) * U;
    ctx.shadowOffsetY = (dark ? 22 : 16) * U;
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = dark ? 'rgba(18,18,20,0.65)' : 'rgba(255,255,255,0.45)';
    ctx.fill();
    ctx.restore();
  }

  // 2. Sample & blur underlying pixels behind (x, y, w, h)
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();

  if (srcCv && srcCv.width > 0 && srcCv.height > 0) {
    const sx = clamp(x, 0, srcCv.width - 1);
    const sy = clamp(y, 0, srcCv.height - 1);
    const sw = clamp(w, 1, srcCv.width - sx);
    const sh = clamp(h, 1, srcCv.height - sy);
    if (sw > 2 && sh > 2) {
      gctx.clearRect(0, 0, gb.width, gb.height);
      gctx.drawImage(srcCv, sx, sy, sw, sh, 0, 0, gb.width, gb.height);
      ctx.save();
      ctx.filter = `blur(${Math.round(blurPx * U)}px) saturate(${dark ? 1.18 : 1.38}) brightness(${dark ? 0.62 : 1.06})`;
      ctx.drawImage(gb, 0, 0, gb.width, gb.height, x - 18 * U, y - 18 * U, w + 36 * U, h + 36 * U);
      ctx.restore();
    }
  }

  // 3. Translucent frosted glass tint gradient
  const fillGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (dark) {
    const a0 = tintAlpha ?? 0.84;
    fillGrad.addColorStop(0, `rgba(26,26,28,${a0})`);
    fillGrad.addColorStop(1, `rgba(14,14,16,${Math.min(0.95, a0 + 0.06)})`);
  } else {
    const a0 = tintAlpha ?? 0.66;
    fillGrad.addColorStop(0, `rgba(255,255,255,${a0})`);
    fillGrad.addColorStop(1, `rgba(250,249,247,${Math.max(0.32, a0 - 0.16)})`);
  }
  ctx.fillStyle = fillGrad;
  ctx.fillRect(x, y, w, h);

  // 4. Diagonal 135-deg specular glass reflection sweep
  const spec = ctx.createLinearGradient(x, y, x + w * 0.72, y + h * 0.72);
  spec.addColorStop(0, dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.52)');
  spec.addColorStop(0.45, 'rgba(255,255,255,0.03)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // 5. Directional bevel border + optional accent focus rim
  ctx.save();
  rr(ctx, x, y, w, h, r);
  const rim = ctx.createLinearGradient(x, y, x + w, y + h);
  if (rimGlow > 0.05) {
    rim.addColorStop(0, rgba(rimColor, 0.95));
    rim.addColorStop(0.5, rgba('#FFFFFF', 0.65));
    rim.addColorStop(1, rgba(rimColor, 0.78));
    ctx.strokeStyle = rim;
    ctx.lineWidth = (2.2 + rimGlow * 1.2) * U;
    ctx.shadowColor = rgba(rimColor, 0.55 * rimGlow);
    ctx.shadowBlur = 20 * U;
  } else {
    rim.addColorStop(0, dark ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.92)');
    rim.addColorStop(1, dark ? 'rgba(255,255,255,0.09)' : 'rgba(17,17,16,0.11)');
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.6 * U;
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- 6. Interactive Prompt Capsule (returns exact world { btnX, btnY, cardRect }!) ----------
export function promptCapsule({
  typed = '',
  placeholder = 'Paste any live URL...',
  domainChip = '',
  chips = [],
  caret = true,
  caretT = 0,
  pressed = 0,
  spinnerP = 0,
  btnColor = B.accent,
  btnTextColor = '#111110',
  btnIcon = 'arrow',
  dark = true,
  width = null,
  height = null,
  yOffset = 0,
  rimGlow = 0,
  compact = false,
} = {}) {
  const cw = (width ?? (compact ? (PORTRAIT ? 640 : 540) : (PORTRAIT ? 880 : 840))) * U;
  const ch = (height ?? (compact ? 116 : (domainChip ? 168 : 138))) * U;
  const cx = CX - cw / 2;
  const cy = CY + yOffset * U - ch / 2;

  frostedGlassCard({ x: cx, y: cy, w: cw, h: ch, r: (compact ? 30 : 28) * U, dark, rimGlow, rimColor: btnColor });

  const padX = 28 * U;
  let textY = cy + ch * 0.44;

  // Optional top-left domain chip
  if (domainChip) {
    ctx.save();
    ctx.font = fontSpec(600, 17 * U, B.monoFont);
    const dw = ctx.measureText(domainChip).width + 28 * U;
    const dh = 32 * U;
    const dx = cx + padX, dy = cy + 20 * U;
    rr(ctx, dx, dy, dw, dh, 10 * U);
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,16,0.06)';
    ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,16,0.1)';
    ctx.lineWidth = 1 * U;
    ctx.stroke();
    ctx.fillStyle = dark ? '#FAF9F7' : '#111110';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(domainChip, dx + 14 * U, dy + dh / 2 + 0.5 * U);
    ctx.restore();
    textY = cy + ch * 0.66;
  }

  // Typed text + blinking caret
  ctx.save();
  const fs = (compact ? 29 : 31) * U;
  ctx.font = fontSpec(500, fs, B.bodyFont);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const display = typed || placeholder;
  ctx.fillStyle = typed
    ? (dark ? '#FAF9F7' : '#111110')
    : (dark ? 'rgba(250,249,247,0.42)' : 'rgba(17,17,16,0.38)');
  ctx.fillText(display, cx + padX, textY);

  if (caret) {
    const tw = typed ? ctx.measureText(typed).width : 0;
    const blink = Math.floor(caretT * 2.5) % 2 === 0 || typed.length > 0;
    if (blink) {
      ctx.fillStyle = btnColor;
      rr(ctx, cx + padX + tw + 4 * U, textY - fs * 0.45, 3 * U, fs * 0.9, 1.5 * U);
      ctx.fill();
    }
  }
  ctx.restore();

  // Circular Submit Button (morphs cleanly into rotating white spinner arc when spinnerP > 0!)
  const btnR = (compact ? 28 : 30) * U;
  const btnX = cx + cw - padX - btnR;
  const btnY = domainChip ? (cy + ch - padX - btnR + 4 * U) : (cy + ch / 2);
  const pressScale = 1 - Math.sin(clamp(pressed) * Math.PI) * 0.14;

  ctx.save();
  ctx.translate(btnX, btnY);
  ctx.scale(pressScale, pressScale);
  ctx.beginPath();
  ctx.arc(0, 0, btnR, 0, Math.PI * 2);
  ctx.fillStyle = btnColor;
  ctx.shadowColor = rgba(btnColor, 0.45);
  ctx.shadowBlur = 18 * U;
  ctx.fill();
  ctx.shadowBlur = 0;

  if (spinnerP > 0.01) {
    // Rotating white 265-deg loading arc
    const ang = spinnerP * Math.PI * 4.5;
    ctx.strokeStyle = btnTextColor;
    ctx.lineWidth = 3.2 * U;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, btnR * 0.42, ang, ang + Math.PI * 1.45);
    ctx.stroke();
  } else if (btnIcon === 'copy') {
    ctx.strokeStyle = btnTextColor;
    ctx.lineWidth = 2.4 * U;
    ctx.lineJoin = 'round';
    rr(ctx, -7 * U, -5 * U, 12 * U, 14 * U, 2.5 * U);
    ctx.stroke();
    rr(ctx, -2 * U, -10 * U, 12 * U, 14 * U, 2.5 * U);
    ctx.fillStyle = btnColor;
    ctx.fill();
    ctx.stroke();
  } else if (btnIcon === 'up') {
    ctx.strokeStyle = btnTextColor;
    ctx.lineWidth = 3 * U;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 9 * U);
    ctx.lineTo(0, -9 * U);
    ctx.moveTo(-8 * U, -1 * U);
    ctx.lineTo(0, -9 * U);
    ctx.lineTo(8 * U, -1 * U);
    ctx.stroke();
  } else {
    // Crisp right arrow
    ctx.strokeStyle = btnTextColor;
    ctx.lineWidth = 3 * U;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-9 * U, 0);
    ctx.lineTo(9 * U, 0);
    ctx.moveTo(1.5 * U, -8 * U);
    ctx.lineTo(9.5 * U, 0);
    ctx.lineTo(1.5 * U, 8 * U);
    ctx.stroke();
  }
  ctx.restore();

  // Optional quick-action glass chips beneath capsule
  if (chips.length) {
    ctx.save();
    ctx.font = fontSpec(500, 18 * U, B.bodyFont);
    const gap = 12 * U;
    const widths = chips.map((c) => ctx.measureText(c).width + 32 * U);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
    let px = CX - total / 2;
    const py = cy + ch + 22 * U;
    const ph = 40 * U;
    chips.forEach((label, i) => {
      const pw = widths[i];
      frostedGlassCard({ x: px, y: py, w: pw, h: ph, r: ph / 2, dark, blurPx: 10, tintAlpha: dark ? 0.68 : 0.62, shadow: false });
      ctx.fillStyle = dark ? 'rgba(250,249,247,0.88)' : 'rgba(17,17,16,0.84)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, px + pw / 2, py + ph / 2 + 0.5 * U);
      px += pw + gap;
    });
    ctx.restore();
  }

  return { btnX, btnY, cardRect: { x: cx, y: cy, w: cw, h: ch } };
}

// ---------- 7. Compact Floating Glass Command Pill (Soar bottom-center pill) ----------
export function floatingGlassPill({
  text = '',
  x = CX,
  y = H - 92 * U,
  dark = true,
  accentDot = null,
  badge = null,
  popP = 1,
} = {}) {
  const sc = spring(clamp(popP, 0, 1.5), { stiffness: 280, damping: 22 });
  if (sc <= 0.02) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.font = fontSpec(600, 22 * U, B.bodyFont);
  const tw = ctx.measureText(text).width;
  const badgeW = badge ? (ctx.measureText(badge).width + 26 * U) : 0;
  const dotPad = accentDot ? 22 * U : 0;
  const pw = tw + badgeW + dotPad + 48 * U;
  const ph = 52 * U;
  const px = -pw / 2, py = -ph / 2;

  frostedGlassCard({ x: px, y: py, w: pw, h: ph, r: ph / 2, dark, blurPx: 14 });

  let tx = px + 24 * U;
  if (accentDot) {
    ctx.beginPath();
    ctx.arc(tx + 5 * U, 0, 5.5 * U, 0, Math.PI * 2);
    ctx.fillStyle = accentDot;
    ctx.fill();
    tx += 20 * U;
  }

  ctx.fillStyle = dark ? '#FAF9F7' : '#111110';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, tx, 1 * U);

  if (badge) {
    const bx = tx + tw + 12 * U;
    rr(ctx, bx, -15 * U, badgeW, 30 * U, 15 * U);
    ctx.fillStyle = rgba(B.accent, dark ? 0.22 : 0.28);
    ctx.fill();
    ctx.font = fontSpec(700, 16 * U, B.monoFont);
    ctx.fillStyle = dark ? B.accent : B.accentDeep;
    ctx.textAlign = 'center';
    ctx.fillText(badge, bx + badgeW / 2, 0.5 * U);
  }
  ctx.restore();
}

// ---------- 8. Crisp macOS Cursor (arrow or pointer hand + Bezier travel + click ripple) ----------
export function macCursor(x, y, { kind = 'arrow', click = 0, rippleColor = B.accent, scale = 1 } = {}) {
  const c = clamp(click);
  if (c > 0.01 && c < 0.99) {
    ctx.save();
    const rr1 = lerp(12 * U, 64 * U, eo(c));
    ctx.beginPath();
    ctx.arc(x, y, rr1, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(rippleColor, (1 - c) * 0.85);
    ctx.lineWidth = lerp(4 * U, 1.2 * U, c);
    ctx.stroke();

    const rr2 = lerp(6 * U, 34 * U, eo4(c));
    ctx.beginPath();
    ctx.arc(x, y, rr2, 0, Math.PI * 2);
    ctx.fillStyle = rgba(rippleColor, (1 - c) * 0.28);
    ctx.fill();
    ctx.restore();
  }

  const squish = 1 - Math.sin(c * Math.PI) * 0.18;
  const s = 1.25 * U * scale * squish;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.34)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  if (kind === 'pointer') {
    // Clean macOS hand pointer silhouette
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-4, 11);
    ctx.quadraticCurveTo(-7, 13, -4, 17);
    ctx.lineTo(3, 25);
    ctx.lineTo(13, 25);
    ctx.lineTo(16, 17);
    ctx.lineTo(16, 9);
    ctx.quadraticCurveTo(16, 6, 13, 7);
    ctx.lineTo(13, 6);
    ctx.quadraticCurveTo(13, 4, 10, 5);
    ctx.lineTo(10, 4);
    ctx.quadraticCurveTo(10, 2, 7, 4);
    ctx.lineTo(5, 4);
    ctx.lineTo(5, 0);
    ctx.quadraticCurveTo(2.5, -2.5, 0, 0);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#111110';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
  } else {
    // Classic crisp macOS arrow cursor
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 27);
    ctx.lineTo(7.2, 20.4);
    ctx.lineTo(11.8, 30.2);
    ctx.lineTo(15.6, 28.4);
    ctx.lineTo(11.1, 18.8);
    ctx.lineTo(20.2, 18.6);
    ctx.closePath();
    ctx.fillStyle = '#111110';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

export { bezier2 };

// ---------- 9. Crisp Rounded macOS Browser/App Window ----------
export function macWindowFrame({
  x, y, w, h,
  r = 22 * U,
  title = '',
  badge = '',
  badgeBg = B.emerald,
  badgeFg = '#FFFFFF',
  dark = true,
  drawBody = null,
} = {}) {
  const barH = 44 * U;
  ctx.save();
  ctx.shadowColor = 'rgba(14,14,13,0.28)';
  ctx.shadowBlur = 46 * U;
  ctx.shadowOffsetY = 20 * U;
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = dark ? '#161615' : '#FFFFFF';
  ctx.fill();
  ctx.restore();

  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();

  // Body
  if (drawBody) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + barH, w, h - barH);
    ctx.clip();
    drawBody(x, y + barH, w, h - barH);
    ctx.restore();
  }

  // Titlebar
  ctx.fillStyle = dark ? '#161615' : '#F4F3F0';
  ctx.fillRect(x, y, w, barH);
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,16,0.08)';
  ctx.fillRect(x, y + barH - 1, w, 1);

  const dots = ['#FF5F56', '#FFBD2E', '#27C93F'];
  dots.forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(x + 22 * U + i * 19 * U, y + barH / 2, 5.5 * U, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  if (title) {
    ctx.font = fontSpec(600, 16 * U, B.bodyFont);
    ctx.fillStyle = dark ? 'rgba(250,249,247,0.85)' : 'rgba(17,17,16,0.82)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + w / 2, y + barH / 2 + 0.5 * U);
  }

  if (badge) {
    ctx.font = fontSpec(700, 14 * U, B.monoFont);
    const bw = ctx.measureText(badge).width + 20 * U;
    const bh = 24 * U;
    rr(ctx, x + w - bw - 16 * U, y + (barH - bh) / 2, bw, bh, bh / 2);
    ctx.fillStyle = badgeBg;
    ctx.fill();
    ctx.fillStyle = badgeFg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, x + w - bw / 2 - 16 * U, y + barH / 2 + 0.5 * U);
  }
  ctx.restore();

  // Outer specular border
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(17,17,16,0.12)';
  ctx.lineWidth = 1.5 * U;
  ctx.stroke();
  ctx.restore();
}

// ---------- 10. Physical Stencil Rubber Stamp (Cohulo signature mark) ----------
export function rubberStamp({
  label = 'LEAKS CAUGHT',
  x = CX,
  y = CY,
  rot = -6,
  tone = 'crimson',
  slamP = 1,
  scale = 1,
} = {}) {
  const sp = clamp(slamP);
  if (sp <= 0.001) return;
  const col = tone === 'emerald' ? '#15803D' : tone === 'coral' ? '#E8765E' : '#B91C1C';
  const sc = lerp(1.85, 1.0, eo4(sp)) * scale;
  const alpha = clamp(sp * 3.2, 0, 0.94);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(sc, sc);
  ctx.globalAlpha = alpha;

  ctx.font = fontSpec(700, 26 * U, B.stencilFont);
  const tw = ctx.measureText(label).width;
  const pw = tw + 34 * U;
  const ph = 52 * U;

  // Light backing tint so stamp stays ultra-legible over both dark & light imagery
  rr(ctx, -pw / 2, -ph / 2, pw, ph, 8 * U);
  ctx.fillStyle = rgba('#FAF9F7', 0.92);
  ctx.fill();

  // Outer distressed double stencil border
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.2 * U;
  rr(ctx, -pw / 2, -ph / 2, pw, ph, 8 * U);
  ctx.stroke();
  ctx.lineWidth = 1.3 * U;
  rr(ctx, -pw / 2 + 5 * U, -ph / 2 + 5 * U, pw - 10 * U, ph - 10 * U, 5 * U);
  ctx.stroke();

  ctx.fillStyle = col;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 1.5 * U);
  ctx.restore();
}

// ---------- 11. Floating Evidence Card Fan (fans radially around frosted glass capsule) ----------
export function floatingCardFan({ cards = [], lt = 1, gatherP = 0 } = {}) {
  const gp = eio(clamp(gatherP));
  cards.forEach((card, i) => {
    const enter = spring(Math.max(0, lt - i * 0.055), { stiffness: 235, damping: 21 });
    if (enter <= 0.01) return;
    const tx = lerp(lerp(CX, card.x, enter), CX, gp);
    const ty = lerp(lerp(CY, card.y, enter), CY, gp);
    const rot = lerp(((card.rot || 0) * Math.PI) / 180, 0, gp);
    const sc = lerp(lerp(0.65, 1, enter), 0.72, gp);
    const w = (card.w || 340) * U;
    const h = (card.h || 220) * U;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(enter * 1.4) * (1 - gp * 0.75);

    ctx.shadowColor = 'rgba(14,14,13,0.22)';
    ctx.shadowBlur = 34 * U;
    ctx.shadowOffsetY = 16 * U;
    rr(ctx, -w / 2, -h / 2, w, h, 18 * U);
    ctx.fillStyle = card.dark ? '#161615' : '#FFFFFF';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    rr(ctx, -w / 2, -h / 2, w, h, 18 * U);
    ctx.clip();
    if (card.draw) {
      card.draw(ctx, -w / 2, -h / 2, w, h);
    } else if (card.img) {
      drawCover(ctx, card.img, -w / 2, -h / 2, w, h, { panX: card.panX ?? 0.5, panY: card.panY ?? 0.1, zoom: card.zoom ?? 1.02 });
    }
    ctx.restore();

    rr(ctx, -w / 2, -h / 2, w, h, 18 * U);
    ctx.strokeStyle = card.dark ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 1.6 * U;
    ctx.stroke();

    if (card.caption) {
      ctx.font = fontSpec(600, 15 * U, B.bodyFont);
      const cw = ctx.measureText(card.caption).width + 24 * U;
      const ch = 30 * U;
      rr(ctx, -w / 2 + 12 * U, h / 2 - ch - 12 * U, cw, ch, ch / 2);
      ctx.fillStyle = 'rgba(17,17,16,0.82)';
      ctx.fill();
      ctx.fillStyle = '#FAF9F7';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.caption, -w / 2 + 24 * U, h / 2 - ch / 2 - 11.5 * U);
    }

    if (card.stamp && card.stampP > 0.01) {
      rubberStamp({
        label: card.stamp,
        x: w * 0.12,
        y: -h * 0.08,
        rot: -8,
        tone: card.stampTone || 'crimson',
        slamP: card.stampP,
        scale: 0.72,
      });
    }
    ctx.restore();
  });
}

// ---------- 12. Split Frosted-Glass Live Diff Card (Soar 0:19 live strikethrough edit) ----------
export function liveDiffGlassCard({
  x, y, w, h,
  header = 'Copy Swaps',
  badge = '+24% clearer value',
  beforeText = '',
  afterText = '',
  strikeP = 0,
  swapP = 0,
  ctaBefore = '',
  ctaAfter = '',
  ctaSwapP = 0,
} = {}) {
  frostedGlassCard({ x, y, w, h, r: 26 * U, dark: false, blurPx: 18, tintAlpha: 0.78 });

  const pad = 34 * U;
  ctx.save();
  // Header row
  ctx.font = fontSpec(700, 22 * U, B.displayFont);
  ctx.fillStyle = '#111110';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(header, x + pad, y + pad + 10 * U);

  if (badge) {
    ctx.font = fontSpec(700, 15 * U, B.monoFont);
    const bw = ctx.measureText(badge).width + 24 * U;
    const bh = 30 * U;
    rr(ctx, x + w - pad - bw, y + pad - 5 * U, bw, bh, bh / 2);
    ctx.fillStyle = rgba(B.emerald, 0.14);
    ctx.fill();
    ctx.fillStyle = B.emerald;
    ctx.textAlign = 'center';
    ctx.fillText(badge, x + w - pad - bw / 2, y + pad + 10.5 * U);
  }

  // Hairline divider
  ctx.fillStyle = 'rgba(17,17,16,0.08)';
  ctx.fillRect(x + pad, y + pad + 38 * U, w - pad * 2, 1.2 * U);

  // Label: HERO HEADLINE
  let curY = y + pad + 68 * U;
  ctx.font = fontSpec(700, 13 * U, B.monoFont);
  ctx.fillStyle = B.muted;
  ctx.textAlign = 'left';
  ctx.fillText('HERO HEADLINE', x + pad, curY);
  curY += 32 * U;

  // Before text + animated coral highlighter & strikethrough bar
  const maxTW = w - pad * 2;
  ctx.font = fontSpec(500, 29 * U, B.bodyFont);
  const bLines = wrapLines(ctx, beforeText, maxTW);
  const bAlpha = lerp(1, 0.36, eio(clamp(swapP)));
  const sp = eo4(clamp(strikeP));

  bLines.forEach((line, idx) => {
    const ly = curY + idx * 42 * U;
    const lw = ctx.measureText(line).width;
    if (sp > 0.01) {
      ctx.fillStyle = rgba(B.accent, 0.26 * (1 - clamp(swapP) * 0.55));
      rr(ctx, x + pad - 5 * U, ly - 17 * U, (lw + 10 * U) * sp, 34 * U, 6 * U);
      ctx.fill();
    }
    ctx.fillStyle = rgba('#111110', bAlpha);
    ctx.fillText(line, x + pad, ly);
    if (sp > 0.05) {
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(x + pad, ly, lw * sp, 2.8 * U);
    }
  });
  curY += bLines.length * 42 * U + 28 * U;

  // After text reveal
  const ap = eo4(seg(swapP, 0.25, 1.0));
  if (ap > 0.01) {
    ctx.save();
    ctx.globalAlpha = ap;
    ctx.font = fontSpec(700, 32 * U, B.displayFont);
    const aLines = wrapLines(ctx, afterText, maxTW);
    aLines.forEach((line, idx) => {
      const ly = curY + idx * 44 * U + (1 - ap) * 12 * U;
      const lw = ctx.measureText(line).width;
      ctx.fillStyle = rgba(B.emerald, 0.12);
      rr(ctx, x + pad - 6 * U, ly - 18 * U, lw + 12 * U, 36 * U, 7 * U);
      ctx.fill();
      ctx.fillStyle = '#111110';
      ctx.fillText(line, x + pad, ly);
    });
    curY += aLines.length * 44 * U + 40 * U;
    ctx.restore();
  } else {
    curY += 108 * U;
  }

  // Primary CTA swap row
  if (ctaBefore && ctaAfter) {
    ctx.fillStyle = 'rgba(17,17,16,0.08)';
    ctx.fillRect(x + pad, curY - 12 * U, maxTW, 1.2 * U);
    curY += 16 * U;
    ctx.font = fontSpec(700, 13 * U, B.monoFont);
    ctx.fillStyle = B.muted;
    ctx.fillText('PRIMARY CTA', x + pad, curY);
    curY += 34 * U;

    const cp = eo4(clamp(ctaSwapP));
    ctx.font = fontSpec(500, 21 * U, B.bodyFont);
    const cbw = ctx.measureText(ctaBefore).width;
    ctx.fillStyle = rgba('#111110', lerp(0.85, 0.38, cp));
    ctx.fillText(ctaBefore, x + pad, curY);
    if (cp > 0.04) {
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(x + pad, curY, cbw * clamp(cp * 1.4), 2.2 * U);
    }

    if (cp > 0.3) {
      const rp = seg(cp, 0.3, 1.0);
      const pillX = x + pad + cbw + 26 * U;
      ctx.save();
      ctx.globalAlpha = rp;
      ctx.font = fontSpec(700, 20 * U, B.bodyFont);
      const caw = ctx.measureText(ctaAfter).width + 32 * U;
      rr(ctx, pillX, curY - 21 * U, caw, 42 * U, 21 * U);
      ctx.fillStyle = B.accent;
      ctx.fill();
      ctx.fillStyle = '#111110';
      ctx.textAlign = 'center';
      ctx.fillText(ctaAfter, pillX + caw / 2, curY + 0.5 * U);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- 13. Annotated Workspace Callout Pill + Curved Pointer Arrow (Soar 0:26) ----------
export function calloutBubble({
  text = '',
  x, y,
  targetX, targetY,
  borderColor = B.accentDeep,
  curve = 0.24,
  popP = 1,
} = {}) {
  const sp = spring(clamp(popP, 0, 1.5), { stiffness: 280, damping: 21 });
  if (sp <= 0.02) return;

  ctx.save();
  // Curved Bezier connector line drawing smoothly from pill toward target
  const dx = targetX - x, dy = targetY - y;
  const mx = (x + targetX) / 2 - dy * curve;
  const my = (y + targetY) / 2 + dx * curve;
  const drawP = eo4(clamp(popP * 1.2));

  // Sample partial quadratic curve so line animates cleanly from pill to target
  const steps = 22;
  const maxStep = Math.max(1, Math.round(steps * drawP));
  ctx.beginPath();
  let last = [x, y], prev = [x, y];
  ctx.moveTo(x, y);
  for (let i = 1; i <= maxStep; i++) {
    const pt = bezier2([x, y], [mx, my], [targetX, targetY], i / steps);
    prev = last;
    last = pt;
    ctx.lineTo(pt[0], pt[1]);
  }
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.6 * U;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Crisp arrowhead at tip
  if (drawP > 0.72) {
    const ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    const head = 11 * U;
    ctx.save();
    ctx.translate(last[0], last[1]);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(2 * U, 0);
    ctx.lineTo(-head, -head * 0.55);
    ctx.lineTo(-head * 0.75, 0);
    ctx.lineTo(-head, head * 0.55);
    ctx.closePath();
    ctx.fillStyle = borderColor;
    ctx.fill();
    ctx.restore();
  }

  // Crisp white floating callout pill
  ctx.translate(x, y);
  ctx.scale(sp, sp);
  ctx.font = fontSpec(700, 20 * U, B.displayFont);
  const pw = ctx.measureText(text).width + 34 * U;
  const ph = 46 * U;
  ctx.shadowColor = 'rgba(17,17,16,0.22)';
  ctx.shadowBlur = 22 * U;
  ctx.shadowOffsetY = 8 * U;
  rr(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.2 * U;
  ctx.stroke();

  ctx.fillStyle = '#111110';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1 * U);
  ctx.restore();
}

// ---------- 14. Official Crisp Vector AI Builder Logos (from AiBuilderLogos.tsx) ----------
const BUILDER_PATHS = {
  claude: { vb: 24, d: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z' },
  codex: { vb: 24, d: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z' },
  antigravity: { vb: 16, vbh: 14, d: 'M14.0777 13.984C14.945 14.6345 16.2458 14.2008 15.0533 13.0084C11.476 9.53949 12.2349 0 7.79033 0C3.34579 0 4.10461 9.53949 0.527295 13.0084C-0.773543 14.3092 0.635692 14.6345 1.50293 13.984C4.86344 11.7076 4.64663 7.69664 7.79033 7.69664C10.934 7.69664 10.7172 11.7076 14.0777 13.984Z' },
  cursor: { vb: 24, d: 'M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23' },
  lovable: { vb: 24, d: 'M12 20.6C5.6 15.8 2.4 12.2 2.4 8.2C2.4 5.1 4.8 2.8 7.8 2.8C9.6 2.8 11.2 3.7 12 5.1C12.8 3.7 14.4 2.8 16.2 2.8C19.2 2.8 21.6 5.1 21.6 8.2C21.6 12.2 18.4 15.8 12 20.6Z' },
  v0: { vb: 24, d: 'M14.066 6.028v2.22h5.729q.075-.001.148.005l-5.853 5.752a2 2 0 0 1-.024-.309V8.247h-2.353v5.45c0 2.322 1.935 4.222 4.258 4.222h5.675v-2.22h-5.675q-.03 0-.059-.003l5.729-5.629q.006.082.006.166v5.465H24v-5.465a4.204 4.204 0 0 0-4.205-4.205zM0 8.245l8.28 9.266c.839.94 2.396.346 2.396-.914V8.245H8.19v5.44l-4.86-5.44Z' },
};
const _pathCache = new Map();
export function drawBuilderMark(id, cx, cy, size = 24, color = '#FAF9F7') {
  const spec = BUILDER_PATHS[id];
  if (!spec) return;
  let p2d = _pathCache.get(id);
  if (!p2d) { p2d = new Path2D(spec.d); _pathCache.set(id, p2d); }
  const vbw = spec.vb, vbh = spec.vbh || spec.vb;
  const s = (size * U) / Math.max(vbw, vbh);
  ctx.save();
  ctx.translate(cx - (vbw * s) / 2, cy - (vbh * s) / 2);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fill(p2d);
  ctx.restore();
}

// ---------- 15. Studio Cross-Shot Transitions (Mosaic, Pill-Portal, Optical Whip-Pan, Mist) ----------
export function composeTransition(dst, bufA, bufB, pRaw, spec = {}) {
  const p = clamp(pRaw);
  const type = spec.type || 'fade';

  if (type === 'mosaic') {
    // Soar 0:25 diagonal pixel-mosaic block dissolve wipe with shimmering optical edge tiles
    const tile = Math.round((spec.tile || 36) * U);
    const cols = Math.ceil(W / tile);
    const rows = Math.ceil(H / tile);
    const palette = spec.palette || [B.accent, '#FAF9F7', '#93C5FD', '#161615'];

    dst.drawImage(bufA, 0, 0);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const wave = (c / cols) * 0.48 + (r / rows) * 0.32 + rnd(idx * 7.13) * 0.24;
        const cellP = p * 1.52 - wave;
        if (cellP <= 0) continue;
        const x = c * tile, y = r * tile;
        const tw = Math.min(tile, W - x), th = Math.min(tile, H - y);
        if (cellP < 0.28) {
          dst.fillStyle = palette[idx % palette.length];
          dst.fillRect(x, y, tw, th);
        } else {
          dst.drawImage(bufB, x, y, tw, th, x, y, tw, th);
        }
      }
    }
    return;
  }

  if (type === 'pill-expand') {
    // Horizontal rounded pill-portal expanding explosively into full-bleed bufB
    dst.drawImage(bufA, 0, 0);
    const ep = eo4(p);
    const pw = lerp((spec.startW || 680) * U, W * 1.06, ep);
    const ph = lerp((spec.startH || 76) * U, H * 1.06, ep);
    const pr = lerp(38 * U, 0, ep);
    dst.save();
    rr(dst, CX - pw / 2, CY - ph / 2, pw, ph, pr);
    dst.clip();
    dst.drawImage(bufB, 0, 0);
    dst.restore();
    return;
  }

  if (type === 'whip') {
    // Real directional multi-tap optical whip-pan motion blur (zero colored bars!)
    const dir = spec.dir === 'right' ? 1 : -1;
    const ep = eio(p);
    const vel = Math.sin(p * Math.PI);
    const shift = ep * W * dir;
    const taps = 7;
    dst.save();
    dst.clearRect(0, 0, W, H);
    for (let i = 0; i < taps; i++) {
      const off = (i - (taps - 1) / 2) * vel * 22 * U * dir;
      dst.globalAlpha = i === 0 ? 1 : 1 / (i + 1.4);
      dst.drawImage(bufA, shift + off, 0);
      dst.drawImage(bufB, shift - W * dir + off, 0);
    }
    dst.restore();
    return;
  }

  if (type === 'mist') {
    // Bright sunlit exposure bloom bridge
    const peak = Math.sin(p * Math.PI);
    dst.drawImage(p < 0.5 ? bufA : bufB, 0, 0);
    dst.save();
    dst.fillStyle = spec.color || '#FAF9F7';
    dst.globalAlpha = peak * (spec.intensity ?? 0.88);
    dst.fillRect(0, 0, W, H);
    dst.restore();
    return;
  }

  // Clean crossfade
  dst.drawImage(bufA, 0, 0);
  dst.save();
  dst.globalAlpha = eio(p);
  dst.drawImage(bufB, 0, 0);
  dst.restore();
}
