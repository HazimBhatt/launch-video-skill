// Problem Story Motion Kit: Warm editorial paper, Caladea serif accents, vector chaos deck, before/after wipe, light UI chrome.
import { ctx, W, H, CX, CY, U, PORTRAIT, TAU, clamp, lerp, seg, eo, eio, spring, rr, circle, line, fillAll, imageViewport, wrapLines, rgba, mixHex } from './lib.js';
import { B } from './brand.js';

export function paperBg(t, { pulse = 0, glowY = CY * 0.8 } = {}) {
  fillAll(B.bg || '#F7F5EE');
  const r = Math.max(W, H) * 0.75;
  const g = ctx.createRadialGradient(CX, glowY, 0, CX, glowY, r);
  g.addColorStop(0, rgba(B.accent, 0.08 + pulse * 0.03));
  g.addColorStop(1, 'rgba(247,245,238,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Delicate architectural drafting rule dots
  const step = Math.round(52 * U);
  ctx.fillStyle = 'rgba(17,24,39,0.06)';
  for (let x = step / 2; x < W; x += step) {
    for (let y = step / 2; y < H; y += step) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
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
  const dotW = (dot || icon) ? fs * 1.0 : 0;
  const w = tw + padX * 2 + dotW;
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

  if (icon === 'clock') {
    clockBadge(-w / 2 + padX + fs * 0.25, 0, fs * 0.44, 0, 12);
  } else if (dot) {
    circle(-w / 2 + padX + fs * 0.22, 0, fs * 0.22, B.accent);
  }
  ctx.fillStyle = accent ? B.accent : '#111827';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, -w / 2 + padX + dotW, fs * 0.04);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/** Editorial geometric Inter + warm italic Caladea serif for `*highlighted` words! */
export function editorialTitle(lines, { x = CX, y = CY, size = 86, lt = 1, stagger = 0.05, align = 'center', maxW = W * 0.86, lineGap = 1.14 } = {}) {
  const fs = Math.round(size * U);
  const stripStar = (s) => s.replace(/\*/g, '');
  ctx.save();
  ctx.font = `900 ${fs}px Inter, sans-serif`;
  ctx.letterSpacing = `${-Math.round(fs * 0.03)}px`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(stripStar(l)).width), 1);
  const effFs = fs * Math.min(1, maxW / widest);
  const lh = effFs * lineGap;
  const y0 = y - (lines.length * lh) / 2 + lh / 2;

  lines.forEach((rawLine, li) => {
    let inSpan = false;
    const tokens = rawLine.split(/\s+/).filter(Boolean).map((raw) => {
      let tok = raw, hi = inSpan;
      if (tok.startsWith('*')) { hi = true; tok = tok.slice(1); inSpan = true; }
      if (tok.includes('*')) { tok = tok.replace(/\*/g, ''); inSpan = false; hi = true; }
      return { txt: tok, hi };
    });

    const widths = tokens.map((tk) => {
      ctx.font = tk.hi ? `italic 700 ${Math.round(effFs * 1.06)}px Caladea, Georgia, serif` : `900 ${effFs}px Inter, sans-serif`;
      return ctx.measureText(tk.txt).width;
    });
    ctx.font = `900 ${effFs}px Inter, sans-serif`;
    const sp = ctx.measureText(' ').width * 1.08;
    const lineW = widths.reduce((a, b) => a + b, 0) + sp * Math.max(0, tokens.length - 1);
    let curX = align === 'left' ? x : align === 'right' ? x - lineW : x - lineW / 2;
    const ly = y0 + li * lh;

    tokens.forEach((tk, wi) => {
      const delay = (li * 2 + wi) * stagger;
      const p = spring(Math.max(0, lt - delay), { stiffness: 280, damping: 24 });
      const a = clamp((lt - delay) * 8);
      if (a <= 0.01) { curX += widths[wi] + sp; return; }
      ctx.save();
      ctx.beginPath();
      ctx.rect(curX - 24, ly - lh * 0.64, widths[wi] + 48, lh * 1.28);
      ctx.clip();
      ctx.globalAlpha = a;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      if (tk.hi) {
        ctx.font = `italic 700 ${Math.round(effFs * 1.06)}px Caladea, Georgia, serif`;
        ctx.fillStyle = B.accent;
      } else {
        ctx.font = `900 ${effFs}px Inter, sans-serif`;
        ctx.fillStyle = '#111827';
      }
      ctx.fillText(tk.txt, curX, ly + (1 - p) * effFs * 0.68);
      ctx.restore();
      curX += widths[wi] + sp;
    });
  });
  ctx.letterSpacing = '0px';
  ctx.restore();
}

/** Flat vector storytelling scene: messy alerts, spreadsheet rows, and spinning late-night clock. */
export function chaosCard(tag, title, sub, { x, y, w, rot = 0, scale = 1, alpha = 1, tint = '#EF4444' } = {}) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const h = 114 * U;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  ctx.shadowColor = 'rgba(17,24,39,0.12)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 10 * U;
  rr(-w / 2, -h / 2, w, h, 18 * U);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(tint, 0.35);
  ctx.stroke();

  // Left color stripe
  ctx.save();
  rr(-w / 2, -h / 2, w, h, 18 * U);
  ctx.clip();
  ctx.fillStyle = tint;
  ctx.fillRect(-w / 2, -h / 2, 10 * U, h);
  ctx.restore();

  const bw = Math.max(92 * U, tag.length * 11 * U + 22 * U);
  rr(-w / 2 + 26 * U, -h / 2 + 18 * U, bw, 28 * U, 8 * U);
  ctx.fillStyle = rgba(tint, 0.14);
  ctx.fill();
  ctx.fillStyle = tint;
  ctx.font = `900 ${Math.round(14 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, -w / 2 + 26 * U + bw / 2, -h / 2 + 32 * U);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = `800 ${Math.round(23 * U)}px Inter, sans-serif`;
  ctx.fillText(title, -w / 2 + 26 * U + bw + 14 * U, -h / 2 + 33 * U);

  ctx.fillStyle = '#4B5563';
  ctx.font = `700 ${Math.round(18 * U)}px FreeMono, monospace`;
  ctx.fillText(sub, -w / 2 + 26 * U, h / 2 - 26 * U);
  ctx.restore();
}

export function clockBadge(cx, cy, r, t, hour = 11.8) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(17,24,39,0.14)';
  ctx.shadowBlur = 22 * U;
  circle(0, 0, r, '#FFFFFF');
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 4 * U;
  ctx.strokeStyle = '#EF4444';
  ctx.stroke();

  const aH = ((hour % 12) / 12) * TAU - Math.PI / 2;
  const aM = ((t * 1.8) % 1) * TAU - Math.PI / 2;
  line([[0, 0], [Math.cos(aH) * r * 0.45, Math.sin(aH) * r * 0.45]], '#111827', 5 * U);
  line([[0, 0], [Math.cos(aM) * r * 0.7, Math.sin(aM) * r * 0.7]], '#EF4444', 3.5 * U);
  circle(0, 0, 5 * U, '#111827');
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

  ctx.shadowColor = 'rgba(17,24,39,0.16)';
  ctx.shadowBlur = 48 * U;
  ctx.shadowOffsetY = 22 * U;
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
    ctx.fillStyle = 'rgba(17,24,39,0.08)';
    ctx.fillRect(0, barH - 1, w, 1);
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
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(17,24,39,0.12)';
  ctx.stroke();
  ctx.restore();
}

/** Interactive Before/After split slider comparing custom messy canvas render (`drawBefore`) vs clean `afterImg` UI. */
export function splitCompare({ x, y, w, h, split = 0.5, beforeLabel = 'BEFORE · 2 HOURS', afterLabel = 'AFTER · 12 SECONDS', afterImg, drawBefore, scale = 1 } = {}) {
  if (scale <= 0.01) return;
  const r = 22 * U;
  const barH = 42 * U;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = 'rgba(17,24,39,0.16)';
  ctx.shadowBlur = 44 * U;
  ctx.shadowOffsetY = 18 * U;
  rr(0, 0, w, h, r);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.save();
  rr(0, 0, w, h, r);
  ctx.clip();

  // Top labels bar
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, w, barH);
  ctx.font = `800 ${Math.round(14 * U)}px Inter, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#DC2626';
  ctx.textAlign = 'left';
  ctx.fillText(beforeLabel, 22 * U, barH / 2);
  ctx.fillStyle = B.accent;
  ctx.textAlign = 'right';
  ctx.fillText(afterLabel, w - 22 * U, barH / 2);

  const divX = w * clamp(split, 0.04, 0.96);

  // Right side: crisp real UI capture (`afterImg`)
  ctx.save();
  ctx.beginPath();
  ctx.rect(divX, barH, w - divX, h - barH);
  ctx.clip();
  if (afterImg) imageViewport(afterImg, 0, barH, w, h - barH, { zoom: 1, panX: 0.5, panY: 0 });
  ctx.restore();

  // Left side: messy raw text/spreadsheet chaos (`drawBefore`)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, barH, divX, h - barH);
  ctx.clip();
  if (drawBefore) drawBefore(0, barH, w, h - barH);
  ctx.restore();

  // Divider handle line + pill knob
  ctx.fillStyle = '#111827';
  ctx.fillRect(divX - 2 * U, barH, 4 * U, h - barH);
  ctx.restore();

  circle(divX, barH + (h - barH) / 2, 22 * U, B.accent);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3 * U;
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(18 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⇄', divX, barH + (h - barH) / 2 + 1);

  rr(0, 0, w, h, r);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(17,24,39,0.14)';
  ctx.stroke();
  ctx.restore();
}

export function pointerTag(fx, fy, tx, ty, label, p = 1) {
  if (p <= 0.02) return;
  const k = eo(clamp(p));
  const mx = lerp(fx, tx, k), my = lerp(fy, ty, k);
  ctx.save();
  line([[fx, fy], [mx, my]], B.accent, 3.5 * U);
  circle(fx, fy, 6 * U, B.accent);
  if (k > 0.45) {
    ctx.globalAlpha = clamp((k - 0.45) * 2.2);
    ctx.font = `800 ${Math.round(19 * U)}px Inter, sans-serif`;
    const tw = ctx.measureText(label).width;
    const pw = tw + 30 * U, ph = 38 * U;
    const bx = tx > fx ? tx - 6 * U : tx - pw + 6 * U;
    rr(bx, ty - ph / 2, pw, ph, ph / 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + pw / 2, ty);
  }
  ctx.restore();
}

export function bentoCard({ x, y, w, h, label, value, sub, scale = 1, alpha = 1, highlight = false }) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(17,24,39,0.08)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 10 * U;
  rr(0, 0, w, h, 22 * U);
  ctx.fillStyle = highlight ? mixHex('#FFFFFF', B.accent, 0.08) : '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = highlight ? rgba(B.accent, 0.5) : 'rgba(17,24,39,0.12)';
  ctx.stroke();

  const pad = 26 * U;
  ctx.fillStyle = '#6B7280';
  ctx.font = `800 ${Math.round(18 * U)}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label.toUpperCase(), pad, pad);

  ctx.fillStyle = highlight ? B.accent : '#111827';
  ctx.font = `900 ${Math.round(54 * U)}px Inter, sans-serif`;
  ctx.fillText(value, pad, pad + 36 * U);

  if (sub) {
    ctx.fillStyle = '#4B5563';
    const lines = wrapLines(sub, w - pad * 2, `700 ${Math.round(20 * U)}px Inter, sans-serif`);
    ctx.font = `700 ${Math.round(20 * U)}px Inter, sans-serif`;
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
    ctx.arc(x, y, lerp(8, 52, eo(click)) * U, 0, TAU);
    ctx.strokeStyle = B.accent;
    ctx.lineWidth = 4 * U;
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
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
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 24 + (tw + 24) / 2, 49);
  }
  ctx.restore();
}

export function ctaEndcard({ lt, tagline, cta = B.copy.ctaPrimary || 'Generate First Invoice', urlText = B.domain }) {
  const p = lerp(0.88, 1, spring(lt, { stiffness: 240, damping: 22 }));
  const cy = CY - 64 * U;
  const logoSize = 86 * U;

  ctx.save();
  ctx.globalAlpha = clamp(lt * 8);
  ctx.save();
  ctx.translate(CX, cy - 190 * U);
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

  const rawTags = Array.isArray(tagline) ? tagline.map(String) : [String(tagline)];
  const hasExplicitStar = rawTags.some((s) => s.includes('*'));
  const tagLines = rawTags.map((s) => (hasExplicitStar || s.includes('*') ? s : `*${s}*`));
  const extraH = (tagLines.length - 1) * 40 * U;
  editorialTitle([B.name, ...tagLines], {
    x: CX, y: cy - (30 * U - extraH * 0.25), size: PORTRAIT ? 70 : 80, lt, stagger: 0.045, maxW: W * 0.86,
  });

  const btnY = cy + 148 * U + extraH;
  const bp = lerp(0.88, 1, spring(Math.max(0, lt - 0.18), { stiffness: 250, damping: 22 }));
  const clickT = seg(lt, 0.85, 1.2);
  const press = 1 - Math.sin(clickT * Math.PI) * 0.08;
  ctx.save();
  ctx.globalAlpha = clamp((lt - 0.14) * 7);
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
    cursor(lerp(CX + 260 * U, CX + 34 * U, mp), lerp(btnY + 150 * U, btnY + 8 * U, mp), { click: clickT });
  }
  ctx.restore();
}
