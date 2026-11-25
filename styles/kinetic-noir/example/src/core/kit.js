// Kinetic Noir Motion Kit: Linear/Vercel/Raycast dark motion graphics + real product UI animation.
import { ctx, W, H, CX, CY, U, PORTRAIT, clamp, lerp, seg, eo, eio, spring, rr, circle, line, fillAll, imageViewport, wrapLines, rgba, mixHex } from './lib.js';
import { B } from './brand.js';

/** Deep brand-tinted obsidian canvas with subtle architectural grid + pulsing brand glow. */
export function obsidianBg(t, { pulse = 0, glowX = CX, glowY = CY * 0.85, glowRadius = 0.72 } = {}) {
  fillAll(B.bg);
  const r = Math.max(W, H) * glowRadius * (1 + pulse * 0.06);
  const g = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, r);
  g.addColorStop(0, rgba(B.accent, 0.16 + pulse * 0.07));
  g.addColorStop(0.5, rgba(B.accent, 0.04));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Subtle architectural dot grid
  const step = Math.round(56 * U);
  ctx.fillStyle = rgba('#FFFFFF', 0.06);
  for (let x = step / 2; x < W; x += step) {
    for (let y = step / 2; y < H; y += step) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
}

/** Sleek glass pill badge ("● LIVE ON PRODUCT HUNT"). */
export function badge(text, x, y, { scale = 1, dot = false, icon = null, accent = false, align = 'center' } = {}) {
  if (scale <= 0.01) return;
  const fs = Math.round((PORTRAIT ? 28 : 22) * U);
  ctx.save();
  ctx.font = `800 ${fs}px Inter, sans-serif`;
  ctx.letterSpacing = '1.5px';
  const tw = ctx.measureText(text.toUpperCase()).width;
  const padX = fs * 1.15;
  const dotW = (dot || icon) ? fs * 1.05 : 0;
  const w = tw + padX * 2 + dotW;
  const h = fs * 2.15;
  const ox = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;

  ctx.translate(ox, y);
  ctx.scale(scale, scale);
  rr(-w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = accent ? B.accentSoft : 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = accent ? rgba(B.accentBright, 0.5) : 'rgba(255,255,255,0.16)';
  ctx.stroke();

  if (icon === 'clock') {
    clockDial({ cx: -w / 2 + padX + fs * 0.25, cy: 0, r: fs * 0.44, sweepFrac: 0.72, accent: B.accentBright, dark: true, ticks: false, centerCap: false });
  } else if (dot) {
    circle(-w / 2 + padX + fs * 0.25, 0, fs * 0.24, B.accentBright);
  }
  ctx.fillStyle = accent ? B.accentBright : B.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), -w / 2 + padX + dotW, fs * 0.04);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/**
 * Masked spring kinetic headline: words marked with `*word` glow in B.accentBright.
 * lines = ['Stop writing', '*webhook boilerplate.']
 */
export function kineticTitle(lines, { x = CX, y = CY, size = 96, lt = 1, stagger = 0.09, align = 'center', maxW = W * 0.86, lineGap = 1.12 } = {}) {
  const fs = Math.round(size * U);
  const font = `900 ${fs}px Inter, sans-serif`;
  ctx.save();
  ctx.font = font;
  ctx.letterSpacing = `${-Math.round(fs * 0.035)}px`;

  // Auto-shrink if any line exceeds maxW
  const stripStar = (s) => s.replace(/\*/g, '');
  const widest = Math.max(...lines.map((l) => ctx.measureText(stripStar(l)).width), 1);
  const fit = Math.min(1, maxW / widest);
  const effFs = fs * fit;
  ctx.font = `900 ${effFs}px Inter, sans-serif`;
  ctx.letterSpacing = `${-Math.round(effFs * 0.035)}px`;

  const lh = effFs * lineGap;
  const totalH = lines.length * lh;
  const y0 = y - totalH / 2 + lh / 2;
  const sp = ctx.measureText(' ').width;

  lines.forEach((rawLine, li) => {
    // Support both *word and *multi word phrase*
    let inSpan = false;
    const tokens = rawLine.split(/\s+/).filter(Boolean).map((raw) => {
      let tok = raw;
      let hi = inSpan;
      if (tok.startsWith('*')) { hi = true; tok = tok.slice(1); inSpan = true; }
      if (tok.endsWith('*')) { tok = tok.slice(0, -1); inSpan = false; }
      else if (hi && !rawLine.includes('*', rawLine.indexOf(raw) + raw.length)) {
        // single *word highlight (no closing * later in line)
        if (raw.startsWith('*') && !raw.slice(1).includes('*')) inSpan = false;
      }
      return { txt: tok, hi };
    });
    const widths = tokens.map((tk) => ctx.measureText(tk.txt).width);
    const lineW = widths.reduce((a, b) => a + b, 0) + sp * Math.max(0, tokens.length - 1);
    let curX = align === 'left' ? x : align === 'right' ? x - lineW : x - lineW / 2;
    const ly = y0 + li * lh;

    tokens.forEach((tk, wi) => {
      const delay = (li * 2 + wi) * stagger;
      const p = spring(Math.max(0, lt - delay), { stiffness: 280, damping: 24 });
      const a = clamp((lt - delay) * 7);
      if (a <= 0.01) { curX += widths[wi] + sp; return; }

      ctx.save();
      ctx.beginPath();
      ctx.rect(curX - 24, ly - lh * 0.62, widths[wi] + 48, lh * 1.24);
      ctx.clip();

      ctx.globalAlpha = a;
      const dy = (1 - p) * effFs * 0.72;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      if (tk.hi) {
        ctx.shadowColor = B.accentGlow;
        ctx.shadowBlur = 24 * U;
        ctx.fillStyle = B.accentBright;
      } else {
        ctx.fillStyle = B.text;
      }
      ctx.fillText(tk.txt, curX, ly + dy);
      ctx.restore();
      curX += widths[wi] + sp;
    });
  });

  ctx.letterSpacing = '0px';
  ctx.restore();
}

/**
 * Sleek dark-glass browser / app window displaying a REAL captured product screenshot.
 * Supports Ken Burns zoom/pan (`zoom`, `panX`, `panY`), spotlight dimming (`spotlight: [u, v, rw, rh]`), and sheen sweep.
 */
export function browserFrame(img, {
  x, y, w, h, url = B.domain, zoom = 1, panX = 0.5, panY = 0,
  scale = 1, alpha = 1, radius = 22 * U, spotlight = null, sheenT = -1, chrome = true,
} = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const barH = chrome ? Math.round(44 * U) : 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  // Drop shadow + ambient glow
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 55 * U;
  ctx.shadowOffsetY = 24 * U;
  rr(0, 0, w, h, radius);
  ctx.fillStyle = B.surface;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Top chrome bar
  if (chrome) {
    ctx.save();
    rr(0, 0, w, h, radius);
    ctx.clip();
    ctx.fillStyle = mixHex(B.surface, '#FFFFFF', 0.04);
    ctx.fillRect(0, 0, w, barH);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, barH - 1, w, 1);

    const rDot = 6 * U;
    circle(24 * U, barH / 2, rDot, '#FF5F56');
    circle(46 * U, barH / 2, rDot, '#FFBD2E');
    circle(68 * U, barH / 2, rDot, '#27C93F');

    // URL pill
    const pillW = Math.min(w * 0.44, 340 * U);
    const pillH = barH * 0.58;
    rr((w - pillW) / 2, (barH - pillH) / 2, pillW, pillH, pillH / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fill();
    ctx.fillStyle = B.muted;
    ctx.font = `700 ${Math.round(14 * U)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(url, w / 2, barH / 2);
    ctx.restore();
  }

  // Real product UI viewport inside frame
  ctx.save();
  rr(0, barH, w, h - barH, chrome ? [0, 0, radius, radius] : radius);
  ctx.clip();
  if (img) {
    imageViewport(img, 0, barH, w, h - barH, { zoom, panX, panY });
  } else {
    ctx.fillStyle = B.surfaceHi;
    ctx.fillRect(0, barH, w, h - barH);
  }

  // Spotlight mask dims outer UI and frames exact target area [u, v, rw, rh] in 0..1
  if (spotlight) {
    const [su, sv, sw, sh, sa = 1] = spotlight;
    const vx = su * w, vy = barH + sv * (h - barH), vw = sw * w, vh = sh * (h - barH);
    ctx.save();
    ctx.globalAlpha = sa * 0.64;
    ctx.fillStyle = '#05060A';
    ctx.beginPath();
    ctx.rect(0, barH, w, h - barH);
    ctx.roundRect(vx, vy, vw, vh, 14 * U);
    ctx.fill('evenodd');
    ctx.globalAlpha = sa;
    rr(vx, vy, vw, vh, 14 * U);
    ctx.strokeStyle = B.accentBright;
    ctx.lineWidth = 3 * U;
    ctx.stroke();
    ctx.restore();
  }

  // Glass reflection sweep
  if (sheenT >= 0 && sheenT <= 1) {
    const sx = lerp(-w * 0.4, w * 1.4, eio(sheenT));
    const grad = ctx.createLinearGradient(sx - 180 * U, 0, sx + 180 * U, h);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.09)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, barH, w, h - barH);
  }
  ctx.restore();

  // Crisp outer 1px glass bezel
  rr(0, 0, w, h, radius);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.stroke();
  ctx.restore();
}

/** Spring-physics animated pointer cursor + click ripple shockwave + optional pill tag. */
export function cursor(x, y, { click = 0, label = '', scale = 1 } = {}) {
  const s = (1 - Math.sin(clamp(click) * Math.PI) * 0.22) * scale * U;
  // Expanding click ripple
  if (click > 0 && click < 1) {
    ctx.save();
    const r = lerp(8, 56, eo(click)) * U;
    ctx.globalAlpha = 1 - eo(click);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = B.accentBright;
    ctx.lineWidth = 4 * U;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 40);
  ctx.lineTo(11, 30);
  ctx.lineTo(20, 48);
  ctx.lineTo(27, 45);
  ctx.lineTo(18, 27);
  ctx.lineTo(31, 26);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#090A0F';
  ctx.stroke();

  if (label) {
    ctx.font = '800 18px Inter, sans-serif';
    const tw = ctx.measureText(label).width;
    rr(24, 32, tw + 24, 34, 17);
    ctx.fillStyle = B.accent;
    ctx.fill();
    ctx.fillStyle = B.onAccent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 24 + (tw + 24) / 2, 49);
  }
  ctx.restore();
}

/** Chaos pain stack (overlapping broken/slow alerts that shatter away on the reveal). */
export function painCard(title, detail, { x, y, w, rot = 0, scale = 1, alpha = 1, badgeText = 'ERROR' } = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const h = 112 * U;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 24;
  rr(-w / 2, -h / 2, w, h, 18 * U);
  ctx.fillStyle = '#18131A';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(239,68,68,0.48)';
  ctx.stroke();

  // Red error chip
  const fs = Math.round(16 * U);
  ctx.font = `900 ${fs}px Inter, sans-serif`;
  const bw = ctx.measureText(badgeText).width + 24 * U;
  rr(-w / 2 + 22 * U, -h / 2 + 20 * U, bw, 30 * U, 8 * U);
  ctx.fillStyle = 'rgba(239,68,68,0.18)';
  ctx.fill();
  ctx.fillStyle = '#F87171';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, -w / 2 + 22 * U + bw / 2, -h / 2 + 35 * U);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#F8FAFC';
  ctx.font = `800 ${Math.round(24 * U)}px Inter, sans-serif`;
  ctx.fillText(title, -w / 2 + 22 * U + bw + 14 * U, -h / 2 + 36 * U);

  ctx.fillStyle = '#94A3B8';
  ctx.font = `800 ${Math.round(19 * U)}px FreeMono, monospace`;
  ctx.fillText(detail, -w / 2 + 22 * U, h / 2 - 28 * U);
  ctx.restore();
}

/** Modular proof bento card with animated numeric/text emphasis. */
export function bentoCard({ x, y, w, h, label, value, sub, scale = 1, alpha = 1, highlight = false }) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  rr(0, 0, w, h, 24 * U);
  ctx.fillStyle = highlight ? mixHex(B.surface, B.accent, 0.14) : B.surface;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = highlight ? rgba(B.accentBright, 0.55) : B.border;
  ctx.stroke();

  const pad = 28 * U;
  ctx.fillStyle = B.muted;
  ctx.font = `800 ${Math.round(20 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label.toUpperCase(), pad, pad);

  ctx.fillStyle = highlight ? B.accentBright : B.text;
  ctx.font = `900 ${Math.round(62 * U)}px Inter, sans-serif`;
  ctx.fillText(value, pad, pad + 38 * U);

  if (sub) {
    ctx.fillStyle = B.muted;
    const lines = wrapLines(sub, w - pad * 2, `800 ${Math.round(22 * U)}px Inter, sans-serif`);
    ctx.font = `800 ${Math.round(22 * U)}px Inter, sans-serif`;
    lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, pad, h - pad - (lines.slice(0, 2).length - i) * 28 * U + 6 * U));
  }
  ctx.restore();
}

/** Final conversion endcard: Logo + Product Name + Value Hook + Interactive CTA Button + Cursor Click. */
export function ctaEndcard({ lt, tagline, cta = B.copy.ctaPrimary || 'Try it free', urlText = B.domain, command = '' }) {
  const p = lerp(0.86, 1, spring(lt, { stiffness: 230, damping: 22 }));
  const alpha = clamp(lt * 8);
  const cy = CY - 20 * U;
  const logoSize = 86 * U;

  ctx.save();
  ctx.globalAlpha = alpha;
  // Brand emblem or probed logo
  ctx.save();
  ctx.translate(CX, cy - 220 * U);
  ctx.scale(p, p);
  rr(-logoSize / 2, -logoSize / 2, logoSize, logoSize, 22 * U);
  ctx.fillStyle = B.surfaceHi;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(B.accentBright, 0.5);
  ctx.stroke();
  if (B.logoImg) {
    const pad = 16 * U;
    ctx.drawImage(B.logoImg, -logoSize / 2 + pad, -logoSize / 2 + pad, logoSize - pad * 2, logoSize - pad * 2);
  } else {
    circle(0, 0, logoSize * 0.24, B.accentBright);
  }
  ctx.restore();

  // Product Name + Hook Tagline
  const rawTags = Array.isArray(tagline) ? tagline.map(String) : [String(tagline)];
  const hasExplicitStar = rawTags.some((s) => s.includes('*'));
  const tagLines = rawTags.map((s) => (hasExplicitStar || s.includes('*') ? s : `*${s}*`));
  const extraH = (tagLines.length - 1) * 40 * U;
  kineticTitle([B.name, ...tagLines], {
    x: CX, y: cy - (48 * U - extraH * 0.25), size: PORTRAIT ? 72 : 82, lt, stagger: 0.04, maxW: W * 0.86,
  });

  // Command pill if developer tool
  const btnY = (command ? cy + 230 * U : cy + 165 * U) + extraH;
  if (command) {
    const cp = lerp(0.88, 1, spring(Math.max(0, lt - 0.18), { stiffness: 260, damping: 24 }));
    ctx.save();
    ctx.globalAlpha = clamp((lt - 0.12) * 6);
    ctx.translate(CX, cy + 125 * U);
    ctx.scale(cp, cp);
    ctx.font = `800 ${Math.round(24 * U)}px FreeMono, monospace`;
    const cw = Math.min(W * 0.82, ctx.measureText(command).width + 64 * U);
    rr(-cw / 2, -28 * U, cw, 56 * U, 14 * U);
    ctx.fillStyle = B.surface;
    ctx.fill();
    ctx.strokeStyle = B.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = B.accentBright;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(command, 0, 0);
    ctx.restore();
  }

  // Interactive CTA Button
  const bp = lerp(0.88, 1, spring(Math.max(0, lt - 0.28), { stiffness: 250, damping: 22 }));
  const clickStart = 0.85;
  const clickT = seg(lt, clickStart, clickStart + 0.35);
  const press = 1 - Math.sin(clickT * Math.PI) * 0.08;

  ctx.save();
  ctx.globalAlpha = clamp((lt - 0.22) * 6);
  ctx.translate(CX, btnY);
  ctx.scale(bp * press, bp * press);
  ctx.font = `900 ${Math.round(30 * U)}px Inter, sans-serif`;
  const bw = Math.max(260 * U, ctx.measureText(cta).width + 90 * U);
  const bh = 74 * U;
  ctx.shadowColor = B.accentGlow;
  ctx.shadowBlur = 32 * U;
  rr(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = B.accent;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = B.onAccent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cta, 0, 0);
  ctx.restore();

  // Domain under button
  ctx.save();
  ctx.globalAlpha = clamp((lt - 0.35) * 5);
  ctx.fillStyle = B.muted;
  ctx.font = `800 ${Math.round(24 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(urlText, CX, btnY + 72 * U);
  ctx.restore();

  // Animated cursor flies in to click CTA
  if (lt > 0.4) {
    const mp = eo(seg(lt, 0.4, clickStart));
    const cx0 = lerp(CX + 260 * U, CX + 34 * U, mp);
    const cy0 = lerp(btnY + 180 * U, btnY + 8 * U, mp);
    cursor(cx0, cy0, { click: clickT });
  }
  ctx.restore();
}

/** Precision animated clock dial (for elapsed hours, SLAs, latency budgets, countdown sweeps). */
export function clockDial({
  cx, cy, r = 36 * U, hour = 12, min = 0, sweepFrac = 0,
  accent = B.accentBright, dark = true, ticks = true, centerCap = true,
} = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  circle(0, 0, r, dark ? 'rgba(15,17,26,0.92)' : '#FFFFFF');
  ctx.lineWidth = Math.max(1.8, r * 0.08);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(17,24,39,0.2)';
  ctx.stroke();

  if (sweepFrac > 0.01) {
    const endA = -Math.PI / 2 + clamp(sweepFrac) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.88, -Math.PI / 2, endA);
    ctx.closePath();
    ctx.fillStyle = rgba(accent, 0.22);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, endA);
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.stroke();
  }
  if (ticks) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      const major = i % 3 === 0;
      const r0 = r * (major ? 0.72 : 0.82);
      const r1 = r * 0.9;
      line([[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], dark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.45)', major ? Math.max(1.8, r * 0.06) : Math.max(1, r * 0.03));
    }
  }
  const ah = ((hour % 12) / 12 + (min / 60) / 12) * TAU - Math.PI / 2;
  const am = (min / 60) * TAU - Math.PI / 2;
  line([[0, 0], [Math.cos(ah) * r * 0.46, Math.sin(ah) * r * 0.46]], dark ? '#F8FAFC' : '#111827', Math.max(2, r * 0.095));
  line([[0, 0], [Math.cos(am) * r * 0.7, Math.sin(am) * r * 0.7]], accent, Math.max(1.6, r * 0.07));
  if (centerCap) circle(0, 0, Math.max(2, r * 0.09), dark ? '#F8FAFC' : '#111827');
  ctx.restore();
}
