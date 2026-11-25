// Captions: responsive 16:9 & 9:16 word-synced captions with brand accent highlight.
// Used automatically in "narrated" mode (or if script.captions === true).
// In "beats" mode, shots.js renders kinetic display typography directly in the frame.
import { ctx, W, LOUT, U, PORTRAIT, clamp, lerp, seg, eob } from './lib.js';
import { B } from './brand.js';
import { T, lineWords } from './timing.js';

let caps = [];

function autoChunks(text) {
  const ws = text.toUpperCase().split(/\s+/).filter(Boolean), out = [];
  for (let i = 0; i < ws.length;) {
    const n = ws.length - i === 4 ? 2 : Math.min(3, ws.length - i);
    out.push(ws.slice(i, i + n));
    i += n;
  }
  return out.map((c) => {
    const k = c.reduce((b, w, j) => (w.replace(/[^A-Z]/g, '').length > c[b].replace(/[^A-Z]/g, '').length ? j : b), 0);
    return c.map((w, j) => (j === k ? '*' + w : w)).join(' ');
  });
}

export function buildCaptions(script) {
  caps = [];
  if (script.captions === false) return caps;
  if (script.mode === 'beats' && script.captions !== true) return caps;

  script.lines.forEach((ln, i) => {
    const chunks = (ln.caps ? ln.caps.split('|') : autoChunks(ln.text)).map((s) => s.trim()).filter(Boolean);
    const ws = lineWords(i);
    if (!ws.length) return;
    const counts = chunks.map((c) => c.split(/\s+/).length);
    const N = counts.reduce((a, b) => a + b, 0);
    const nm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']+/g, '');
    let acc = 0, from = 0;
    chunks.forEach((c, j) => {
      const first = nm(c.split(/\s+/)[0]);
      let idx = j === 0 ? 0 : ws.findIndex((w, k) => k > from && first && (nm(w.w) === first || (first.length > 2 && nm(w.w).startsWith(first))));
      if (idx < 0) idx = Math.max(from + (j ? 1 : 0), Math.min(ws.length - 1, Math.round(acc * ws.length / N)));
      acc += counts[j]; from = idx;
      caps.push({ line: i, s: ws[idx].s - 0.05, words: c.split(/\s+/).map((w) => ({ txt: w.replace('*', ''), hi: w.startsWith('*') })) });
    });
  });
  caps.forEach((c, k) => {
    const next = caps[k + 1], lineEnd = T.lines[c.line].end;
    c.e = next ? (next.s - lineEnd > 0.7 && next.line !== c.line ? lineEnd + 0.35 : next.s) : T.dur;
  });
  return caps;
}
export const captionList = () => caps;

export function drawCaption(t, { highlightColor = null } = {}) {
  const c = caps.find((x) => t >= x.s && t < x.e);
  if (!c) return;
  const lt = t - c.s;
  const size = Math.round((PORTRAIT ? 112 : 76) * U);
  const maxW = W * (PORTRAIT ? 0.84 : 0.76);
  const capY = LOUT.capY();
  const hiCol = highlightColor || B.accentBright || '#FFD43B';

  ctx.font = `900 ${size}px Inter, sans-serif`;
  ctx.letterSpacing = '-2px';
  const sp = size * 0.25;
  c.words.forEach((w) => (w.w = ctx.measureText(w.txt).width));
  const width = (ws) => ws.reduce((a, w) => a + w.w, 0) + sp * (ws.length - 1);

  let lines = [c.words];
  if (width(c.words) > maxW && c.words.length > 1) {
    let best = null;
    for (let i = 1; i < c.words.length; i++) {
      const a = c.words.slice(0, i), b = c.words.slice(i), m = Math.max(width(a), width(b));
      if (!best || m < best.m) best = { m, l: [a, b] };
    }
    lines = best.l;
  }
  const fit = Math.min(1, maxW / Math.max(...lines.map(width)));
  const sc = (lt < 0.18 ? lerp(0.72, 1, eob(seg(lt, 0, 0.18))) : 1) * fit;

  ctx.save();
  ctx.translate(W / 2, capY);
  ctx.scale(sc, sc);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  const lh = size * 1.05, y0 = -(lines.length - 1) * lh / 2;
  lines.forEach((ln, li) => {
    let x = -width(ln) / 2;
    const y = y0 + li * lh;
    for (const w of ln) {
      ctx.lineWidth = Math.round(size * 0.22);
      ctx.strokeStyle = '#090A0F';
      ctx.strokeText(w.txt, x, y + size * 0.07);
      ctx.strokeText(w.txt, x, y);
      ctx.fillStyle = w.hi ? hiCol : '#FFFFFF';
      ctx.fillText(w.txt, x, y);
      x += w.w + sp;
    }
  });
  ctx.letterSpacing = '0px';
  ctx.restore();
}
