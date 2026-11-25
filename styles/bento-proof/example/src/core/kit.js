// Bento Proof Motion Kit: Swiss architectural grid, animated sparkline tiles, verified quotes, price anchor, crisp light UI.
import { ctx, W, H, CX, CY, U, PORTRAIT, TAU, clamp, lerp, seg, eo, eio, spring, rr, circle, line, fillAll, imageViewport, wrapLines, rgba, mixHex } from './lib.js';
import { B } from './brand.js';

export function swissGridBg(t, { pulse = 0 } = {}) {
  fillAll('#F4F4F7');
  const step = Math.round(48 * U);
  ctx.strokeStyle = 'rgba(17,24,39,0.045)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  const r = Math.max(W, H) * 0.65 * (1 + pulse * 0.04);
  const g = ctx.createRadialGradient(CX, CY * 0.45, 0, CX, CY * 0.45, r);
  g.addColorStop(0, rgba(B.accent, 0.09 + pulse * 0.03));
  g.addColorStop(1, 'rgba(244,244,247,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function badge(text, x, y, { scale = 1, dot = false, icon = null, accent = false, align = 'center' } = {}) {
  if (scale <= 0.01) return;
  const fs = Math.round((PORTRAIT ? 25 : 20) * U);
  ctx.save();
  ctx.font = `800 ${fs}px Inter, sans-serif`;
  ctx.letterSpacing = '1.2px';
  const txt = text.toUpperCase();
  const tw = ctx.measureText(txt).width;
  const padX = fs * 1.1;
  const icoW = icon ? fs * 1.15 : dot ? fs * 0.85 : 0;
  const w = tw + padX * 2 + icoW;
  const h = fs * 2.1;
  const ox = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;

  ctx.translate(ox, y);
  ctx.scale(scale, scale);
  rr(-w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = accent ? B.accentSoft : '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = accent ? rgba(B.accent, 0.45) : 'rgba(17,24,39,0.14)';
  ctx.stroke();

  const iconCol = accent ? B.accentBright : '#111827';
  if (icon) drawGlyph(icon, -w / 2 + padX + fs * 0.35, 0, fs * 0.44, iconCol);
  else if (dot) circle(-w / 2 + padX + fs * 0.22, 0, fs * 0.22, B.accent);
  ctx.fillStyle = accent ? B.accentBright : '#111827';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, -w / 2 + padX + icoW, fs * 0.04);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

export function kineticTitle(lines, { x = CX, y = CY, size = 86, lt = 1, stagger = 0.05, align = 'center', maxW = W * 0.86, lineGap = 1.12 } = {}) {
  const fs = Math.round(size * U);
  const stripStar = (s) => s.replace(/\*/g, '');
  ctx.save();
  ctx.font = `900 ${fs}px Inter, sans-serif`;
  ctx.letterSpacing = `${-Math.round(fs * 0.035)}px`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(stripStar(l)).width), 1);
  const effFs = fs * Math.min(1, maxW / widest);
  ctx.font = `900 ${effFs}px Inter, sans-serif`;
  ctx.letterSpacing = `${-Math.round(effFs * 0.035)}px`;

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
      ctx.fillStyle = tk.hi ? B.accent : '#111827';
      ctx.fillText(tk.txt, curX, ly + (1 - p) * effFs * 0.68);
      ctx.restore();
      curX += widths[wi] + sp;
    });
  });
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/** Modular Swiss Bento cell supporting rolling big metric, clock dial, animated graph, OR embedded real UI image. */
export function bentoTile({
  x, y, w, h, label, value = '', sub = '', accent = false, dark = false,
  spark = null, sparkP = 1, sparkColor = null, img = null, imgZoom = 1.03, imgPanX = 0.5, imgPanY = 0,
  clock = null, glyph = null, chip = null, chipBg = 'rgba(239,68,68,0.12)', chipColor = '#DC2626',
  scale = 1, alpha = 1,
} = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const r = 24 * U;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(17,24,39,0.07)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 10 * U;
  rr(0, 0, w, h, r);
  ctx.fillStyle = dark ? '#18181B' : accent ? B.accent : '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.12)' : accent ? B.accent : 'rgba(17,24,39,0.11)';
  ctx.stroke();

  const pad = 28 * U;
  if (img) {
    ctx.save();
    rr(0, 0, w, h, r);
    ctx.clip();
    imageViewport(img, 0, 56 * U, w, h - 56 * U, { zoom: imgZoom, panX: imgPanX, panY: imgPanY });
    ctx.fillStyle = dark ? '#18181B' : '#FFFFFF';
    ctx.fillRect(0, 0, w, 56 * U);
    ctx.fillStyle = dark ? '#E2E8F0' : '#6B7280';
    ctx.font = `800 ${Math.round(17 * U)}px FreeMono, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.toUpperCase(), pad, 29 * U);
    ctx.restore();
  } else {
    const lblCol = dark ? 'rgba(255,255,255,0.72)' : accent ? 'rgba(255,255,255,0.85)' : '#6B7280';
    const valCol = dark ? '#FFFFFF' : accent ? '#FFFFFF' : '#111827';
    const subCol = dark ? 'rgba(255,255,255,0.82)' : accent ? 'rgba(255,255,255,0.9)' : '#4B5563';
    const sc = sparkColor || (dark ? B.accent : accent ? '#FFFFFF' : B.accent);

    ctx.fillStyle = lblCol;
    ctx.font = `800 ${Math.round(17 * U)}px FreeMono, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label.toUpperCase(), pad, pad);

    if (chip) {
      ctx.font = `800 ${Math.round(14 * U)}px Inter, sans-serif`;
      const cw = ctx.measureText(chip).width + 24 * U;
      rr(w - pad - cw, pad - 5 * U, cw, 30 * U, 15 * U);
      ctx.fillStyle = chipBg; ctx.fill();
      ctx.fillStyle = chipColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(chip, w - pad - cw / 2, pad + 10 * U);
    }

    if (clock) {
      const cr = Math.min(58 * U, Math.max(30 * U, h * 0.21));
      clockDial({
        cx: w - pad - cr, cy: pad + cr + 10 * U, r: cr,
        hour: clock.hour ?? 12, min: clock.min ?? 0, sec: clock.sec ?? null, sweepFrac: clock.sweepFrac ?? 0.5,
        accent: clock.accent || (dark ? B.accent : B.accentBright), dark,
      });
    } else if (glyph) {
      drawGlyph(glyph, w - pad - 20 * U, pad + 20 * U, 18 * U, dark ? B.accent : B.accentBright);
    }

    if (value) {
      ctx.fillStyle = valCol;
      ctx.font = `900 ${Math.round(60 * U)}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(value, pad, pad + 34 * U);
    }

    if (spark && spark.length > 1) {
      const gx = pad, gy = pad + (value ? 115 * U : 48 * U);
      const gw = w - pad * 2, gh = h - gy - (sub ? 58 * U : pad);
      if (gh > 40 * U) {
        const min = Math.min(...spark), max = Math.max(...spark);
        const pts = spark.map((v, i) => [
          gx + (i / (spark.length - 1)) * gw,
          gy + gh - ((v - min) / (max - min || 1)) * gh,
        ]);
        const drawN = Math.max(2, Math.round(pts.length * clamp(sparkP)));
        const visPts = pts.slice(0, drawN);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(visPts[0][0], gy + gh);
        visPts.forEach(([px, py]) => ctx.lineTo(px, py));
        ctx.lineTo(visPts[visPts.length - 1][0], gy + gh);
        ctx.closePath();
        ctx.fillStyle = accent ? 'rgba(255,255,255,0.18)' : rgba(sc, 0.14);
        ctx.fill();
        ctx.restore();
        line(visPts, sc, 5 * U);
        const last = visPts[visPts.length - 1];
        circle(last[0], last[1], 7 * U, sc);
      }
    }

    if (sub) {
      ctx.fillStyle = subCol;
      const fSub = `700 ${Math.round(20 * U)}px Inter, sans-serif`;
      const lines = wrapLines(sub, w - pad * 2, fSub);
      ctx.font = fSub;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, pad, h - pad - (lines.slice(0, 2).length - i) * 26 * U + 4 * U));
    }
  }
  ctx.restore();
}

/** Verified founder social proof quote tile with crisp outcome chip. */
export function quoteCard({ x, y, w, h, quote, author, role, resultPill, scale = 1, alpha = 1 } = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(17,24,39,0.07)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 10 * U;
  rr(0, 0, w, h, 24 * U);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(17,24,39,0.12)';
  ctx.stroke();

  const pad = 32 * U;
  // Result chip top left
  if (resultPill) {
    ctx.font = `800 ${Math.round(16 * U)}px Inter, sans-serif`;
    const pw = ctx.measureText(resultPill).width + 30 * U;
    rr(pad, pad, pw, 34 * U, 17 * U);
    ctx.fillStyle = rgba('#10B981', 0.14);
    ctx.fill();
    ctx.fillStyle = '#047857';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(resultPill, pad + pw / 2, pad + 17 * U);
  }

  // Quote body
  const fQ = `800 ${Math.round((PORTRAIT ? 28 : 30) * U)}px Inter, sans-serif`;
  const lines = wrapLines(`“${quote}”`, w - pad * 2, fQ);
  ctx.font = fQ;
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.slice(0, 4).forEach((ln, i) => ctx.fillText(ln, pad, pad + 56 * U + i * 38 * U));

  // Author monogram avatar + name/role
  const ay = h - pad - 24 * U;
  circle(pad + 22 * U, ay, 22 * U, B.accentSoft);
  ctx.fillStyle = B.accent;
  ctx.font = `900 ${Math.round(18 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(author.split(' ').map((n) => n[0]).join('').slice(0, 2), pad + 22 * U, ay);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = `800 ${Math.round(20 * U)}px Inter, sans-serif`;
  ctx.fillText(author, pad + 56 * U, ay - 9 * U);
  ctx.fillStyle = '#6B7280';
  ctx.font = `700 ${Math.round(16 * U)}px Inter, sans-serif`;
  ctx.fillText(role, pad + 56 * U, ay + 13 * U);
  ctx.restore();
}

/** Strikethrough Price Anchoring card: lists bloated competitor stack, animates red slash, springs indie price. */
export function priceAnchorCard({ x, y, w, h, header = 'REPLACES BLOATED STACK', totalLabel = 'Legacy total', oldItems = [], oldTotal = '$248/mo', newPrice = '$19/mo', newNote = 'All-in-one · Cancel anytime', strikeT = 1, scale = 1 } = {}) {
  if (scale <= 0.01) return;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(17,24,39,0.08)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 10 * U;
  rr(0, 0, w, h, 24 * U);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(B.accent, 0.35);
  ctx.stroke();

  const pad = 32 * U;
  ctx.fillStyle = '#6B7280';
  ctx.font = `800 ${Math.round(16 * U)}px FreeMono, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(header, pad, pad);

  // Legacy items list
  oldItems.forEach(([name, price], i) => {
    const ry = pad + 42 * U + i * 38 * U;
    ctx.font = `700 ${Math.round(21 * U)}px Inter, sans-serif`;
    ctx.fillStyle = '#4B5563';
    ctx.textAlign = 'left';
    ctx.fillText(name, pad, ry);
    ctx.textAlign = 'right';
    ctx.fillText(price, w - pad, ry);
  });

  // Old Total + Animated Red Slash across it!
  const totY = pad + 42 * U + oldItems.length * 38 * U + 16 * U;
  ctx.fillStyle = '#9CA3AF';
  ctx.font = `800 ${Math.round(26 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(totalLabel, pad, totY);
  ctx.textAlign = 'right';
  const totW = ctx.measureText(oldTotal).width;
  ctx.fillText(oldTotal, w - pad, totY);
  const k = eo(clamp(strikeT));
  if (k > 0.01) {
    line([[w - pad - totW - 10 * U, totY + 20 * U], [lerp(w - pad - totW - 10 * U, w - pad + 10 * U, k), totY + 6 * U]], '#EF4444', 5 * U);
  }

  // Divider
  ctx.fillStyle = 'rgba(17,24,39,0.08)';
  ctx.fillRect(pad, h - 140 * U, w - pad * 2, 1.5);

  // Indie Price pop!
  const pNew = spring(Math.max(0, strikeT - 0.15) * 1.4, { stiffness: 260, damping: 20 });
  ctx.save();
  ctx.translate(pad, h - 116 * U);
  ctx.scale(lerp(0.85, 1, pNew), lerp(0.85, 1, pNew));
  ctx.fillStyle = B.accent;
  ctx.font = `900 ${Math.round(58 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(newPrice, 0, 0);
  ctx.fillStyle = '#047857';
  const fNote = `800 ${Math.round(19 * U)}px Inter, sans-serif`;
  const noteLines = wrapLines(newNote, w - pad * 2, fNote);
  ctx.font = fNote;
  noteLines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, 0, 66 * U + i * 24 * U));
  ctx.restore();
  ctx.restore();
}

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

  ctx.shadowColor = 'rgba(17,24,39,0.14)';
  ctx.shadowBlur = 44 * U;
  ctx.shadowOffsetY = 18 * U;
  rr(0, 0, w, h, radius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  if (chrome) {
    ctx.save();
    rr(0, 0, w, h, radius);
    ctx.clip();
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, w, barH);
    circle(24 * U, barH / 2, 6 * U, '#FF5F56');
    circle(46 * U, barH / 2, 6 * U, '#FFBD2E');
    circle(68 * U, barH / 2, 6 * U, '#27C93F');
    const pillW = Math.min(w * 0.44, 340 * U);
    rr((w - pillW) / 2, barH * 0.21, pillW, barH * 0.58, barH * 0.29);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.fillStyle = '#4B5563';
    ctx.font = `700 ${Math.round(14 * U)}px Inter, sans-serif`;
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
    ctx.globalAlpha = sa * 0.52;
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.rect(0, barH, w, h - barH);
    ctx.roundRect(vx, vy, vw, vh, 14 * U);
    ctx.fill('evenodd');
    ctx.globalAlpha = sa;
    rr(vx, vy, vw, vh, 14 * U);
    ctx.strokeStyle = B.accent;
    ctx.lineWidth = 3.5 * U;
    ctx.stroke();
    ctx.restore();
  }

  if (sheenT >= 0 && sheenT <= 1) {
    const sx = lerp(-w * 0.4, w * 1.4, eio(sheenT));
    const grad = ctx.createLinearGradient(sx - 160 * U, 0, sx + 160 * U, h);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, barH, w, h - barH);
  }
  ctx.restore();

  rr(0, 0, w, h, radius);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(17,24,39,0.12)';
  ctx.stroke();
  ctx.restore();
}

export function cursor(x, y, { click = 0, label = '', scale = 1 } = {}) {
  const s = (1 - Math.sin(clamp(click) * Math.PI) * 0.22) * scale * U;
  if (click > 0 && click < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - eo(click);
    ctx.beginPath();
    ctx.arc(x, y, lerp(8, 52, eo(click)) * U, 0, TAU);
    ctx.strokeStyle = B.accent;
    ctx.lineWidth = 4 * U;
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.26)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.lineTo(11, 30); ctx.lineTo(20, 48);
  ctx.lineTo(27, 45); ctx.lineTo(18, 27); ctx.lineTo(31, 26); ctx.closePath();
  ctx.fillStyle = '#111827'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
  if (label) {
    ctx.font = '800 17px Inter, sans-serif';
    const tw = ctx.measureText(label).width;
    rr(24, 32, tw + 24, 34, 17);
    ctx.fillStyle = B.accent; ctx.fill();
    ctx.fillStyle = B.onAccent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 24 + (tw + 24) / 2, 49);
  }
  ctx.restore();
}

export function ctaEndcard({ lt, tagline, cta = B.copy.ctaPrimary || 'Start 14-Day Free Trial', urlText = B.domain }) {
  const p = lerp(0.88, 1, spring(lt, { stiffness: 240, damping: 22 }));
  const rawTags = Array.isArray(tagline) ? tagline.map(String) : [String(tagline)];
  const hasExplicitStar = rawTags.some((s) => s.includes('*'));
  const tagLines = rawTags.map((s) => (hasExplicitStar || s.includes('*') ? s : `*${s}*`));
  const extraH = (tagLines.length - 1) * 38 * U;
  const cy = CY - (20 * U + extraH * 0.25);
  const logoSize = 86 * U;

  ctx.save();
  ctx.globalAlpha = clamp(lt * 8);
  ctx.save();
  ctx.translate(CX, cy - 195 * U);
  ctx.scale(p, p);
  rr(-logoSize / 2, -logoSize / 2, logoSize, logoSize, 22 * U);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(B.accent, 0.35);
  ctx.stroke();
  if (B.logoImg) {
    const pad = 16 * U;
    ctx.drawImage(B.logoImg, -logoSize / 2 + pad, -logoSize / 2 + pad, logoSize - pad * 2, logoSize - pad * 2);
  } else {
    circle(0, 0, logoSize * 0.24, B.accent);
  }
  ctx.restore();

  kineticTitle([B.name, ...tagLines], {
    x: CX, y: cy - (35 * U - extraH * 0.25), size: PORTRAIT ? 70 : 80, lt, stagger: 0.04, maxW: W * 0.86,
  });

  const btnY = cy + 150 * U + extraH;
  const bp = lerp(0.88, 1, spring(Math.max(0, lt - 0.16), { stiffness: 250, damping: 22 }));
  const clickT = seg(lt, 0.85, 1.2);
  const press = 1 - Math.sin(clickT * Math.PI) * 0.08;
  ctx.save();
  ctx.globalAlpha = clamp((lt - 0.12) * 7);
  ctx.translate(CX, btnY);
  ctx.scale(bp * press, bp * press);
  ctx.font = `900 ${Math.round(28 * U)}px Inter, sans-serif`;
  const bw = Math.max(280 * U, ctx.measureText(cta).width + 92 * U);
  const bh = 74 * U;
  ctx.shadowColor = B.accentGlow;
  ctx.shadowBlur = 28 * U;
  rr(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = B.accent;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = B.onAccent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cta, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = clamp((lt - 0.28) * 6);
  ctx.fillStyle = '#4B5563';
  ctx.font = `800 ${Math.round(22 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(urlText, CX, btnY + 68 * U);
  ctx.restore();

  if (lt > 0.35) {
    const mp = eo(seg(lt, 0.35, 0.85));
    cursor(lerp(CX + 260 * U, CX + 38 * U, mp), lerp(btnY + 140 * U, btnY + 1 * U, mp), { click: clickT });
  }
  ctx.restore();
}

/** Crisp precision geometric vector glyphs — zero emoji, zero AI sparkles, zero pulse dots. */
export function drawGlyph(kind, cx, cy, r = 14 * U, color = '#111827', lw = Math.max(2, r * 0.17)) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'clock') {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.5); ctx.moveTo(0, 0); ctx.lineTo(r * 0.38, r * 0.14); ctx.stroke();
  } else if (kind === 'chain') {
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath(); ctx.roundRect(-r * 0.88, -r * 0.34, r * 0.95, r * 0.68, r * 0.34); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-r * 0.07, -r * 0.34, r * 0.95, r * 0.68, r * 0.34); ctx.stroke();
  } else if (kind === 'trophy') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.65); ctx.lineTo(r * 0.55, -r * 0.65);
    ctx.quadraticCurveTo(r * 0.52, r * 0.15, 0, r * 0.25);
    ctx.quadraticCurveTo(-r * 0.52, r * 0.15, -r * 0.55, -r * 0.65);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, r * 0.25); ctx.lineTo(0, r * 0.68); ctx.moveTo(-r * 0.38, r * 0.68); ctx.lineTo(r * 0.38, r * 0.68); ctx.stroke();
  } else if (kind === 'swords') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.68, r * 0.68); ctx.lineTo(r * 0.68, -r * 0.68);
    ctx.moveTo(r * 0.68, r * 0.68); ctx.lineTo(-r * 0.68, -r * 0.68);
    ctx.moveTo(-r * 0.45, r * 0.18); ctx.lineTo(-r * 0.18, r * 0.45);
    ctx.moveTo(r * 0.45, r * 0.18); ctx.lineTo(r * 0.18, r * 0.45);
    ctx.stroke();
  } else if (kind === 'check') {
    ctx.beginPath(); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(-r * 0.15, r * 0.46); ctx.lineTo(r * 0.65, -r * 0.46); ctx.stroke();
  }
  ctx.restore();
}

/** Precision animated watch dial for hours / deadlines / turnaround countdowns. */
export function clockDial({
  cx, cy, r = 46 * U, hour = 12, min = 0, sec = null, sweepFrac = 0,
  accent = B.accent, dark = false, ticks = true, centerCap = true,
} = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  circle(0, 0, r, dark ? 'rgba(255,255,255,0.06)' : '#FAF5F2');
  ctx.lineWidth = Math.max(2, r * 0.075);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(17,24,39,0.18)';
  ctx.stroke();

  if (sweepFrac > 0.005) {
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
    ctx.lineWidth = Math.max(2.5, r * 0.09);
    ctx.stroke();
  }
  if (ticks) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      const major = i % 3 === 0;
      const r0 = r * (major ? 0.72 : 0.82);
      const r1 = r * 0.91;
      line([[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], dark ? 'rgba(255,255,255,0.48)' : 'rgba(17,24,39,0.42)', major ? Math.max(2, r * 0.055) : Math.max(1, r * 0.03));
    }
  }
  const ah = ((hour % 12) / 12 + (min / 60) / 12) * TAU - Math.PI / 2;
  const am = (min / 60) * TAU - Math.PI / 2;
  line([[0, 0], [Math.cos(ah) * r * 0.48, Math.sin(ah) * r * 0.48]], dark ? '#FFFFFF' : '#111827', Math.max(2.2, r * 0.095));
  line([[0, 0], [Math.cos(am) * r * 0.72, Math.sin(am) * r * 0.72]], sec != null ? (dark ? '#E2E8F0' : '#374151') : accent, Math.max(1.8, r * 0.07));
  if (sec != null) {
    const as = (sec / 60) * TAU - Math.PI / 2;
    line([[0, 0], [Math.cos(as) * r * 0.82, Math.sin(as) * r * 0.82]], accent, Math.max(1.4, r * 0.045));
  }
  if (centerCap) circle(0, 0, Math.max(2.5, r * 0.085), dark ? '#FFFFFF' : '#111827');
  ctx.restore();
}

/** Tactile clock + digital readout pill (replaces fake pulse dots with real moving time). */
export function clockPill({ x, y, clockText = '47:59:58', sweep = 0, dark = false, accent = B.accent, align = 'center', scale = 1 } = {}) {
  if (scale <= 0.01) return;
  const fs = Math.round(19 * U);
  ctx.save();
  ctx.font = `800 ${fs}px FreeMono, monospace`;
  const tw = ctx.measureText(clockText).width;
  const dialR = 13 * U;
  const w = dialR * 2 + tw + 40 * U;
  const h = 42 * U;
  const ox = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;
  ctx.translate(ox, y);
  ctx.scale(scale, scale);
  rr(-w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = dark ? rgba(accent, 0.45) : 'rgba(17,24,39,0.14)';
  ctx.stroke();

  clockDial({ cx: -w / 2 + 14 * U + dialR, cy: 0, r: dialR, hour: 12, min: (sweep * 60) % 60, sec: (sweep * 360) % 60, sweepFrac: sweep % 1, accent, dark, ticks: false, centerCap: true });
  ctx.fillStyle = dark ? '#FFFFFF' : '#111827';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(clockText, -w / 2 + 24 * U + dialR * 2, 1 * U);
  ctx.restore();
}

/** Interactive keystroke-typing input bar + click button squish. */
export function typeUrlBar({ x, y, w, h = 76 * U, typed = '', caret = true, btnText = 'Find Battle', pressed = 0, scale = 1 } = {}) {
  if (scale <= 0.01) return;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(17,24,39,0.12)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 8 * U;
  rr(0, 0, w, h, h / 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(B.accent, 0.48);
  ctx.stroke();

  const pad = 28 * U;
  ctx.font = `700 ${Math.round(23 * U)}px FreeMono, monospace`;
  ctx.fillStyle = typed ? '#111827' : '#9CA3AF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const show = typed || 'yourproduct.com';
  ctx.fillText(show, pad, h / 2);
  if (caret) {
    const tw = typed ? ctx.measureText(typed).width : 0;
    ctx.fillStyle = B.accent;
    ctx.fillRect(pad + tw + 3 * U, h * 0.28, 3 * U, h * 0.44);
  }

  ctx.font = `800 ${Math.round(20 * U)}px Inter, sans-serif`;
  const bw = Math.max(170 * U, ctx.measureText(btnText).width + 54 * U);
  const bh = h - 16 * U;
  ctx.save();
  ctx.translate(w - bw / 2 - 8 * U, h / 2);
  const sBtn = 1 - pressed * 0.07;
  ctx.scale(sBtn, sBtn);
  rr(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = B.accent;
  ctx.fill();
  ctx.fillStyle = B.onAccent;
  ctx.textAlign = 'center';
  ctx.fillText(btnText, 0, 0);
  ctx.restore();
  ctx.restore();
}

/** Scrolling launch-day directory feed comparing pay-to-win sponsored slots against a buried solo launch (#47). */
export function rankFeed({
  x, y, w, h, scrollP = 0, header = 'LAUNCH DIRECTORY FEED', rows = null, scale = 1, alpha = 1,
} = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const defaultRows = rows || [
    { rank: '#1', name: 'Funded AI Workspace', tag: 'SPONSORED · $299', kind: 'paid' },
    { rank: '#2', name: 'Growth Suite Enterprise', tag: 'AD BOOST · $149', kind: 'paid' },
    { rank: '#3', name: ' VC-Backed Copilot', tag: 'FEATURED · $99', kind: 'paid' },
    { rank: '#18', name: 'Generic Wrapper #18', tag: '42 upvotes', kind: 'normal' },
    { rank: '#31', name: 'Prompt Directory Pro', tag: '11 upvotes', kind: 'normal' },
    { rank: '#47', name: 'Your Indie Product', tag: '0 clicks · buried', kind: 'buried' },
  ];
  const r = 24 * U, barH = 52 * U;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(17,24,39,0.08)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 10 * U;
  rr(0, 0, w, h, r);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(17,24,39,0.12)';
  ctx.stroke();

  ctx.save();
  rr(0, 0, w, h, r);
  ctx.clip();
  ctx.fillStyle = '#FAF5F2';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillStyle = '#6B7280';
  ctx.font = `800 ${Math.round(16 * U)}px FreeMono, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(header, 24 * U, barH / 2);

  const rowH = 74 * U, gap = 12 * U;
  const totalH = defaultRows.length * (rowH + gap);
  const viewH = h - barH - 28 * U;
  const maxScroll = Math.max(0, totalH - viewH);
  const scrollOff = eio(clamp(scrollP)) * maxScroll;

  ctx.beginPath();
  ctx.rect(0, barH, w, h - barH);
  ctx.clip();

  defaultRows.forEach((row, i) => {
    const ry = barH + 16 * U + i * (rowH + gap) - scrollOff;
    if (ry + rowH < barH || ry > h) return;
    const isPaid = row.kind === 'paid';
    const isBuried = row.kind === 'buried';
    rr(20 * U, ry, w - 40 * U, rowH, 14 * U);
    ctx.fillStyle = isBuried ? '#FEF2F2' : isPaid ? '#FFFBEB' : '#F8FAFC';
    ctx.fill();
    ctx.lineWidth = isBuried ? 2 : 1.2;
    ctx.strokeStyle = isBuried ? '#EF4444' : isPaid ? '#F59E0B' : 'rgba(17,24,39,0.08)';
    ctx.stroke();

    ctx.font = `900 ${Math.round(21 * U)}px FreeMono, monospace`;
    ctx.fillStyle = isBuried ? '#DC2626' : isPaid ? '#B45309' : '#6B7280';
    ctx.textAlign = 'left';
    ctx.fillText(row.rank, 38 * U, ry + rowH / 2);

    ctx.font = `800 ${Math.round(20 * U)}px Inter, sans-serif`;
    ctx.fillStyle = isBuried ? '#111827' : isPaid ? '#374151' : '#6B7280';
    ctx.fillText(row.name.trim(), 106 * U, ry + rowH / 2);

    ctx.font = `800 ${Math.round(14 * U)}px FreeMono, monospace`;
    const tagW = ctx.measureText(row.tag).width + 24 * U;
    rr(w - 36 * U - tagW, ry + rowH / 2 - 15 * U, tagW, 30 * U, 15 * U);
    ctx.fillStyle = isBuried ? 'rgba(239,68,68,0.14)' : isPaid ? 'rgba(245,158,11,0.16)' : 'rgba(107,114,128,0.1)';
    ctx.fill();
    ctx.fillStyle = isBuried ? '#DC2626' : isPaid ? '#B45309' : '#6B7280';
    ctx.textAlign = 'center';
    ctx.fillText(row.tag, w - 36 * U - tagW / 2, ry + rowH / 2);
  });

  // Scrollbar track + thumb on right edge
  if (maxScroll > 4) {
    const sbH = Math.max(36 * U, viewH * (viewH / totalH));
    const sbY = barH + 14 * U + eio(clamp(scrollP)) * (viewH - sbH);
    rr(w - 11 * U, sbY, 4 * U, sbH, 2 * U);
    ctx.fillStyle = 'rgba(17,24,39,0.22)';
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

/** Interactive 1v1 Live Matchup Stage with bespoke product challenger badges, VS emblem, vote split bar, and clockPill. */
export function duelCard({
  x, y, w, h,
  leftTitle = 'Grid for Artists', leftTag = 'Design Tools', leftSub = 'Browser grid system for studios', leftImg = null,
  rightTitle = 'MythNamer', rightTag = 'Creative AI', rightSub = 'Lore & naming engine for writers', rightImg = null,
  leftShare = 0.54, duelP = 1, clockText = '47:59:56', sweep = 0,
  header = 'LIVE 1V1 ARENA · EQUAL STAGE', dark = true, scale = 1, alpha = 1,
} = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const r = 26 * U, pad = 26 * U;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(17,24,39,0.18)';
  ctx.shadowBlur = 32 * U;
  ctx.shadowOffsetY = 14 * U;
  rr(0, 0, w, h, r);
  ctx.fillStyle = dark ? '#2E1F28' : '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.12)';
  ctx.stroke();

  // Top header + integrated clockPill
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.72)' : '#6B7280';
  ctx.font = `800 ${Math.round(16 * U)}px FreeMono, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(header, pad, pad + 18 * U);
  clockPill({
    x: w - pad, y: pad + 18 * U, align: 'right',
    clockText, sweep, dark, accent: B.accent,
  });

  // Side-by-side contender cards
  const gap = 28 * U;
  const topY = pad + 56 * U;
  const barAreaH = 62 * U;
  const cardH = Math.max(120 * U, h - topY - barAreaH - pad);
  const cw = (w - pad * 2 - gap) / 2;

  const drawContender = (cx0, title, tag, sub, img, pctStr, isLeading, accentCol) => {
    rr(cx0, topY, cw, cardH, 18 * U);
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.06)' : '#F8FAFC';
    ctx.fill();
    ctx.lineWidth = isLeading ? 2 : 1.2;
    ctx.strokeStyle = isLeading ? B.accent : dark ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.1)';
    ctx.stroke();

    if (img) {
      ctx.save();
      rr(cx0 + 12 * U, topY + 12 * U, cw - 24 * U, Math.max(60 * U, cardH - 94 * U), 12 * U);
      ctx.clip();
      imageViewport(img, cx0 + 12 * U, topY + 12 * U, cw - 24 * U, Math.max(60 * U, cardH - 94 * U), { zoom: 1.04, panX: 0.5, panY: 0.15 });
      ctx.restore();
    } else {
      // Crisp product emblem pill + mini live activity rows (clean, legible at 1080p and mobile thumbnails)
      const ip = 18 * U;
      const boxS = 44 * U;
      rr(cx0 + ip, topY + ip, boxS, boxS, 12 * U);
      ctx.fillStyle = isLeading ? B.accent : 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.fillStyle = isLeading ? B.onAccent : '#FAF5F2';
      ctx.font = `900 ${Math.round(22 * U)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title[0], cx0 + ip + boxS / 2, topY + ip + boxS / 2 + 1);

      // Category chip top right
      ctx.font = `700 ${Math.round(13 * U)}px FreeMono, monospace`;
      const twTag = ctx.measureText(tag.toUpperCase()).width + 20 * U;
      rr(cx0 + cw - ip - twTag, topY + ip + 8 * U, twTag, 26 * U, 13 * U);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.fillStyle = 'rgba(250,245,242,0.82)';
      ctx.fillText(tag.toUpperCase(), cx0 + cw - ip - twTag / 2, topY + ip + 21 * U);

      // Clean tagline inside contender box
      if (sub && cardH > 165 * U) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const fSub = `600 ${Math.round(16 * U)}px Inter, sans-serif`;
        ctx.font = fSub;
        ctx.fillStyle = 'rgba(250,245,242,0.72)';
        const lines = wrapLines(sub, cw - ip * 2, fSub);
        lines.slice(0, 2).forEach((ln, idx) => ctx.fillText(ln, cx0 + ip, topY + ip + boxS + 14 * U + idx * 21 * U));
      }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = dark ? '#FAF5F2' : '#111827';
    ctx.font = `900 ${Math.round(23 * U)}px Inter, sans-serif`;
    ctx.fillText(title, cx0 + 18 * U, topY + cardH - 46 * U);
    ctx.fillStyle = isLeading ? B.accent : 'rgba(250,245,242,0.68)';
    ctx.font = `700 ${Math.round(15 * U)}px FreeMono, monospace`;
    ctx.fillText(isLeading ? 'LEADING · LIVE VOTES' : 'CHALLENGER · LIVE', cx0 + 18 * U, topY + cardH - 22 * U);
    ctx.textAlign = 'right';
    ctx.fillStyle = isLeading ? B.accent : dark ? '#CBD5E1' : '#374151';
    ctx.font = `900 ${Math.round(28 * U)}px FreeMono, monospace`;
    ctx.fillText(pctStr, cx0 + cw - 18 * U, topY + cardH - 36 * U);
  };

  const curShare = lerp(0.5, leftShare, eio(clamp(duelP)));
  const lp = Math.round(curShare * 100);
  drawContender(pad, leftTitle, leftTag, leftSub, leftImg, `${lp}%`, lp >= 50, B.accent);
  drawContender(pad + cw + gap, rightTitle, rightTag, rightSub, rightImg, `${100 - lp}%`, lp < 50, '#7D5468');

  // Center VS badge
  const vx = w / 2, vy = topY + cardH / 2 - 10 * U;
  circle(vx, vy, 28 * U, B.accent);
  ctx.lineWidth = 3 * U;
  ctx.strokeStyle = dark ? '#2E1F28' : '#FFFFFF';
  ctx.stroke();
  ctx.fillStyle = B.onAccent;
  ctx.font = `900 ${Math.round(19 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', vx, vy + 1 * U);

  // Bottom vote momentum tug-of-war bar
  const by = h - pad - 24 * U, bw = w - pad * 2, bh = 16 * U;
  rr(pad, by, bw, bh, bh / 2);
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.12)' : '#E5E7EB';
  ctx.fill();
  rr(pad, by, Math.max(bh, bw * curShare), bh, bh / 2);
  ctx.fillStyle = B.accent;
  ctx.fill();
  ctx.restore();
}

/** Framed bespoke AI artwork plate (`B.ai.*`) using true cover scaling + Ken Burns pan & legibility veil. */
export function aiPlate(img, {
  x, y, w, h, zoom = 1.03, panX = 0.5, panY = 0.5, radius = 24 * U,
  veil = null, border = true, scale = 1, alpha = 1,
} = {}) {
  if (!img || alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(17,24,39,0.14)';
  ctx.shadowBlur = 32 * U;
  ctx.shadowOffsetY = 12 * U;
  rr(0, 0, w, h, radius);
  ctx.fillStyle = '#18181B';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.save();
  rr(0, 0, w, h, radius);
  ctx.clip();
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * s, dh = img.height * s;
  const ox = -Math.max(0, dw - w) * clamp(panX);
  const oy = -Math.max(0, dh - h) * clamp(panY);
  ctx.drawImage(img, ox, oy, dw, dh);
  if (veil) {
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  if (border) {
    rr(0, 0, w, h, radius);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
  }
  ctx.restore();
}
