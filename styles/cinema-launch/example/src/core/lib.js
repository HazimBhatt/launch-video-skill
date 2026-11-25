// Cinema Launch core geometry, easing, Bezier motion, color, and aspect-safe media utilities
export let W = 1920, H = 1080, CX = 960, CY = 540, U = 1, PORTRAIT = false;
export let ASPECT = '16:9';
export let FPS = 60;

export function setAspect(aspect = '16:9') {
  const qs = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
  if (qs?.get('fps')) {
    const f = Number(qs.get('fps'));
    if (f >= 15 && f <= 120) FPS = f;
  }
  const p = String(aspect).includes('9:16') || aspect === 'portrait';
  PORTRAIT = p;
  ASPECT = p ? '9:16' : '16:9';
  W = p ? 1080 : 1920;
  H = p ? 1920 : 1080;
  CX = W / 2;
  CY = H / 2;
  U = p ? 0.86 : 1;
  return { W, H, CX, CY, U, PORTRAIT, ASPECT, FPS };
}

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : clamp((v - a) / (b - a)));
export const seg = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
export const eo = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const eo4 = (t) => 1 - Math.pow(1 - clamp(t), 4);
export const eo5 = (t) => 1 - Math.pow(1 - clamp(t), 5);
export const ei = (t) => Math.pow(clamp(t), 3);
export const eio = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export function spring(t, { stiffness = 240, damping = 22, mass = 1 } = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const z = damping / (2 * Math.sqrt(stiffness * mass));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    const e = Math.exp(-z * w0 * t);
    return 1 - e * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
  }
  const e = Math.exp(-w0 * t);
  return 1 - e * (1 + w0 * t);
}

// Quadratic & cubic Bezier motion helpers for organic human pointer arcs
export function bezier2(p0, p1, p2, t) {
  const u = clamp(t), m = 1 - u;
  return [
    m * m * p0[0] + 2 * m * u * p1[0] + u * u * p2[0],
    m * m * p0[1] + 2 * m * u * p1[1] + u * u * p2[1],
  ];
}

export function bezier3(p0, p1, p2, p3, t) {
  const u = clamp(t), m = 1 - u;
  return [
    m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0],
    m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1],
  ];
}

// Deterministic pseudo-random (zero flicker across headless renders)
export function rnd(seed) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return s - Math.floor(s);
}

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function hexRgb(hex) {
  const s = String(hex || '#111110').replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s.padEnd(6, '0');
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

export function rgba(hex, a = 1) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${clamp(a)})`;
}

export function mixHex(a, b, t) {
  const u = clamp(t);
  const A = hexRgb(a), B = hexRgb(b);
  const h = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  return '#' + h(lerp(A[0], B[0], u)) + h(lerp(A[1], B[1], u)) + h(lerp(A[2], B[2], u));
}

export function fontSpec(weight, size, family = 'Inter, DM Sans, sans-serif') {
  return `${weight} ${Math.round(size)}px ${family}`;
}

export function wrapLines(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const out = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}

// Aspect-ratio-preserving image containment (fixes squashed non-square logos/images)
export function drawContain(ctx, img, x, y, w, h, { alignX = 0.5, alignY = 0.5 } = {}) {
  if (!img) return null;
  const iw = img.naturalWidth || img.videoWidth || img.width || 0;
  const ih = img.naturalHeight || img.videoHeight || img.height || 0;
  if (!iw || !ih) return null;
  const s = Math.min(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  const dx = x + (w - dw) * alignX;
  const dy = y + (h - dh) * alignY;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

// Aspect-ratio-preserving cover crop with normalized focal point + optical zoom
export function drawCover(ctx, img, x, y, w, h, { panX = 0.5, panY = 0.5, zoom = 1 } = {}) {
  if (!img) return;
  const iw = img.naturalWidth || img.videoWidth || img.width || 0;
  const ih = img.naturalHeight || img.videoHeight || img.height || 0;
  if (!iw || !ih) return;
  const baseScale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * baseScale, dh = ih * baseScale;
  const dx = x + (w - dw) * clamp(panX, 0, 1);
  const dy = y + (h - dh) * clamp(panY, 0, 1);
  ctx.drawImage(img, dx, dy, dw, dh);
}
