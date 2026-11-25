// Launch Video core library: responsive 16:9 / 9:16 coordinates, spring physics, color math, drawing primitives.
export let W = 1920, H = 1080, ASPECT = '16:9', PORTRAIT = false, CX = 960, CY = 540, U = 1;
export const FPS = 30;
export let ctx = null;
export function setCtx(c) { ctx = c; }

export function setAspect(aspect = '16:9') {
  ASPECT = aspect === '9:16' ? '9:16' : '16:9';
  PORTRAIT = ASPECT === '9:16';
  W = PORTRAIT ? 1080 : 1920;
  H = PORTRAIT ? 1920 : 1080;
  CX = W / 2;
  CY = H / 2;
  U = Math.min(W, H) / 1080;
}

// Responsive layout zones that adapt seamlessly between 16:9 widescreen and 9:16 vertical!
export const LOUT = {
  pad: () => 72 * U,
  safeBottom: () => (PORTRAIT ? H - 240 : H - 110),
  capY: () => (PORTRAIT ? H * 0.79 : H * 0.87),
  /** Returns { x, y, w, h } for named panes: 'full' | 'left' | 'right' | 'center' | 'hero' */
  pane(kind = 'full') {
    const p = 72 * U;
    if (kind === 'full') return { x: p, y: p, w: W - p * 2, h: H - p * 2 };
    if (kind === 'left') {
      return PORTRAIT
        ? { x: p, y: 120, w: W - p * 2, h: H * 0.36 }
        : { x: p, y: 110, w: W * 0.42, h: H - 220 };
    }
    if (kind === 'right') {
      return PORTRAIT
        ? { x: p, y: H * 0.48, w: W - p * 2, h: H * 0.41 }
        : { x: W * 0.48, y: 95, w: W * 0.48, h: H - 190 };
    }
    if (kind === 'hero') {
      return PORTRAIT
        ? { x: 64, y: H * 0.36, w: W - 128, h: H * 0.46 }
        : { x: 180, y: 240, w: W - 360, h: H - 340 };
    }
    return { x: p, y: p, w: W - p * 2, h: H - p * 2 };
  },
};

// ---------- math & physics ----------
export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => clamp((v - a) / ((b - a) || 1e-6));
export const seg = (t, a, b) => clamp((t - a) / ((b - a) || 1e-6));
export const eo = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const ei = (t) => Math.pow(clamp(t), 3);
export const eio = (t) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eob = (t) => { const x = clamp(t), c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Analytical damped spring 0 -> 1. Higher stiffness = snappier, lower damping = more bounce. */
export function spring(t, { stiffness = 240, damping = 22 } = {}) {
  if (t <= 0) return 0;
  if (t > 2.2) return 1;
  const w0 = Math.sqrt(stiffness);
  const zeta = damping / (2 * w0);
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const val = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
    return val;
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

// ---------- color utilities ----------
export function hexToRgb(hex) {
  const h = String(hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(hex, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(a)})`;
}
export function mixHex(hexA, hexB, t) {
  const [r1, g1, b1] = hexToRgb(hexA), [r2, g2, b2] = hexToRgb(hexB);
  const k = clamp(t);
  return '#' + [lerp(r1, r2, k), lerp(g1, g2, k), lerp(b1, b2, k)]
    .map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function lum(hex) {
  const f = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}

// ---------- drawing primitives ----------
export function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function ell(x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function line(pts, color, w) {
  if (!pts.length) return;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
export function fillAll(color) { ctx.fillStyle = color; ctx.fillRect(-400, -400, W + 800, H + 800); }

/** Draw image covering rect (with optional zoom & normalized focal point [fx, fy] in 0..1) */
export function imageCover(img, x, y, w, h, { zoom = 1, fx = 0.5, fy = 0.5, radius = 0 } = {}) {
  if (!img || !img.width || !img.height) return;
  ctx.save();
  if (radius > 0) { rr(x, y, w, h, radius); ctx.clip(); }
  else { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * s, dh = img.height * s;
  const dx = x + w / 2 - fx * dw + (fx - 0.5) * Math.max(0, w - dw) * 0;
  const cx = clamp(x + w * 0.5 - fx * dw, x + w - dw, x);
  const cy = clamp(y + h * 0.5 - fy * dh, y + h - dh, y);
  ctx.drawImage(img, dw > w ? cx : x + (w - dw) / 2, dh > h ? cy : y + (h - dh) / 2, dw, dh);
  ctx.restore();
  void dx;
}

/** Draw image anchored cleanly at top-left inside frame (ideal for full webpages with Ken Burns pan/zoom) */
export function imageViewport(img, x, y, w, h, { zoom = 1, panX = 0.5, panY = 0, radius = 0 } = {}) {
  if (!img || !img.width || !img.height) return;
  ctx.save();
  if (radius > 0) { rr(x, y, w, h, radius); ctx.clip(); }
  else { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
  const baseScale = w / img.width;
  const s = baseScale * zoom;
  const dw = img.width * s, dh = img.height * s;
  const maxOx = Math.max(0, dw - w);
  const maxOy = Math.max(0, dh - h);
  const ox = -maxOx * clamp(panX);
  const oy = -maxOy * clamp(panY);
  ctx.drawImage(img, x + ox, y + oy, dw, dh);
  ctx.restore();
}

export function wrapLines(text, maxW, font) {
  ctx.save();
  ctx.font = font;
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  ctx.restore();
  return lines;
}
