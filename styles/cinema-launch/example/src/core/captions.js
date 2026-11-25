// Minimal editorial subtitle bar (opt-in only; zero cartoon strokes or neon yellow fills)
import { W, H, CX, U, PORTRAIT, clamp, eo, seg, rr, fontSpec } from './lib.js';
import { B } from './brand.js';

export function buildCaptions(words, script) {
  if (!script?.captions || !Array.isArray(words) || !words.length) return [];
  const out = [];
  const maxWords = PORTRAIT ? 5 : 8;
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const ends = /[.!?]$/.test(w.word || w.w || '');
    if (cur.length >= maxWords || ends) {
      out.push({
        s: cur[0].start ?? cur[0].s ?? 0,
        e: cur[cur.length - 1].end ?? cur[cur.length - 1].e ?? 0,
        text: cur.map((x) => x.word || x.w).join(' '),
      });
      cur = [];
    }
  }
  if (cur.length) {
    out.push({
      s: cur[0].start ?? cur[0].s ?? 0,
      e: cur[cur.length - 1].end ?? cur[cur.length - 1].e ?? 0,
      text: cur.map((x) => x.word || x.w).join(' '),
    });
  }
  return out;
}

export function drawCaption(ctx, caps, t) {
  if (!caps?.length) return;
  const active = caps.find((c) => t >= c.s && t <= c.e + 0.08);
  if (!active) return;

  const alpha = eo(seg(t, active.s, active.s + 0.12)) * (1 - seg(t, active.e, active.e + 0.08));
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.font = fontSpec(600, 28 * U, B.bodyFont);
  const tw = ctx.measureText(active.text).width;
  const padX = 28 * U, padY = 14 * U;
  const bw = Math.min(W * 0.84, tw + padX * 2);
  const bh = 28 * U + padY * 2;
  const bx = CX - bw / 2;
  const by = H - (PORTRAIT ? 180 : 96) * U;

  ctx.shadowColor = 'rgba(14,14,13,0.22)';
  ctx.shadowBlur = 24 * U;
  ctx.shadowOffsetY = 8 * U;
  rr(ctx, bx, by, bw, bh, bh / 2);
  ctx.fillStyle = 'rgba(17,17,16,0.78)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.2 * U;
  ctx.stroke();

  ctx.fillStyle = '#FAF9F7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(active.text, CX, by + bh / 2 + 1 * U);
  ctx.restore();
}
