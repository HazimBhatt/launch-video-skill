// Macro Studio Motion Kit — Apple/Base44-caliber single-focus beat choreography.
// Alternates warm alabaster studio (#EFECE6), matte carbon (#161719), soft aurora bokeh, and full-bleed UI macro pans.
// Zero pulse dots, zero AI sparkles, zero cramped multi-card dashboards.
import {
  ctx, W, H, CX, CY, U, PORTRAIT, TAU, clamp, lerp, seg, eo, eio, spring,
  rr, circle, line, fillAll, imageCover, imageViewport, wrapLines, rgba, mixHex,
} from './lib.js';
import { B } from './brand.js';

export const displayFont = () => `'${B.displayFont || 'Inter'}', 'DM Sans', 'Inter', sans-serif`;
export const uiFont = () => `'Inter', 'DM Sans', sans-serif`;
export const monoFont = () => `'JetBrains Mono', 'FreeMono', monospace`;
export const UI_FONT = `'Inter', 'DM Sans', sans-serif`;

// Cached tiny offscreen canvas for fast luminous Gaussian-smooth bokeh backgrounds
let _bokehCv = null;
function getBokehCanvas() {
  if (!_bokehCv && typeof document !== 'undefined') {
    _bokehCv = document.createElement('canvas');
    _bokehCv.width = 160;
    _bokehCv.height = 90;
  }
  return _bokehCv;
}

/** Crisp geometric outline glyphs (clock, chain, trophy, swords, shield, check, arrow). */
export function drawGlyph(kind, cx, cy, r = 16 * U, color = '#141413', lw = Math.max(2, r * 0.16)) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'clock') {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.48); ctx.moveTo(0, 0); ctx.lineTo(r * 0.36, r * 0.14); ctx.stroke();
  } else if (kind === 'chain') {
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath(); ctx.roundRect(-r * 0.86, -r * 0.34, r * 0.94, r * 0.68, r * 0.34); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-r * 0.08, -r * 0.34, r * 0.94, r * 0.68, r * 0.34); ctx.stroke();
  } else if (kind === 'shield') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.84);
    ctx.lineTo(r * 0.72, -r * 0.52);
    ctx.lineTo(r * 0.72, r * 0.08);
    ctx.quadraticCurveTo(r * 0.68, r * 0.64, 0, r * 0.9);
    ctx.quadraticCurveTo(-r * 0.68, r * 0.64, -r * 0.72, r * 0.08);
    ctx.lineTo(-r * 0.72, -r * 0.52);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'swords') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.66, r * 0.66); ctx.lineTo(r * 0.66, -r * 0.66);
    ctx.moveTo(r * 0.66, r * 0.66); ctx.lineTo(-r * 0.66, -r * 0.66);
    ctx.moveTo(-r * 0.44, r * 0.16); ctx.lineTo(-r * 0.16, r * 0.44);
    ctx.moveTo(r * 0.44, r * 0.16); ctx.lineTo(r * 0.16, r * 0.44);
    ctx.stroke();
  } else if (kind === 'trophy') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.56, -r * 0.64); ctx.lineTo(r * 0.56, -r * 0.64);
    ctx.quadraticCurveTo(r * 0.5, r * 0.16, 0, r * 0.24);
    ctx.quadraticCurveTo(-r * 0.5, r * 0.16, -r * 0.56, -r * 0.64);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, r * 0.24); ctx.lineTo(0, r * 0.68); ctx.moveTo(-r * 0.36, r * 0.68); ctx.lineTo(r * 0.36, r * 0.68); ctx.stroke();
  } else if (kind === 'check') {
    ctx.beginPath(); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(-r * 0.14, r * 0.46); ctx.lineTo(r * 0.66, -r * 0.46); ctx.stroke();
  } else if (kind === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, 0); ctx.lineTo(r * 0.55, 0);
    ctx.moveTo(r * 0.1, -r * 0.42); ctx.lineTo(r * 0.55, 0); ctx.lineTo(r * 0.1, r * 0.42);
    ctx.stroke();
  } else if (kind === 'file') {
    ctx.beginPath();
    ctx.roundRect(-r * 0.58, -r * 0.72, r * 1.16, r * 1.44, r * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.26, -r * 0.18); ctx.lineTo(r * 0.26, -r * 0.18);
    ctx.moveTo(-r * 0.26, r * 0.22); ctx.lineTo(r * 0.18, r * 0.22);
    ctx.stroke();
  } else if (kind === 'warn') {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -r * 0.38); ctx.lineTo(0, r * 0.08); ctx.stroke();
    circle(0, r * 0.38, Math.max(1.5, r * 0.09), color);
  }
  ctx.restore();
}

/** 1. Warm tactile alabaster studio canvas (#EFECE6) with whisper soft edge falloff. */
export function sandBg(t = 0, { tint = B.accent, tintMix = 0.025, skyHorizon = 0 } = {}) {
  const top = mixHex('#EFECE6', tint, tintMix);
  const bot = skyHorizon > 0 ? mixHex('#E7E4DC', '#CBE4EE', skyHorizon) : mixHex('#EAE6DE', tint, tintMix * 1.4);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  fillAll('#EFECE6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const vg = ctx.createRadialGradient(CX, CY, Math.min(W, H) * 0.22, CX, CY, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(255,255,255,0.22)');
  vg.addColorStop(1, 'rgba(20,20,19,0.045)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  void t;
}

/** 2. Matte filmic carbon studio (#161719) for code/terminal/matrix contrast beats. */
export function carbonBg(t = 0, { glow = B.accent, glowAlpha = 0.06 } = {}) {
  fillAll('#161719');
  const g = ctx.createRadialGradient(CX, CY * 0.85, 0, CX, CY * 0.85, Math.max(W, H) * 0.65);
  g.addColorStop(0, rgba(glow, glowAlpha));
  g.addColorStop(1, 'rgba(22,23,25,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  void t;
}

/** 3. Soft organic luminous gradient mesh bokeh (fast low-res blurred offscreen wash). */
export function bokehMeshBg(t = 0, {
  base = '#EFECE6',
  colors = ['#F4A261', '#E76F51', '#7DD3FC', B.accent],
  intensity = 0.65,
} = {}) {
  const bcv = getBokehCanvas();
  if (!bcv) {
    sandBg(t);
    return;
  }
  const bc = bcv.getContext('2d');
  const bw = bcv.width, bh = bcv.height;
  bc.fillStyle = base;
  bc.fillRect(0, 0, bw, bh);

  const orbs = [
    [0.24 + Math.sin(t * 0.9) * 0.08, 0.36 + Math.cos(t * 0.7) * 0.09, 0.42, colors[0]],
    [0.74 + Math.cos(t * 0.8) * 0.09, 0.34 + Math.sin(t * 0.6) * 0.08, 0.44, colors[1 % colors.length]],
    [0.52 + Math.sin(t * 0.65 + 1.4) * 0.1, 0.72 + Math.cos(t * 0.55) * 0.07, 0.46, colors[2 % colors.length]],
    [0.36 + Math.cos(t * 0.5 + 2.1) * 0.1, 0.64 + Math.sin(t * 0.75) * 0.08, 0.38, colors[3 % colors.length]],
  ];
  orbs.forEach(([ux, uy, rad, col]) => {
    const cx = ux * bw, cy = uy * bh, r = rad * Math.max(bw, bh);
    const rg = bc.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, rgba(col, intensity));
    rg.addColorStop(0.55, rgba(col, intensity * 0.35));
    rg.addColorStop(1, rgba(col, 0));
    bc.fillStyle = rg;
    bc.fillRect(0, 0, bw, bh);
  });

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = `blur(${Math.round(28 * U)}px)`;
  ctx.drawImage(bcv, -40, -40, W + 80, H + 80);
  ctx.filter = 'none';
  ctx.restore();
}

/** 4. Horizontal motion-blur smeared blocks for tactile bridge transitions (120-260ms fast whip). */
export function velocitySmear(p, { colors = ['#F59E0B', '#EC4899', B.accent, '#FB923C'], bg = '#EFECE6' } = {}) {
  sandBg(0);
  void bg;
  const k = clamp(p);
  const rows = [
    { x: lerp(0.52, -0.15, k), y: 0.21, w: 0.24, h: 0.11, c: colors[0] },
    { x: lerp(0.14, 0.62, k), y: 0.34, w: 0.34, h: 0.12, c: colors[1 % colors.length] },
    { x: lerp(0.32, 0.12, k), y: 0.50, w: 0.46, h: 0.13, c: colors[2 % colors.length] },
    { x: lerp(0.65, 0.28, k), y: 0.66, w: 0.22, h: 0.11, c: colors[3 % colors.length] },
    { x: lerp(0.18, 0.56, k), y: 0.78, w: 0.24, h: 0.11, c: colors[0] },
  ];
  ctx.save();
  ctx.filter = `blur(${Math.round(22 * U)}px)`;
  rows.forEach((b) => {
    const g = ctx.createLinearGradient(b.x * W, 0, (b.x + b.w) * W, 0);
    g.addColorStop(0, rgba(b.c, 0.25));
    g.addColorStop(0.5, rgba(b.c, 0.85));
    g.addColorStop(1, rgba(colors[(colors.indexOf(b.c) + 1) % colors.length], 0.45));
    ctx.fillStyle = g;
    ctx.fillRect(b.x * W, b.y * H, b.w * W, b.h * H);
  });
  ctx.filter = 'none';
  ctx.restore();
}

/** 5. Kinetic bare syntax/proof scatter cloud around 1 ultra-clean focal headline. */
export function scatterSyntaxCloud({
  headline = 'Build products',
  sub = '',
  tokens = [],
  lt = 1,
  disperse = 0,
  dark = false,
} = {}) {
  const ink = dark ? '#F5F4F0' : '#141413';
  const hi = B.accent;
  const d = eo(clamp(disperse));

  // Orbiting code / proof tokens sliding smoothly outward on beat 2
  tokens.forEach((tk, idx) => {
    const p = spring(Math.max(0, lt - idx * 0.02), { stiffness: 220, damping: 22 });
    const a = clamp(p) * (1 - clamp((d - 0.55) / 0.45));
    if (a <= 0.01) return;
    const tx = CX + (tk.dx + tk.dx * 0.65 * d) * (PORTRAIT ? W * 0.44 : W * 0.42);
    const ty = CY + (tk.dy + tk.dy * 0.55 * d) * (PORTRAIT ? H * 0.36 : H * 0.42);
    ctx.save();
    ctx.globalAlpha = a * (tk.alpha ?? 0.88);
    ctx.font = `500 ${Math.round((tk.size || 24) * U)}px ${monoFont()}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = tk.accent ? hi : tk.muted ? (dark ? '#9CA3AF' : '#57534E') : ink;
    ctx.fillText(tk.txt, tx, ty);
    ctx.restore();
  });

  // Clean central anchor copy (refined studio weight + tight architectural tracking)
  const sp = lerp(0.92, 1, spring(lt, { stiffness: 260, damping: 24 }));
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(sp, sp);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = Math.round((PORTRAIT ? 60 : 72) * U);
  ctx.font = `600 ${fs}px ${displayFont()}`;
  ctx.letterSpacing = `${-Math.round(fs * 0.035)}px`;
  ctx.fillStyle = ink;
  const lines = wrapLines(headline, W * 0.84, ctx.font);
  const lh = fs * 1.15;
  const y0 = -(lines.length - 1) * lh * 0.5;
  lines.forEach((ln, i) => ctx.fillText(ln, 0, y0 + i * lh));
  if (sub) {
    ctx.letterSpacing = '0px';
    ctx.font = `500 ${Math.round(22 * U)}px ${monoFont()}`;
    ctx.fillStyle = hi;
    ctx.fillText(sub, 0, y0 + lines.length * lh + 18 * U);
  }
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/** 6. Solitary minimalist Prompt / Input Studio Card floating in vast negative space. */
export function solitaryPromptCard({
  typed = '', placeholder = 'Enter your product URL...', caret = true, pressed = 0,
  btnText = '', glyph = 'arrow', scale = 1, lt = 1,
} = {}) {
  if (scale <= 0.01) return;
  const w = PORTRAIT ? W * 0.86 : 940 * U;
  const h = PORTRAIT ? 270 * U : 240 * U;
  const pad = 34 * U;
  const x = CX - w / 2, y = CY - h / 2;
  const reveal = lerp(0.94, 1, spring(lt, { stiffness: 250, damping: 22 }));

  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(scale * reveal, scale * reveal);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(20,20,19,0.09)';
  ctx.shadowBlur = 46 * U;
  ctx.shadowOffsetY = 18 * U;
  rr(0, 0, w, h, 26 * U);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(20,20,19,0.08)';
  ctx.stroke();

  // Multi-line crisp body input copy
  const show = typed || placeholder;
  const fs = Math.round((PORTRAIT ? 30 : 28) * U);
  ctx.font = `500 ${fs}px ${displayFont()}`;
  const textMaxW = w - pad * 2 - 96 * U;
  const lines = wrapLines(show, textMaxW, ctx.font);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = typed ? '#18181B' : '#9CA3AF';
  lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, pad, pad + i * (fs * 1.38)));

  if (caret) {
    const lastIdx = Math.min(2, Math.max(0, lines.length - 1));
    const lastW = typed ? ctx.measureText(lines[lastIdx] || '').width : 0;
    ctx.fillStyle = '#18181B';
    ctx.fillRect(pad + lastW + 4 * U, pad + lastIdx * (fs * 1.38) + 4 * U, 2.5 * U, fs * 1.02);
  }

  // Subtle '+' glyph bottom-left like studio prompt composer
  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 2.4 * U;
  ctx.lineCap = 'round';
  const plusX = pad + 14 * U, plusY = h - pad - 10 * U;
  ctx.beginPath();
  ctx.moveTo(plusX - 10 * U, plusY); ctx.lineTo(plusX + 10 * U, plusY);
  ctx.moveTo(plusX, plusY - 10 * U); ctx.lineTo(plusX, plusY + 10 * U);
  ctx.stroke();

  // Top-right dark rounded submit square / pill
  const bSize = 68 * U;
  ctx.save();
  const bx = w - pad - bSize / 2, by = pad + bSize / 2;
  ctx.translate(bx, by);
  const sq = 1 - pressed * 0.1;
  ctx.scale(sq, sq);
  if (btnText) {
    ctx.font = `600 ${Math.round(19 * U)}px ${displayFont()}`;
    const bw = Math.max(bSize, ctx.measureText(btnText).width + 44 * U);
    rr(-bw / 2, -bSize / 2, bw, bSize, 18 * U);
    ctx.fillStyle = pressed > 0.2 ? B.accent : '#141413';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btnText, 0, 1);
  } else {
    rr(-bSize / 2, -bSize / 2, bSize, bSize, 18 * U);
    ctx.fillStyle = pressed > 0.2 ? B.accent : '#141413';
    ctx.fill();
    drawGlyph(glyph, 0, 0, 18 * U, '#FFFFFF', 2.8 * U);
  }
  ctx.restore();
  ctx.restore();
  void x; void y;
}

/** 7. Oversized macro File/Architecture Tree zooming smoothly upward over empty canvas. */
export function macroFileTree({
  rows = [], scrollY = 0, activeIdx = 0, scale = 1, lt = 1,
} = {}) {
  const startX = PORTRAIT ? 110 * U : 320 * U;
  const startY = PORTRAIT ? 520 * U : 320 * U;
  const rowGap = (PORTRAIT ? 98 : 88) * U;
  const indentStep = (PORTRAIT ? 64 : 118) * U;
  const rev = lerp(0.95, 1, spring(lt, { stiffness: 220, damping: 24 }));

  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(scale * rev, scale * rev);
  ctx.translate(-CX, -CY);

  rows.forEach((row, i) => {
    const ry = startY + i * rowGap - scrollY * U;
    const rx = startX + (row.depth || 0) * indentStep;
    const isAct = i === activeIdx || row.active;
    const distAlpha = clamp(1 - Math.abs(ry - CY) / (H * 0.65));
    const a = (isAct ? 1 : row.depth === 0 ? 0.92 : 0.34) * distAlpha;
    if (a <= 0.02) return;

    // Fine vertical tree guide line
    if ((row.depth || 0) > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(20,20,19,0.1)';
      ctx.lineWidth = 1.5;
      const gx = startX + (row.depth - 1) * indentStep + 14 * U;
      ctx.beginPath();
      ctx.moveTo(gx, ry - rowGap * 0.65);
      ctx.lineTo(gx, ry + rowGap * 0.35);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = a;
    if (row.kind === 'folder') {
      // Crisp chevron icon
      ctx.strokeStyle = '#141413';
      ctx.lineWidth = 2.6 * U;
      ctx.beginPath();
      ctx.moveTo(rx - 30 * U, ry - 6 * U);
      ctx.lineTo(rx - 20 * U, ry + 5 * U);
      ctx.lineTo(rx - 10 * U, ry - 6 * U);
      ctx.stroke();
    } else {
      drawGlyph(row.glyph || 'file', rx - 22 * U, ry, 16 * U, isAct ? B.accent : '#57534E', 2.2 * U);
    }

    const fs = Math.round((row.depth === 0 ? (PORTRAIT ? 46 : 54) : (PORTRAIT ? 38 : 46)) * U);
    ctx.font = `${isAct || row.depth === 0 ? 600 : 500} ${fs}px ${displayFont()}`;
    ctx.letterSpacing = `${-Math.round(fs * 0.03)}px`;
    ctx.fillStyle = isAct ? (row.accent ? B.accent : '#141413') : '#141413';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.label, rx + 8 * U, ry);
    ctx.letterSpacing = '0px';
    ctx.restore();
  });

  ctx.restore();
}

/** 8. Centered icon morphing horizontally into two hairline-bordered studio capsules. */
export function morphConnector({
  leftText = 'Submit URL', rightText = '1v1 Arena', glyph = 'chain',
  openP = 1, scale = 1, lt = 1,
} = {}) {
  const k = eio(clamp(openP));
  const sp = lerp(0.84, 1, spring(lt, { stiffness: 250, damping: 21 }));
  const fs = Math.round((PORTRAIT ? 28 : 30) * U);
  const pillH = 68 * U;
  const midR = 26 * U;

  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(scale * sp, scale * sp);
  ctx.font = `600 ${fs}px ${displayFont()}`;

  const lw = ctx.measureText(leftText).width + 52 * U;
  const rw = ctx.measureText(rightText).width + 52 * U;
  const gap = 14 * U;

  if (k > 0.04) {
    ctx.save();
    ctx.globalAlpha = clamp((k - 0.04) * 2.5);
    const lCenter = lerp(0, -(midR + gap + lw / 2), k);
    rr(lCenter - lw / 2, -pillH / 2, lw, pillH, pillH / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2.4 * U;
    ctx.strokeStyle = '#141413';
    ctx.stroke();
    ctx.fillStyle = '#141413';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(leftText, lCenter, 1);

    const rCenter = lerp(0, midR + gap + rw / 2, k);
    rr(rCenter - rw / 2, -pillH / 2, rw, pillH, pillH / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#141413';
    ctx.stroke();
    ctx.fillStyle = '#141413';
    ctx.fillText(rightText, rCenter, 1);
    ctx.restore();
  }

  // Center luminous circular node
  ctx.shadowColor = rgba(B.accent, 0.28);
  ctx.shadowBlur = 22 * U;
  circle(0, 0, midR, '#FFFFFF');
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.6 * U;
  ctx.strokeStyle = B.accent;
  ctx.stroke();
  drawGlyph(glyph, 0, 0, 15 * U, B.accent, 2.4 * U);
  ctx.restore();
}

/** 9. Oversized macro Timeline / Battle Queue horizontal scrub zoom. */
export function macroTimelineScrub({
  columns = ['00h', '04h', '12h', '24h', '36h', '48h'],
  lanes = [],
  scrubP = 0,
  zoom = 1,
} = {}) {
  const topY = PORTRAIT ? 220 * U : 110 * U;
  const colW = (PORTRAIT ? 260 : 320) * U;
  const rowH = (PORTRAIT ? 128 : 114) * U;
  const gapY = 22 * U;
  const totalW = columns.length * colW;
  const ox = CX - (totalW * 0.5) - lerp(-140, 260, eio(clamp(scrubP))) * U;

  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(zoom, zoom);
  ctx.translate(-CX, -CY);

  // Subtle vertical timeline day/hour grid
  columns.forEach((col, ci) => {
    const cx = ox + ci * colW;
    ctx.strokeStyle = 'rgba(20,20,19,0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, H - 80 * U);
    ctx.stroke();

    ctx.font = `600 ${Math.round(34 * U)}px ${displayFont()}`;
    ctx.fillStyle = ci === 1 || ci === 5 ? '#141413' : '#A8A29E';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(col, cx + 18 * U, topY);
  });

  // Clean horizontal time blocks
  lanes.forEach((blk, i) => {
    const bx = ox + blk.col * colW + 14 * U;
    const by = topY + 96 * U + blk.row * (rowH + gapY);
    const bw = (blk.span || 1.6) * colW - 28 * U;
    const sp = lerp(0.92, 1, spring(clamp(scrubP * 3 + (1 - i * 0.1)), { stiffness: 220, damping: 22 }));
    ctx.save();
    ctx.translate(bx + bw / 2, by + rowH / 2);
    ctx.scale(sp, sp);
    ctx.translate(-bw / 2, -rowH / 2);

    ctx.shadowColor = 'rgba(20,20,19,0.07)';
    ctx.shadowBlur = 20 * U;
    ctx.shadowOffsetY = 8 * U;
    rr(0, 0, bw, rowH, 20 * U);
    ctx.fillStyle = blk.accent ? B.accent : blk.tint || '#FAF7F0';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = blk.accent ? B.accent : 'rgba(20,20,19,0.12)';
    ctx.stroke();

    const fg = blk.accent ? B.onAccent : '#141413';
    ctx.fillStyle = fg;
    ctx.font = `600 ${Math.round(24 * U)}px ${displayFont()}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(blk.title, 26 * U, rowH * 0.36);

    if (blk.sub) {
      ctx.fillStyle = blk.accent ? rgba(B.onAccent, 0.88) : '#57534E';
      ctx.font = `500 ${Math.round(16 * U)}px ${monoFont()}`;
      ctx.fillText(blk.sub, 26 * U, rowH * 0.68);
    }
    ctx.restore();
  });

  ctx.restore();
}

/** 10. Full-bleed edge-to-edge or crisp studio screenshot bleed with massive overlay display type. */
export function macroStageBleed(img, {
  zoom = 1.06, panX = 0.5, panY = 0.35, cover = true,
  displayText = '', scrim = 0.25, radius = 0, inset = 0, scale = 1,
  card = false, portraitCard = false, crop = null, desktopCrop = null, bg = 'sand', lt = 1,
} = {}) {
  const x = inset * U, y = inset * U, w = W - x * 2, h = H - y * 2;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -H / 2);

  if ((card || (PORTRAIT && portraitCard)) && img && img.width && img.height) {
    if (bg === 'dark') carbonBg(lt);
    else sandBg(lt);

    const c = PORTRAIT ? (crop || desktopCrop) : (desktopCrop || crop);
    const sx0 = (c?.x ?? 0) * img.width;
    const sy0 = (c?.y ?? 0) * img.height;
    const sw0 = (c?.w ?? 1) * img.width;
    const sh0 = (c?.h ?? 1) * img.height;
    const srcRatio = sw0 / Math.max(1, sh0);

    const maxW = PORTRAIT ? W * 0.92 : W * 0.84;
    const maxH = PORTRAIT ? H * 0.72 : H * 0.78;
    let cw = maxW;
    let ch = cw / srcRatio;
    if (ch > maxH) {
      ch = maxH;
      cw = ch * srcRatio;
    }

    const cx0 = (W - cw) / 2;
    const cy0 = (H - ch) / 2;
    const r = radius || 24 * U;
    const cardZoom = cover === false ? clamp(zoom, 0.88, 1.18) : 1;
    const z = cover === false ? 1 : Math.max(1, zoom);
    const sw = sw0 / z, sh = sh0 / z;
    const sx = sx0 + (sw0 - sw) * clamp(panX);
    const sy = sy0 + (sh0 - sh) * clamp(panY);

    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(cardZoom, cardZoom);
    ctx.translate(-CX, -CY);

    ctx.shadowColor = bg === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(20,20,19,0.16)';
    ctx.shadowBlur = 44 * U;
    ctx.shadowOffsetY = 18 * U;
    rr(cx0, cy0, cw, ch, r);
    ctx.fillStyle = bg === 'dark' ? '#1E181A' : '#FFFFFF';
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save();
    rr(cx0, cy0, cw, ch, r);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, cx0, cy0, cw, ch);
    if (scrim > 0) {
      ctx.fillStyle = `rgba(18,17,16,${scrim})`;
      ctx.fillRect(cx0, cy0, cw, ch);
    }
    ctx.restore();
    rr(cx0, cy0, cw, ch, r);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = bg === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(20,20,19,0.1)';
    ctx.stroke();

    ctx.restore();
    ctx.restore();
    return;
  }

  if (radius > 0) {
    ctx.shadowColor = 'rgba(20,20,19,0.22)';
    ctx.shadowBlur = 44 * U;
    ctx.shadowOffsetY = 18 * U;
    rr(x, y, w, h, radius);
    ctx.fillStyle = '#161719';
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }
  if (img) {
    if (desktopCrop && img.width && img.height) {
      const z = Math.max(1, zoom);
      const sw0 = (desktopCrop.w ?? 1) * img.width;
      const sh0 = (desktopCrop.h ?? 1) * img.height;
      const sx0 = (desktopCrop.x ?? 0) * img.width;
      const sy0 = (desktopCrop.y ?? 0) * img.height;
      const boxRatio = w / h, cropRatio = sw0 / sh0;
      let sw = sw0, sh = sh0;
      if (cover) {
        if (cropRatio > boxRatio) sw = sh0 * boxRatio;
        else sh = sw0 / boxRatio;
      }
      sw /= z; sh /= z;
      const sx = sx0 + (sw0 - sw) * clamp(panX);
      const sy = sy0 + (sh0 - sh) * clamp(panY);
      ctx.save();
      if (radius > 0) { rr(x, y, w, h, radius); ctx.clip(); }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      ctx.restore();
    } else if (cover) {
      imageCover(img, x, y, w, h, { zoom, fx: panX, fy: panY, radius });
    } else {
      imageViewport(img, x, y, w, h, { zoom, panX, panY, radius });
    }
  }
  if (scrim > 0) {
    ctx.save();
    if (radius > 0) { rr(x, y, w, h, radius); ctx.clip(); }
    ctx.fillStyle = `rgba(18,17,16,${scrim})`;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  if (displayText) {
    const fs = Math.round((PORTRAIT ? 80 : 112) * U);
    ctx.font = `700 ${fs}px ${displayFont()}`;
    ctx.letterSpacing = `${-Math.round(fs * 0.04)}px`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 24 * U;
    const lines = wrapLines(displayText, w * 0.88, ctx.font);
    const lh = fs * 1.05;
    lines.forEach((ln, idx) => ctx.fillText(ln, W / 2, H / 2 - (lines.length - 1) * lh * 0.5 + idx * lh));
    ctx.shadowColor = 'transparent';
    ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

/** 11. Sleek floating Phone Showcase centered over luminous bokeh with optional live timer badge. */
export function floatingPhoneStage({
  img = null, zoom = 1.0, panY = 0, timerText = '', statText = '', statLabel = '',
  t = 0, scale = 1, lt = 1,
} = {}) {
  bokehMeshBg(t, { colors: ['#7DD3FC', '#FDE68A', '#F9A8D4', B.accent], intensity: 0.72 });
  const pw = PORTRAIT ? 520 * U : 400 * U;
  const ph = PORTRAIT ? 1020 * U : 790 * U;
  const r = 56 * U;
  const bez = 16 * U;
  const reveal = lerp(0.9, 1, spring(lt, { stiffness: 230, damping: 22 }));

  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(scale * reveal, scale * reveal);

  ctx.shadowColor = 'rgba(20,20,19,0.26)';
  ctx.shadowBlur = 50 * U;
  ctx.shadowOffsetY = 22 * U;
  rr(-pw / 2, -ph / 2, pw, ph, r);
  ctx.fillStyle = '#141413';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  if (img) {
    imageViewport(img, -pw / 2 + bez, -ph / 2 + bez, pw - bez * 2, ph - bez * 2, {
      zoom, panX: 0.5, panY, radius: r - bez * 0.7,
    });
  }

  // Dynamic Island pill at top
  rr(-54 * U, -ph / 2 + bez + 14 * U, 108 * U, 24 * U, 12 * U);
  ctx.fillStyle = '#09090B';
  ctx.fill();

  // Optional clean live overlay readout near bottom of phone frame
  if (timerText || statText) {
    const bx = -pw / 2 + bez, bw = pw - bez * 2, bh = 168 * U, by = ph / 2 - bez - bh;
    ctx.save();
    rr(bx, by, bw, bh, [0, 0, r - bez * 0.7, r - bez * 0.7]);
    ctx.clip();
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, 'rgba(18,17,16,0)');
    g.addColorStop(0.35, 'rgba(18,17,16,0.72)');
    g.addColorStop(1, 'rgba(18,17,16,0.96)');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);

    if (statText) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round((PORTRAIT ? 26 : 22) * U)}px ${displayFont()}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(statText, bx + 24 * U, by + bh - 72 * U, bw - 48 * U);
    }
    let labelLeft = bx + bw - 24 * U;
    if (statLabel) {
      ctx.font = `500 ${Math.round((PORTRAIT ? 13 : 12) * U)}px ${monoFont()}`;
      const lpw = ctx.measureText(statLabel).width + 18 * U;
      const lph = 26 * U;
      const lpx = bx + bw - 22 * U - lpw;
      const lpy = by + bh - 33 * U - lph / 2;
      labelLeft = lpx - 10 * U;
      rr(lpx, lpy, lpw, lph, 8 * U);
      ctx.fillStyle = rgba(B.accent, 0.22);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(B.accentBright, 0.55);
      ctx.stroke();
      ctx.fillStyle = B.accentBright;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(statLabel, lpx + lpw / 2, lpy + lph / 2 + 0.5);
    }
    if (timerText) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round((PORTRAIT ? 35 : 31) * U)}px ${monoFont()}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(timerText, bx + 24 * U, by + bh - 33 * U, Math.max(80 * U, labelLeft - (bx + 24 * U)));
    }
    ctx.restore();
  }
  ctx.restore();
}

/** 12. Oversized full-screen Terminal Syntax Typing beat on Matte Carbon studio (#161719). */
export function terminalTypeScreen({
  tokens = [
    { text: '→', color: '#65A30D' },
    { text: 'submit', color: '#FFFFFF' },
    { text: 'product', color: '#EAB308' },
    { text: 'live', color: '#7DD3FC' },
  ],
  typedChars = 999,
  caret = true,
  lt = 1,
} = {}) {
  carbonBg(lt);
  const full = tokens.map((t) => t.text).join(' ');
  const visLen = Math.min(full.length, Math.max(0, Math.round(typedChars)));
  const fs = Math.round((PORTRAIT ? 46 : 78) * U);

  ctx.save();
  ctx.font = `500 ${fs}px ${monoFont()}`;
  const sp = ctx.measureText(' ').width * 0.72;

  // Measure visible slices cleanly across token color segments
  const parts = [];
  let rem = visLen;
  for (let i = 0; i < tokens.length && rem > 0; i++) {
    if (i > 0) rem -= 1; // space
    if (rem <= 0) break;
    const take = tokens[i].text.slice(0, rem);
    rem -= take.length;
    parts.push({ text: take, color: tokens[i].color });
  }

  const totalW = parts.reduce((acc, p, idx) => acc + ctx.measureText(p.text).width + (idx > 0 ? sp : 0), 0);
  let cx = CX - totalW / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  parts.forEach((p, idx) => {
    if (idx > 0) cx += sp;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, cx, CY);
    cx += ctx.measureText(p.text).width;
  });

  if (caret) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx + 8 * U, CY - fs * 0.56, 6 * U, fs * 1.12);
  }
  ctx.restore();
}

/** 13. Full-bleed zoomed Code / Metadata Slab with crisp syntax highlights on Matte Carbon. */
export function codeEditorSlab({ lines = [], scrollP = 0, highlightIdx = -1, lt = 1 } = {}) {
  carbonBg(lt, { glowAlpha: 0.04 });
  const fs = Math.round((PORTRAIT ? 21 : 25) * U);
  const lh = fs * 1.68;
  const startX = PORTRAIT ? 72 * U : 210 * U;
  const startY = CY - (lines.length * lh) * 0.35 - scrollP * 140 * U;

  ctx.save();
  ctx.font = `500 ${fs}px ${monoFont()}`;
  ctx.textBaseline = 'middle';

  lines.forEach((ln, i) => {
    const ly = startY + i * lh;
    if (ly < -40 || ly > H + 40) return;
    const isHi = i === highlightIdx;
    const rev = clamp((lt - i * 0.04) * 5);
    if (rev <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = rev * (highlightIdx >= 0 && !isHi ? 0.52 : 1);
    if (isHi) {
      rr(startX - 24 * U, ly - lh * 0.45, W - startX * 2 + 48 * U, lh * 0.9, 10 * U);
      ctx.fillStyle = rgba(B.accent, 0.16);
      ctx.fill();
    }
    ctx.fillStyle = '#52525B';
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 10), startX - 28 * U, ly);

    ctx.textAlign = 'left';
    let xCur = startX + (ln.indent || 0) * 32 * U;
    (ln.segs || [{ t: ln.text || '', c: '#E5E7EB' }]).forEach((sg) => {
      ctx.fillStyle = sg.c || '#E5E7EB';
      ctx.fillText(sg.t, xCur, ly);
      xCur += ctx.measureText(sg.t).width;
    });
    ctx.restore();
  });
  ctx.restore();
}

/** 14. Architectural Hairline Scan Grid + High-Contrast Macro Visual Plate (no fake pulse dots!). */
export function scanGridOverlay({
  img = null, crop = null, metricVal = '99.9%', metricLabel = 'Checks verified',
  scanTag = 'LIVE DIAGNOSTIC', calloutBottom = 'STATUS: OK', scanP = 0.5, lt = 1,
} = {}) {
  sandBg(lt);
  const stepX = Math.round((PORTRAIT ? 180 : 213) * U);
  const stepY = Math.round((PORTRAIT ? 192 : 180) * U);
  const gw = stepX * 3, gh = stepY * 3;
  const gx = CX - gw * 0.15, gy = CY - gh * 0.45;

  // Sharp hairline architectural grid + square calibration crosshairs behind focal plates
  ctx.save();
  ctx.strokeStyle = 'rgba(20,20,19,0.2)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += stepX) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += stepY) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  ctx.fillStyle = '#141413';
  for (let x = stepX; x < W; x += stepX) {
    for (let y = stepY; y < H; y += stepY) {
      ctx.fillRect(x - 3 * U, y - 3 * U, 6 * U, 6 * U);
    }
  }
  ctx.restore();

  // Clean central visual window framed directly into grid cells (contain-fits crops cleanly without clipping text)
  if (img) {
    if (crop && img.width && img.height) {
      const pad = 16 * U;
      const dw = gw - pad * 2, dh = gh - pad * 2;
      const sw0 = crop.w * img.width, sh0 = crop.h * img.height;
      const sx0 = crop.x * img.width, sy0 = crop.y * img.height;
      const sc = Math.min(dw / sw0, dh / sh0) * lerp(0.97, 1.02, clamp(lt / 2.2));
      const rw = sw0 * sc, rh = sh0 * sc;
      const rx = gx + (gw - rw) / 2, ry = gy + (gh - rh) / 2;
      ctx.save();
      ctx.fillStyle = '#FAF5F2';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.beginPath();
      ctx.rect(gx, gy, gw, gh);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx0, sy0, sw0, sh0, rx, ry, rw, rh);
      ctx.restore();
      ctx.save();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(20,20,19,0.14)';
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.restore();
    } else {
      imageCover(img, gx, gy, gw, gh, { zoom: lerp(1.04, 1.12, lt / 3), fx: 0.5, fy: 0.5 });
    }
  }

  // Editorial callout slab snapped onto grid coordinates (sits cleanly above grid lines)
  const statX = PORTRAIT ? 72 * U : gx - stepX * 1.48;
  const statY = PORTRAIT ? gy - stepY * 0.78 : gy + 28 * U;
  const statW = stepX * 1.44;
  const statH = stepY * 0.92;
  ctx.save();
  rr(statX, statY, statW, statH, 0);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(20,20,19,0.12)';
  ctx.stroke();
  ctx.fillStyle = '#57534E';
  ctx.font = `500 ${Math.round(17 * U)}px ${uiFont()}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(metricLabel, statX + 24 * U, statY + 26 * U, statW - 44 * U);
  ctx.fillStyle = '#141413';
  ctx.font = `700 ${Math.round(54 * U)}px ${displayFont()}`;
  ctx.letterSpacing = `${-Math.round(2 * U)}px`;
  ctx.fillText(metricVal, statX + 24 * U, statY + 62 * U, statW - 44 * U);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // Sweeping laser scan rule across frame
  ctx.save();
  const scanY = lerp(80 * U, H - 80 * U, eio(clamp(scanP)));
  ctx.strokeStyle = B.accent;
  ctx.lineWidth = 2.5 * U;
  ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(W, scanY); ctx.stroke();

  // Crisp tags anchored to grid lines
  ctx.fillStyle = '#57534E';
  ctx.font = `500 ${Math.round(18 * U)}px ${monoFont()}`;
  ctx.textAlign = 'left';
  ctx.fillText(scanTag, gx, gy - 16 * U);

  rr(W - 290 * U, H - 92 * U, 240 * U, 52 * U, 0);
  ctx.fillStyle = '#141413';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${Math.round(20 * U)}px ${monoFont()}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(calloutBottom, W - 170 * U, H - 66 * U);
  ctx.restore();
}

/** 15. Single Luminous Floating Action Modal over Soft Bokeh (e.g. "Fair Match Ready -> [Apply]"). */
export function floatingActionModal({
  title = 'Live Action', pillText = 'Ready', warnText = 'Optimization available',
  rowText = 'Apply recommended update', btnText = 'Apply Now', btnPressed = 0,
  colors = ['#F4A261', '#7DD3FC', '#FB7185', B.accent], scale = 1, t = 0, lt = 1,
} = {}) {
  bokehMeshBg(t, { colors, intensity: 0.72 });
  const mw = PORTRAIT ? W * 0.86 : 640 * U;
  const mh = 250 * U;
  const pad = 32 * U;
  const reveal = lerp(0.9, 1, spring(lt, { stiffness: 240, damping: 22 }));

  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(scale * reveal, scale * reveal);
  ctx.translate(-mw / 2, -mh / 2);

  ctx.shadowColor = 'rgba(20,20,19,0.16)';
  ctx.shadowBlur = 46 * U;
  ctx.shadowOffsetY = 18 * U;
  rr(0, 0, mw, mh, 24 * U);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(20,20,19,0.1)';
  ctx.stroke();

  // Header row
  ctx.fillStyle = '#141413';
  ctx.font = `600 ${Math.round(30 * U)}px ${displayFont()}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, pad, pad + 20 * U);

  const titleW = ctx.measureText(title).width;
  ctx.font = `500 ${Math.round(15 * U)}px ${uiFont()}`;
  const pw = ctx.measureText(pillText).width + 28 * U;
  rr(pad + titleW + 16 * U, pad + 5 * U, pw, 30 * U, 15 * U);
  ctx.fillStyle = '#F5F4F0';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,20,19,0.14)';
  ctx.stroke();
  ctx.fillStyle = '#57534E';
  ctx.textAlign = 'center';
  ctx.fillText(pillText, pad + titleW + 16 * U + pw / 2, pad + 20 * U);

  // Subtle alert sub-line
  drawGlyph('warn', pad + 11 * U, pad + 64 * U, 11 * U, mixHex(B.accent, '#141413', 0.24), 2 * U);
  ctx.fillStyle = mixHex(B.accent, '#141413', 0.24);
  ctx.font = `500 ${Math.round(17 * U)}px ${uiFont()}`;
  ctx.textAlign = 'left';
  ctx.fillText(warnText, pad + 30 * U, pad + 64 * U);

  // Lower interactive hairline strip + dark CTA button
  const rowY = mh - pad - 72 * U;
  rr(pad, rowY, mw - pad * 2, 72 * U, 14 * U);
  ctx.fillStyle = '#FAF9F6';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,20,19,0.1)';
  ctx.stroke();

  ctx.fillStyle = '#141413';
  ctx.font = `500 ${Math.round(18 * U)}px ${uiFont()}`;
  ctx.fillText(rowText, pad + 22 * U, rowY + 36 * U);

  ctx.font = `600 ${Math.round(17 * U)}px ${displayFont()}`;
  const bw = Math.max(150 * U, ctx.measureText(btnText).width + 44 * U);
  const bh = 48 * U;
  ctx.save();
  ctx.translate(mw - pad - 12 * U - bw / 2, rowY + 36 * U);
  const sq = 1 - btnPressed * 0.08;
  ctx.scale(sq, sq);
  rr(-bw / 2, -bh / 2, bw, bh, 10 * U);
  ctx.fillStyle = btnPressed > 0.2 ? B.accent : '#141413';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(btnText, 0, 1);
  ctx.restore();
  ctx.restore();

  return {
    btnX: CX + mw / 2 - pad - 12 * U - bw / 2,
    btnY: CY + mh / 2 - pad - 36 * U,
  };
}

/** 16. Minimalist Matte Carbon Shield/Verification Matrix lighting up diagonally across waves. */
export function matrixGrid({
  cols = PORTRAIT ? 5 : 9, rows = PORTRAIT ? 7 : 4, waveP = 0,
  glyph = 'shield', activeColor = '#84CC16', lt = 1,
} = {}) {
  carbonBg(lt, { glow: activeColor, glowAlpha: 0.05 });
  const cellW = (PORTRAIT ? 150 : 120) * U;
  const cellH = (PORTRAIT ? 130 : 110) * U;
  const ox = CX - ((cols - 1) * cellW) / 2;
  const oy = CY - ((rows - 1) * cellH) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * 1.1 + c * 0.55) / (rows * 1.1 + cols * 0.55);
      const lit = clamp((waveP - idx * 0.65) * 3.5);
      const x = ox + c * cellW, y = oy + r * cellH;
      if (lit < 0.15) {
        circle(x, y, 3.5 * U, 'rgba(255,255,255,0.2)');
      } else {
        ctx.save();
        const sc = lerp(0.75, 1, lit);
        ctx.translate(x, y);
        ctx.scale(sc, sc);
        drawGlyph(glyph, 0, 0, 20 * U, mixHex('#52525B', activeColor, lit), 2.4 * U);
        ctx.restore();
      }
    }
  }
}

/** 17. Solitary Centered Black Action Capsule over Minimal Sand/Sky Studio Gradient. */
export function solitaryPublishBtn({
  label = 'Publish', pressed = 0, skyHorizon = 0.65, scale = 1, lt = 1,
} = {}) {
  sandBg(lt, { skyHorizon });
  const reveal = lerp(0.86, 1, spring(lt, { stiffness: 260, damping: 21 }));
  const sq = 1 - pressed * 0.09;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(scale * reveal * sq, scale * reveal * sq);

  ctx.font = `600 ${Math.round(28 * U)}px ${displayFont()}`;
  const bw = Math.max(220 * U, ctx.measureText(label).width + 82 * U);
  const bh = 82 * U;
  ctx.shadowColor = 'rgba(20,20,19,0.22)';
  ctx.shadowBlur = 32 * U;
  ctx.shadowOffsetY = 14 * U;
  rr(-bw / 2, -bh / 2, bw, bh, 22 * U);
  ctx.fillStyle = pressed > 0.25 ? B.accent : '#141413';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 1);
  ctx.restore();
}

/** 18. Signature Expanding Hairline Capsule Endcard (Logo lockup -> Pill outline reveal). */
export function capsuleEndcard({
  lt = 1, tagline = 'Build it your way.', splitAt = 1.65,
} = {}) {
  sandBg(lt);
  const phase2 = seg(lt, splitAt, splitAt + 0.65);

  if (phase2 <= 0.02) {
    // Part A: Emblem slides cleanly left revealing crisp brand wordmark
    const slide = eo(seg(lt, 0.12, 0.55));
    const fs = Math.round((PORTRAIT ? 58 : 66) * U);
    ctx.save();
    ctx.font = `700 ${fs}px ${displayFont()}`;
    ctx.letterSpacing = `${-Math.round(fs * 0.035)}px`;
    const nw = ctx.measureText(B.name).width;
    const icoS = 68 * U, gap = 22 * U;
    const totalW = icoS + gap + nw;
    const icoX = lerp(CX, CX - totalW / 2 + icoS / 2, slide);
    const fadeOut = 1 - eo(seg(lt, splitAt - 0.16, splitAt));
    ctx.globalAlpha = clamp(lt * 8) * fadeOut;

    if (B.logoImg) {
      const iw = B.logoImg.naturalWidth || B.logoImg.width || icoS;
      const ih = B.logoImg.naturalHeight || B.logoImg.height || icoS;
      const sc = Math.min(icoS / iw, icoS / ih);
      const dw = iw * sc, dh = ih * sc;
      ctx.drawImage(B.logoImg, icoX - dw / 2, CY - dh / 2, dw, dh);
    } else {
      circle(icoX, CY, icoS * 0.42, B.accent);
    }
    if (slide > 0.05) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(icoX + icoS * 0.45, CY - fs, W, fs * 2);
      ctx.clip();
      ctx.globalAlpha = clamp((slide - 0.08) * 1.4) * fadeOut;
      ctx.fillStyle = '#141413';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(B.name, icoX + icoS / 2 + gap, CY + 2 * U);
      ctx.restore();
    }
    ctx.letterSpacing = '0px';
    ctx.restore();
  } else {
    // Part B: Expanding thin hairline capsule pill around punchy final mantra + domain
    const open = eo(seg(lt, splitAt + 0.05, splitAt + 0.72));
    const fs = Math.round((PORTRAIT ? 40 : 46) * U);
    ctx.save();
    ctx.font = `600 ${fs}px ${displayFont()}`;
    ctx.letterSpacing = `${-Math.round(fs * 0.03)}px`;
    const fullW = Math.min(W * 0.84, ctx.measureText(tagline).width + 88 * U);
    const pillW = lerp(180 * U, fullW, open);
    const pillH = 92 * U;

    rr(CX - pillW / 2, CY - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
    ctx.lineWidth = 2.4 * U;
    ctx.strokeStyle = '#141413';
    ctx.stroke();

    const charCount = Math.round(tagline.length * clamp((open - 0.15) / 0.75));
    const shown = tagline.slice(0, charCount);
    ctx.fillStyle = '#141413';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shown, CX, CY + 1 * U);

    const domA = eo(seg(lt, splitAt + 0.55, splitAt + 0.95));
    if (domA > 0.01) {
      ctx.globalAlpha = domA;
      ctx.letterSpacing = '0.5px';
      ctx.font = `500 ${Math.round(18 * U)}px ${monoFont()}`;
      ctx.fillStyle = '#57534E';
      ctx.fillText(B.domain, CX, CY + pillH * 0.5 + 42 * U);
    }
    ctx.letterSpacing = '0px';
    ctx.restore();
  }
}

/** Precision animated watch dial (for real countdowns / intervals — zero static fake timers). */
export function clockDial({
  cx, cy, r = 46 * U, hour = 12, min = 0, sec = null, sweepFrac = 0,
  accent = B.accent, dark = false, ticks = true,
} = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  circle(0, 0, r, dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF');
  ctx.lineWidth = Math.max(2, r * 0.075);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(20,20,19,0.2)';
  ctx.stroke();

  if (sweepFrac > 0.005) {
    const endA = -Math.PI / 2 + clamp(sweepFrac) * TAU;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.88, -Math.PI / 2, endA); ctx.closePath();
    ctx.fillStyle = rgba(accent, 0.2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, endA);
    ctx.strokeStyle = accent; ctx.lineWidth = Math.max(2.5, r * 0.09); ctx.stroke();
  }
  if (ticks) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      const major = i % 3 === 0;
      const r0 = r * (major ? 0.72 : 0.82), r1 = r * 0.91;
      line([[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]],
        dark ? 'rgba(255,255,255,0.48)' : 'rgba(20,20,19,0.42)', major ? Math.max(2, r * 0.055) : Math.max(1, r * 0.03));
    }
  }
  const ah = ((hour % 12) / 12 + (min / 60) / 12) * TAU - Math.PI / 2;
  const am = (min / 60) * TAU - Math.PI / 2;
  line([[0, 0], [Math.cos(ah) * r * 0.48, Math.sin(ah) * r * 0.48]], dark ? '#FFFFFF' : '#141413', Math.max(2.2, r * 0.095));
  line([[0, 0], [Math.cos(am) * r * 0.72, Math.sin(am) * r * 0.72]], sec != null ? (dark ? '#E2E8F0' : '#44403C') : accent, Math.max(1.8, r * 0.07));
  if (sec != null) {
    const as = (sec / 60) * TAU - Math.PI / 2;
    line([[0, 0], [Math.cos(as) * r * 0.82, Math.sin(as) * r * 0.82]], accent, Math.max(1.4, r * 0.045));
  }
  circle(0, 0, Math.max(2.5, r * 0.085), dark ? '#FFFFFF' : '#141413');
  ctx.restore();
}

/** Crisp pointer with subtle press squish & minimal feedback ring. */
export function cursor(x, y, { click = 0, label = '', scale = 1 } = {}) {
  const s = (1 - Math.sin(clamp(click) * Math.PI) * 0.22) * scale * U;
  if (click > 0 && click < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - eo(click)) * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, lerp(8, 44, eo(click)) * U, 0, TAU);
    ctx.strokeStyle = B.accent;
    ctx.lineWidth = 3 * U;
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.lineTo(11, 30); ctx.lineTo(20, 48);
  ctx.lineTo(27, 45); ctx.lineTo(18, 27); ctx.lineTo(31, 26); ctx.closePath();
  ctx.fillStyle = '#141413'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.4; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
  if (label) {
    ctx.font = `600 16px ${uiFont()}`;
    const tw = ctx.measureText(label).width;
    rr(24, 32, tw + 24, 32, 16);
    ctx.fillStyle = '#141413'; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 24 + (tw + 24) / 2, 48);
  }
  ctx.restore();
}
