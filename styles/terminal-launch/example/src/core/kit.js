// Terminal Launch Motion Kit: Phosphor Carbon terminal, interactive CLI typing, code diff, benchmarks + real UI chrome.
import { ctx, W, H, CX, CY, U, PORTRAIT, TAU, clamp, lerp, seg, eo, eio, spring, rr, circle, line, fillAll, imageViewport, wrapLines, rgba, mixHex } from './lib.js';
import { B } from './brand.js';

export function terminalGridBg(t, { pulse = 0, glowX = CX * 1.1, glowY = CY * 0.45 } = {}) {
  fillAll('#07090E');
  const r = Math.max(W, H) * 0.75 * (1 + pulse * 0.05);
  const g = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, r);
  g.addColorStop(0, rgba(B.accent, 0.14 + pulse * 0.05));
  g.addColorStop(0.55, rgba('#10B981', 0.04));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Faint phosphor coordinate grid
  const step = Math.round(64 * U);
  ctx.strokeStyle = 'rgba(255,255,255,0.032)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

export function badge(text, x, y, { scale = 1, dot = false, accent = false, align = 'center' } = {}) {
  if (scale <= 0.01) return;
  const fs = Math.round((PORTRAIT ? 25 : 20) * U);
  ctx.save();
  ctx.font = `800 ${fs}px FreeMono, monospace`;
  const txt = text.toUpperCase();
  const tw = ctx.measureText(txt).width;
  const padX = fs * 1.1;
  const dotW = dot ? fs * 0.85 : 0;
  const w = tw + padX * 2 + dotW;
  const h = fs * 2.1;
  const ox = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;

  ctx.translate(ox, y);
  ctx.scale(scale, scale);
  rr(-w / 2, -h / 2, w, h, 8 * U);
  ctx.fillStyle = accent ? B.accentSoft : 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = accent ? rgba(B.accentBright, 0.55) : 'rgba(255,255,255,0.16)';
  ctx.stroke();

  if (dot) circle(-w / 2 + padX + fs * 0.22, 0, fs * 0.22, '#34D399');
  ctx.fillStyle = accent ? B.accentBright : '#E2E8F0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, -w / 2 + padX + dotW, fs * 0.04);
  ctx.restore();
}

export function kineticTitle(lines, { x = CX, y = CY, size = 84, lt = 1, stagger = 0.05, align = 'center', maxW = W * 0.86, lineGap = 1.12 } = {}) {
  const fs = Math.round(size * U);
  ctx.save();
  ctx.font = `900 ${fs}px Inter, sans-serif`;
  ctx.letterSpacing = `${-Math.round(fs * 0.032)}px`;
  const stripStar = (s) => s.replace(/\*/g, '');
  const widest = Math.max(...lines.map((l) => ctx.measureText(stripStar(l)).width), 1);
  const effFs = fs * Math.min(1, maxW / widest);
  ctx.font = `900 ${effFs}px Inter, sans-serif`;
  ctx.letterSpacing = `${-Math.round(effFs * 0.032)}px`;

  const lh = effFs * lineGap;
  const y0 = y - (lines.length * lh) / 2 + lh / 2;
  const sp = ctx.measureText(' ').width;

  lines.forEach((rawLine, li) => {
    let inSpan = false;
    const tokens = rawLine.split(/\s+/).filter(Boolean).map((raw) => {
      let tok = raw, hi = inSpan;
      if (tok.startsWith('*')) { hi = true; tok = tok.slice(1); inSpan = true; }
      if (tok.includes('*')) { tok = tok.replace(/\*/g, ''); inSpan = false; hi = true; }
      return { txt: tok, hi };
    });
    const widths = tokens.map((tk) => ctx.measureText(tk.txt).width);
    const lineW = widths.reduce((a, b) => a + b, 0) + sp * Math.max(0, tokens.length - 1);
    let curX = align === 'left' ? x : align === 'right' ? x - lineW : x - lineW / 2;
    const ly = y0 + li * lh;

    tokens.forEach((tk, wi) => {
      const delay = (li * 2 + wi) * stagger;
      const p = spring(Math.max(0, lt - delay), { stiffness: 300, damping: 24 });
      const a = clamp((lt - delay) * 8);
      if (a <= 0.01) { curX += widths[wi] + sp; return; }
      ctx.save();
      ctx.beginPath();
      ctx.rect(curX - 24, ly - lh * 0.62, widths[wi] + 48, lh * 1.24);
      ctx.clip();
      ctx.globalAlpha = a;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      if (tk.hi) {
        ctx.shadowColor = B.accentGlow;
        ctx.shadowBlur = 22 * U;
        ctx.fillStyle = B.accentBright;
      } else {
        ctx.fillStyle = '#F8FAFC';
      }
      ctx.fillText(tk.txt, curX, ly + (1 - p) * effFs * 0.68);
      ctx.restore();
      curX += widths[wi] + sp;
    });
  });
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/**
 * Interactive ANSI/macOS terminal window.
 * items: [{ at, kind: 'cmd'|'ok'|'warn'|'err'|'dim'|'accent', text, speed? }]
 */
export function terminalWindow({ x, y, w, h, title = 'bash · tracepulse', items = [], lt = 0, t = 0, scale = 1, alpha = 1, fontScale = 1 } = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const barH = 42 * U;
  const r = 18 * U;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 48 * U;
  ctx.shadowOffsetY = 20 * U;
  rr(0, 0, w, h, r);
  ctx.fillStyle = '#0B0F17';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Chrome top bar
  ctx.save();
  rr(0, 0, w, h, r);
  ctx.clip();
  ctx.fillStyle = '#121826';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, barH - 1, w, 1);
  circle(22 * U, barH / 2, 5.5 * U, '#FF5F56');
  circle(42 * U, barH / 2, 5.5 * U, '#FFBD2E');
  circle(62 * U, barH / 2, 5.5 * U, '#27C93F');
  ctx.fillStyle = '#94A3B8';
  ctx.font = `700 ${Math.round(15 * U)}px FreeMono, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, barH / 2);

  const fs = Math.round((PORTRAIT ? 23 : 21) * U * fontScale);
  const padX = 28 * U;
  const lh = fs * 1.55;
  ctx.font = `700 ${fs}px FreeMono, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const palette = {
    cmd: '#F8FAFC',
    ok: '#34D399',
    warn: '#FBBF24',
    err: '#F87171',
    dim: '#64748B',
    accent: B.accentBright,
  };

  let curY = barH + 24 * U;
  let caret = null;
  items.forEach((it) => {
    const dt = lt - (it.at ?? 0);
    if (dt < 0) return;
    let shown = it.text;
    let isTyping = false;
    if (it.kind === 'cmd') {
      const cps = it.cps || 36;
      const n = Math.min(it.text.length, Math.floor(dt * cps));
      shown = it.text.slice(0, n);
      isTyping = n < it.text.length;
    } else {
      ctx.globalAlpha = alpha * clamp(dt * 9);
    }

    const prefix = it.kind === 'cmd' ? '$ ' : '';
    const preW = prefix ? ctx.measureText(prefix).width : 0;
    if (prefix) {
      ctx.fillStyle = B.accentBright;
      ctx.fillText(prefix, padX, curY);
    }
    ctx.fillStyle = palette[it.kind] || '#CBD5E1';
    ctx.fillText(shown, padX + preW, curY);
    if (it.kind === 'cmd') {
      const tw = ctx.measureText(shown).width;
      caret = { x: padX + preW + tw + 4 * U, y: curY, active: isTyping || Math.floor(t * 2.5) % 2 === 0 };
    }
    curY += lh;
    ctx.globalAlpha = alpha;
  });

  if (caret && caret.active) {
    ctx.fillStyle = B.accentBright;
    ctx.fillRect(caret.x, caret.y + 2 * U, 10 * U, fs * 0.95);
  }
  ctx.restore();

  rr(0, 0, w, h, r);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.stroke();
  ctx.restore();
}

/** Animated Code Diff comparing bloated legacy glue (`beforeLines`) vs clean 3-line SDK (`afterLines`). */
export function codeDiff({ x, y, w, h, title = 'webhook-handler.ts', beforeLines = [], afterLines = [], collapseT = 0, scale = 1, alpha = 1 } = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const r = 18 * U, barH = 42 * U;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  rr(0, 0, w, h, r);
  ctx.fillStyle = '#0B0F17';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.stroke();

  ctx.save();
  rr(0, 0, w, h, r);
  ctx.clip();
  ctx.fillStyle = '#121826';
  ctx.fillRect(0, 0, w, barH);
  circle(22 * U, barH / 2, 5.5 * U, '#FF5F56');
  circle(42 * U, barH / 2, 5.5 * U, '#FFBD2E');
  circle(62 * U, barH / 2, 5.5 * U, '#27C93F');
  ctx.fillStyle = '#94A3B8';
  ctx.font = `700 ${Math.round(15 * U)}px FreeMono, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, barH / 2);

  // Split: 0..1 collapseT shifts/fades out red removed block and brings crisp green SDK block into prominence
  const k = eio(clamp(collapseT));
  const fs = Math.round((PORTRAIT ? 21 : 19) * U);
  const lh = fs * 1.48;
  ctx.font = `700 ${fs}px FreeMono, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const padX = 22 * U;
  let ry = barH + 28 * U;
  const oldAlpha = 1 - k * 0.85;
  const oldH = (1 - k * 0.55);

  ctx.save();
  ctx.globalAlpha = alpha * oldAlpha;
  beforeLines.forEach((ln, idx) => {
    const yRow = ry + idx * lh * oldH;
    ctx.fillStyle = 'rgba(239,68,68,0.12)';
    ctx.fillRect(10 * U, yRow - lh * 0.45 * oldH, w - 20 * U, lh * 0.9 * oldH);
    ctx.fillStyle = '#F87171';
    ctx.fillText('-  ' + ln, padX, yRow);
  });
  ctx.restore();

  // Added SDK block slides up cleanly
  const startNewY = lerp(ry + beforeLines.length * lh + 16 * U, ry + 118 * U, k);
  afterLines.forEach((ln, idx) => {
    const rowY = startNewY + idx * lh;
    const aRow = clamp(k * 2.2 - idx * 0.12);
    if (aRow <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha * aRow;
    ctx.fillStyle = 'rgba(16,185,129,0.14)';
    ctx.fillRect(10 * U, rowY - lh * 0.46, w - 20 * U, lh * 0.92);
    ctx.fillStyle = '#34D399';
    ctx.fillText('+  ' + ln, padX, rowY);
    ctx.restore();
  });

  ctx.restore();
  ctx.restore();
}

export function browserFrame(img, {
  x, y, w, h, url = B.domain, zoom = 1, panX = 0.5, panY = 0,
  scale = 1, alpha = 1, radius = 18 * U, spotlight = null, sheenT = -1, chrome = true,
} = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const barH = chrome ? Math.round(42 * U) : 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 48 * U;
  ctx.shadowOffsetY = 20 * U;
  rr(0, 0, w, h, radius);
  ctx.fillStyle = '#0B0F17';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  if (chrome) {
    ctx.save();
    rr(0, 0, w, h, radius);
    ctx.clip();
    ctx.fillStyle = '#121826';
    ctx.fillRect(0, 0, w, barH);
    circle(22 * U, barH / 2, 5.5 * U, '#FF5F56');
    circle(42 * U, barH / 2, 5.5 * U, '#FFBD2E');
    circle(62 * U, barH / 2, 5.5 * U, '#27C93F');
    ctx.fillStyle = '#94A3B8';
    ctx.font = `700 ${Math.round(14 * U)}px FreeMono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(url, w / 2, barH / 2);
    ctx.restore();
  }

  ctx.save();
  rr(0, barH, w, h - barH, chrome ? [0, 0, radius, radius] : radius);
  ctx.clip();
  if (img) imageViewport(img, 0, barH, w, h - barH, { zoom, panX, panY });

  if (spotlight) {
    const [su, sv, sw, sh, sa = 1] = spotlight;
    const vx = su * w, vy = barH + sv * (h - barH), vw = sw * w, vh = sh * (h - barH);
    ctx.save();
    ctx.globalAlpha = sa * 0.62;
    ctx.fillStyle = '#04060A';
    ctx.beginPath();
    ctx.rect(0, barH, w, h - barH);
    ctx.roundRect(vx, vy, vw, vh, 12 * U);
    ctx.fill('evenodd');
    ctx.globalAlpha = sa;
    rr(vx, vy, vw, vh, 12 * U);
    ctx.strokeStyle = B.accentBright;
    ctx.lineWidth = 3 * U;
    ctx.stroke();
    ctx.restore();
  }

  if (sheenT >= 0 && sheenT <= 1) {
    const sx = lerp(-w * 0.4, w * 1.4, eio(sheenT));
    const grad = ctx.createLinearGradient(sx - 160 * U, 0, sx + 160 * U, h);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, barH, w, h - barH);
  }
  ctx.restore();

  rr(0, 0, w, h, radius);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();
  ctx.restore();
}

export function benchmarkBars({ x, y, w, bars = [], p = 1 }) {
  bars.forEach((b, i) => {
    const by = y + i * 94 * U;
    ctx.save();
    ctx.font = `800 ${Math.round(22 * U)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = b.highlight ? '#F8FAFC' : '#94A3B8';
    ctx.fillText(b.label, x, by);
    ctx.textAlign = 'right';
    ctx.fillStyle = b.color;
    ctx.font = `700 ${Math.round(22 * U)}px FreeMono, monospace`;
    ctx.fillText(b.val, x + w, by);

    rr(x, by + 18 * U, w, 24 * U, 12 * U);
    ctx.fillStyle = '#151B2B';
    ctx.fill();
    rr(x, by + 18 * U, Math.max(22 * U, w * b.pct * eo(p)), 24 * U, 12 * U);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.restore();
  });
}

export function bentoCard({ x, y, w, h, label, value, sub, scale = 1, alpha = 1, highlight = false }) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);
  rr(0, 0, w, h, 20 * U);
  ctx.fillStyle = highlight ? mixHex('#0D111C', B.accent, 0.16) : '#0D111C';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = highlight ? rgba(B.accentBright, 0.55) : 'rgba(255,255,255,0.12)';
  ctx.stroke();

  const pad = 26 * U;
  ctx.fillStyle = '#94A3B8';
  ctx.font = `700 ${Math.round(18 * U)}px FreeMono, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label.toUpperCase(), pad, pad);

  ctx.fillStyle = highlight ? B.accentBright : '#F8FAFC';
  ctx.font = `900 ${Math.round(56 * U)}px Inter, sans-serif`;
  ctx.fillText(value, pad, pad + 36 * U);

  if (sub) {
    ctx.fillStyle = '#94A3B8';
    const lines = wrapLines(sub, w - pad * 2, `800 ${Math.round(20 * U)}px Inter, sans-serif`);
    ctx.font = `800 ${Math.round(20 * U)}px Inter, sans-serif`;
    lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, pad, h - pad - (lines.slice(0, 2).length - i) * 26 * U + 4 * U));
  }
  ctx.restore();
}

export function cursor(x, y, { click = 0, label = '', scale = 1 } = {}) {
  const s = (1 - Math.sin(clamp(click) * Math.PI) * 0.22) * scale * U;
  if (click > 0 && click < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - eo(click);
    ctx.beginPath();
    ctx.arc(x, y, lerp(8, 52, eo(click)) * U, 0, Math.PI * 2);
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
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.lineTo(11, 30); ctx.lineTo(20, 48);
  ctx.lineTo(27, 45); ctx.lineTo(18, 27); ctx.lineTo(31, 26); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#090A0F'; ctx.stroke();
  if (label) {
    ctx.font = '700 17px FreeMono, monospace';
    const tw = ctx.measureText(label).width;
    rr(24, 32, tw + 24, 34, 10);
    ctx.fillStyle = B.accent; ctx.fill();
    ctx.fillStyle = B.onAccent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 24 + (tw + 24) / 2, 49);
  }
  ctx.restore();
}

export function ctaEndcard({ lt, tagline, cta = B.copy.ctaPrimary || 'Get API Key', urlText = B.domain, command = '' }) {
  const p = lerp(0.88, 1, spring(lt, { stiffness: 240, damping: 22 }));
  const cy = CY - 60 * U; // Raised cleanly above bottom caption zone!
  const logoSize = 84 * U;

  ctx.save();
  ctx.globalAlpha = clamp(lt * 8);
  ctx.save();
  ctx.translate(CX, cy - 205 * U);
  ctx.scale(p, p);
  rr(-logoSize / 2, -logoSize / 2, logoSize, logoSize, 20 * U);
  ctx.fillStyle = '#111624';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(B.accentBright, 0.55);
  ctx.stroke();
  if (B.logoImg) {
    const pad = 16 * U;
    ctx.drawImage(B.logoImg, -logoSize / 2 + pad, -logoSize / 2 + pad, logoSize - pad * 2, logoSize - pad * 2);
  } else {
    circle(0, 0, logoSize * 0.24, '#34D399');
  }
  ctx.restore();

  const rawTags = Array.isArray(tagline) ? tagline.map(String) : [String(tagline)];
  const hasExplicitStar = rawTags.some((s) => s.includes('*'));
  const tagLines = rawTags.map((s) => (hasExplicitStar || s.includes('*') ? s : `*${s}*`));
  const extraH = (tagLines.length - 1) * 38 * U;
  kineticTitle([B.name, ...tagLines], {
    x: CX, y: cy - (42 * U - extraH * 0.25), size: PORTRAIT ? 68 : 78, lt, stagger: 0.04, maxW: W * 0.86,
  });

  const btnY = (command ? cy + 215 * U : cy + 150 * U) + extraH;
  if (command) {
    const cp = lerp(0.88, 1, spring(Math.max(0, lt - 0.14), { stiffness: 260, damping: 24 }));
    ctx.save();
    ctx.globalAlpha = clamp((lt - 0.1) * 7);
    ctx.translate(CX, cy + 115 * U);
    ctx.scale(cp, cp);
    ctx.font = `700 ${Math.round(24 * U)}px FreeMono, monospace`;
    const cw = Math.min(W * 0.84, ctx.measureText(command).width + 64 * U);
    rr(-cw / 2, -28 * U, cw, 56 * U, 12 * U);
    ctx.fillStyle = '#0D111C';
    ctx.fill();
    ctx.strokeStyle = rgba('#34D399', 0.45);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#34D399';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(command, 0, 0);
    ctx.restore();
  }

  const bp = lerp(0.88, 1, spring(Math.max(0, lt - 0.24), { stiffness: 250, damping: 22 }));
  const clickT = seg(lt, 0.85, 1.2);
  const press = 1 - Math.sin(clickT * Math.PI) * 0.08;
  ctx.save();
  ctx.globalAlpha = clamp((lt - 0.2) * 7);
  ctx.translate(CX, btnY);
  ctx.scale(bp * press, bp * press);
  ctx.font = `900 ${Math.round(28 * U)}px Inter, sans-serif`;
  const bw = Math.max(260 * U, ctx.measureText(cta).width + 88 * U);
  const bh = 70 * U;
  ctx.shadowColor = B.accentGlow;
  ctx.shadowBlur = 28 * U;
  rr(-bw / 2, -bh / 2, bw, bh, 16 * U);
  ctx.fillStyle = B.accent;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = B.onAccent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cta, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = clamp((lt - 0.3) * 6);
  ctx.fillStyle = '#94A3B8';
  ctx.font = `700 ${Math.round(21 * U)}px FreeMono, monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(urlText, CX, btnY + 64 * U);
  ctx.restore();

  if (lt > 0.35) {
    const mp = eo(seg(lt, 0.35, 0.85));
    cursor(lerp(CX + 260 * U, CX + 34 * U, mp), lerp(btnY + 150 * U, btnY + 8 * U, mp), { click: clickT });
  }
  ctx.restore();
}

/** Precision animated clock dial (for elapsed latency, build windows, SLA countdowns). */
export function clockDial({
  cx, cy, r = 36 * U, hour = 12, min = 0, sec = null, sweepFrac = 0,
  accent = B.accentBright, dark = true, ticks = true, centerCap = true,
} = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  circle(0, 0, r, dark ? 'rgba(13,17,28,0.92)' : '#FFFFFF');
  ctx.lineWidth = Math.max(1.8, r * 0.08);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(17,24,39,0.2)';
  ctx.stroke();

  if (sweepFrac > 0.01) {
    const endA = -Math.PI / 2 + clamp(sweepFrac) * TAU;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.88, -Math.PI / 2, endA); ctx.closePath();
    ctx.fillStyle = rgba(accent, 0.22); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, endA);
    ctx.strokeStyle = accent; ctx.lineWidth = Math.max(2, r * 0.09); ctx.stroke();
  }
  if (ticks) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      const major = i % 3 === 0;
      line([[Math.cos(a) * r * (major ? 0.72 : 0.82), Math.sin(a) * r * (major ? 0.72 : 0.82)], [Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9]], dark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.45)', major ? Math.max(1.8, r * 0.06) : Math.max(1, r * 0.03));
    }
  }
  const ah = ((hour % 12) / 12 + (min / 60) / 12) * TAU - Math.PI / 2;
  const am = (min / 60) * TAU - Math.PI / 2;
  line([[0, 0], [Math.cos(ah) * r * 0.46, Math.sin(ah) * r * 0.46]], dark ? '#F8FAFC' : '#111827', Math.max(2, r * 0.095));
  line([[0, 0], [Math.cos(am) * r * 0.7, Math.sin(am) * r * 0.7]], sec != null ? '#94A3B8' : accent, Math.max(1.6, r * 0.07));
  if (sec != null) {
    const as = (sec / 60) * TAU - Math.PI / 2;
    line([[0, 0], [Math.cos(as) * r * 0.82, Math.sin(as) * r * 0.82]], accent, Math.max(1.4, r * 0.05));
  }
  if (centerCap) circle(0, 0, Math.max(2, r * 0.09), dark ? '#F8FAFC' : '#111827');
  ctx.restore();
}

/** Framed bespoke AI artwork plate (`B.ai.*`) with optional Ken Burns pan and legibility veil. */
export function aiPlate(img, {
  x, y, w, h, zoom = 1.03, panX = 0.5, panY = 0.5, radius = 20 * U,
  veil = null, border = true, scale = 1, alpha = 1,
} = {}) {
  if (!img || alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);
  rr(0, 0, w, h, radius);
  ctx.clip();
  imageViewport(img, 0, 0, w, h, { zoom, panX, panY });
  if (veil) { ctx.fillStyle = veil; ctx.fillRect(0, 0, w, h); }
  ctx.restore();
  if (border) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
    rr(0, 0, w, h, radius);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.stroke();
    ctx.restore();
  }
}
