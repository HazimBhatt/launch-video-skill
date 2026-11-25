#!/usr/bin/env node
// Zero-Dependency Studio Audio & Soundtrack DSP Engine (Node 22+ Float64Array, 48 kHz True Stereo, -14 LUFS)
// Immune to Windows Smart App Control Python/SciPy DLL blocks. Runs 33s stereo master in ~1s.
//   node tools/mix.mjs [project-dir]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SR = 48000;
const TWO_PI = Math.PI * 2;

// Deterministic fast PRNG (Mulberry32)
function makeRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(n, seed = 1) {
  const rng = makeRng(seed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    // Fast Box-Muller-like approximation (sum of 3 uniforms -> clean white Gaussian-ish noise)
    out[i] = (rng() + rng() + rng() - 1.5) * 1.15;
  }
  return out;
}

// RBJ Biquad Filters (crisp, zero-ripple, full audio bandwidth)
function biquadCoeffs(type, fc, Q = 0.7071, gainDb = 0) {
  const f = Math.max(20, Math.min(SR * 0.47, fc));
  const w0 = (TWO_PI * f) / SR;
  const cw = Math.cos(w0), sw = Math.sin(w0);
  const alpha = sw / (2 * Q);
  let b0, b1, b2, a0, a1, a2;

  if (type === 'lp') {
    b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2;
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
  } else if (type === 'hp') {
    b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2;
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
  } else if (type === 'bp') {
    b0 = alpha; b1 = 0; b2 = -alpha;
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
  } else if (type === 'hs') {
    const A = Math.pow(10, gainDb / 40);
    const sq = 2 * Math.sqrt(A) * alpha;
    b0 = A * ((A + 1) + (A - 1) * cw + sq);
    b1 = -2 * A * ((A - 1) + (A + 1) * cw);
    b2 = A * ((A + 1) + (A - 1) * cw - sq);
    a0 = (A + 1) - (A - 1) * cw + sq;
    a1 = 2 * ((A - 1) - (A + 1) * cw);
    a2 = (A + 1) - (A - 1) * cw - sq;
  } else {
    return [1, 0, 0, 0, 0];
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}

function applyBiquadMono(x, type, fc, Q = 0.7071, gainDb = 0) {
  const [b0, b1, b2, a1, a2] = biquadCoeffs(type, fc, Q, gainDb);
  const n = x.length;
  const y = new Float64Array(n);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const x0 = x[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    y[i] = y0;
  }
  return y;
}

const lpM = (x, hz, Q = 0.7071) => applyBiquadMono(x, 'lp', hz, Q);
const hpM = (x, hz, Q = 0.7071) => applyBiquadMono(x, 'hp', hz, Q);
const bpM = (x, lo, hi) => {
  const fc = Math.sqrt(lo * hi);
  const bw = Math.max(40, hi - lo);
  const Q = Math.max(0.45, Math.min(8.0, fc / bw));
  return applyBiquadMono(x, 'bp', fc, Q);
};

function makeStereo(n) { return [new Float64Array(n), new Float64Array(n)]; }
function lpS(st, hz) { return [lpM(st[0], hz), lpM(st[1], hz)]; }
function hpS(st, hz) { return [hpM(st[0], hz), hpM(st[1], hz)]; }

function panMono(m, pan = 0) {
  const p = Math.max(-1, Math.min(1, pan));
  const ang = (p + 1) * (Math.PI / 4);
  const gl = Math.cos(ang), gr = Math.sin(ang);
  const n = m.length;
  const L = new Float64Array(n), R = new Float64Array(n);
  for (let i = 0; i < n; i++) { L[i] = m[i] * gl; R[i] = m[i] * gr; }
  return [L, R];
}

function addStereo(dst, src, atS, gain = 1.0) {
  let i0 = Math.round(atS * SR);
  let srcOff = 0;
  if (i0 < 0) { srcOff = -i0; i0 = 0; }
  const len = Math.min(dst[0].length - i0, src[0].length - srcOff);
  if (len <= 0) return;
  const dL = dst[0], dR = dst[1], sL = src[0], sR = src[1];
  for (let i = 0; i < len; i++) {
    dL[i0 + i] += sL[srcOff + i] * gain;
    dR[i0 + i] += sR[srcOff + i] * gain;
  }
}

function envVal(i, n, aS = 0.005, rS = 0.06) {
  const na = Math.max(1, Math.round(aS * SR));
  const nr = Math.max(1, Math.round(rS * SR));
  let v = 1;
  if (i < na) v *= i / na;
  if (i >= n - nr) v *= Math.max(0, (n - 1 - i) / nr);
  return v;
}

function stereoReverb(st, decay = 0.42, wet = 0.26) {
  const n = st[0].length;
  const srcL = lpM(st[0], 5600);
  const srcR = lpM(st[1], 5600);
  const wL = new Float64Array(n), wR = new Float64Array(n);
  const tapsL = [[1487, 1.0], [1753, 0.85], [2089, 0.72], [2381, 0.62], [3461, 0.44], [4937, 0.30]];
  const tapsR = [[1523, 1.0], [1789, 0.85], [2113, 0.72], [2417, 0.62], [3517, 0.44], [5003, 0.30]];

  for (const [d, g] of tapsL) {
    for (let k = 1; k <= 4; k++) {
      const off = d * k;
      if (off >= n) break;
      const gk = g * Math.pow(decay, k) * 0.28;
      for (let i = off; i < n; i++) wL[i] += srcL[i - off] * gk;
    }
  }
  for (const [d, g] of tapsR) {
    for (let k = 1; k <= 4; k++) {
      const off = d * k;
      if (off >= n) break;
      const gk = g * Math.pow(decay, k) * 0.28;
      for (let i = off; i < n; i++) wR[i] += srcR[i - off] * gk;
    }
  }
  const outL = new Float64Array(n), outR = new Float64Array(n);
  const dry = 1 - wet * 0.32;
  for (let i = 0; i < n; i++) {
    outL[i] = st[0][i] * dry + (wL[i] * 0.78 + wR[i] * 0.22) * wet;
    outR[i] = st[1][i] * dry + (wR[i] * 0.78 + wL[i] * 0.22) * wet;
  }
  return [outL, outR];
}

function pingPongDelay(st, delayS, feedback = 0.38, wet = 0.34) {
  const n = st[0].length;
  const d = Math.max(1, Math.round(delayS * SR));
  const mono = new Float64Array(n);
  for (let i = 0; i < n; i++) mono[i] = (st[0][i] + st[1][i]) * 0.5;
  const filt = lpM(hpM(mono, 320), 6400);
  const outL = new Float64Array(st[0]), outR = new Float64Array(st[1]);
  for (let k = 1; k <= 5; k++) {
    const off = d * k;
    if (off >= n) break;
    const g = Math.pow(feedback, k) * wet;
    const dst = k % 2 === 1 ? outL : outR;
    for (let i = off; i < n; i++) dst[i] += filt[i - off] * g;
  }
  return [outL, outR];
}

function buildSidechain(kickTimes, n, depth = 0.66, releaseS = 0.155) {
  const sc = new Float64Array(n);
  sc.fill(1.0);
  const attN = Math.max(1, Math.round(0.006 * SR));
  const relN = Math.round(releaseS * SR);
  const shape = new Float64Array(attN + relN);
  for (let i = 0; i < attN; i++) shape[i] = 1 - (depth * i) / attN;
  for (let i = 0; i < relN; i++) shape[attN + i] = (1 - depth) + depth * (1 - Math.exp((-4.8 * i) / relN));
  for (const kt of kickTimes) {
    const i0 = Math.round(kt * SR);
    if (i0 < 0 || i0 >= n) continue;
    const m = Math.min(shape.length, n - i0);
    for (let i = 0; i < m; i++) {
      if (shape[i] < sc[i0 + i]) sc[i0 + i] = shape[i];
    }
  }
  return sc;
}

// ---------- Studio Tactile Foley SFX (full 16.8 kHz air, true stereo) ----------

function fx_decode_tick(dur = 0.85, pan = 0) {
  const rng = makeRng(101);
  const n = Math.max(Math.round(dur * SR), Math.round(0.15 * SR));
  const out = makeStereo(n);
  let t = 0, idx = 0;
  while (t < dur - 0.03) {
    const m = Math.round(0.022 * SR);
    const sig = new Float64Array(m);
    const freq = 2400 + (idx % 7) * 410 + (rng() - 0.5) * 240;
    for (let i = 0; i < m; i++) {
      const tt = i / SR;
      sig[i] = (Math.sin(TWO_PI * freq * tt) * 0.55 + Math.sin(TWO_PI * freq * 1.5 * tt) * 0.25) * Math.exp(-tt * 220);
    }
    addStereo(out, panMono(sig, ((idx % 5) - 2) * 0.22 + pan * 0.4), t, 0.42);
    t += 0.034 + 0.004 + rng() * 0.014;
    idx++;
  }
  return out;
}

function fx_mac_click(_dur = 0.08, pan = 0) {
  const n = Math.round(0.075 * SR);
  const nz = bpM(makeNoise(n, 7), 2400, 7400);
  const sig = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const body = Math.sin(TWO_PI * (195 * Math.exp(-t * 28)) * t) * Math.exp(-t * 95) * 0.85;
    const ping = Math.sin(TWO_PI * 4100 * t) * Math.exp(-t * 290) * 0.45;
    sig[i] = (body + nz[i] * Math.exp(-t * 340) * 1.45 + ping) * 0.92;
  }
  return panMono(sig, pan);
}

function fx_glass_whoosh(dur = 0.48) {
  const d = Math.max(0.24, dur);
  const n = Math.round(d * SR);
  const nL = bpM(makeNoise(n, 42), 420, 5800);
  const nR = bpM(makeNoise(n, 43), 520, 6400);
  const L = new Float64Array(n), R = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, u = t / d;
    const bell = Math.pow(Math.sin(Math.PI * u), 1.65);
    const sub = Math.sin(TWO_PI * (62 + 48 * u) * t) * bell * 0.36;
    const pL = Math.cos((u * 0.8 + 0.1) * (Math.PI / 2));
    const pR = Math.sin((u * 0.8 + 0.1) * (Math.PI / 2));
    L[i] = nL[i] * bell * 0.5 * pL + sub;
    R[i] = nR[i] * bell * 0.5 * pR + sub;
  }
  return [L, R];
}

function fx_portal_morph(dur = 0.45, pan = 0) {
  const d = Math.max(0.25, dur);
  const n = Math.round(d * SR);
  const air = bpM(makeNoise(n, 19), 1100, 7200);
  const sig = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const f0 = 190 * Math.pow(3.6, u);
    ph += (TWO_PI * f0) / SR;
    const bell = Math.pow(Math.sin(Math.PI * u), 1.3);
    const warm = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph)) * bell * 0.55;
    sig[i] = warm + air[i] * Math.pow(Math.sin(Math.PI * u), 2) * 0.25;
  }
  return stereoReverb(panMono(sig, pan), 0.36, 0.3);
}

function fx_stamp_thud(_dur = 0.22, pan = 0) {
  const n = Math.round(0.22 * SR);
  const slap = bpM(makeNoise(n, 88), 750, 3400);
  const paper = bpM(makeNoise(n, 89), 3200, 9800);
  const sig = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const thump = Math.sin(TWO_PI * (128 * Math.exp(-t * 22) + 46) * t) * Math.exp(-t * 24) * 1.15;
    sig[i] = (thump + slap[i] * Math.exp(-t * 85) * 0.72 + paper[i] * Math.exp(-t * 140) * 0.34) * 0.95;
  }
  return panMono(sig, pan);
}

function fx_strikethrough_snip(_dur = 0.15, pan = 0) {
  const n = Math.round(0.15 * SR);
  const nz = bpM(makeNoise(n, 64), 1800, 9200);
  const sig = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, u = i / n;
    sig[i] = nz[i] * Math.pow(Math.sin(Math.PI * u), 1.4) * 0.62 + Math.sin(TWO_PI * (1600 - 700 * u) * t) * Math.exp(-t * 26) * 0.24;
  }
  return panMono(sig, pan);
}

function fx_mosaic_sweep(dur = 0.48) {
  const d = Math.max(0.35, dur);
  const n = Math.round((d + 0.14) * SR);
  const out = makeStereo(n);
  const rng = makeRng(512);
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  for (let k = 0; k < 28; k++) {
    const u = k / 27;
    const at = u * (d * 0.84) + rng() * 0.015;
    const m = Math.round(0.045 * SR);
    const f = notes[k % notes.length] * (k > 16 ? 2 : 1);
    const sig = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      const tt = i / SR;
      sig[i] = (Math.sin(TWO_PI * f * tt) + 0.3 * Math.sin(TWO_PI * f * 2 * tt)) * Math.exp(-tt * 95);
    }
    addStereo(out, panMono(sig, -0.75 + u * 1.5), at, 0.22);
  }
  addStereo(out, fx_glass_whoosh(d), 0, 0.52);
  return stereoReverb(out, 0.36, 0.28);
}

function fx_score_lift(dur = 0.52, pan = 0) {
  const n = Math.round(Math.max(0.45, dur) * SR);
  const out = makeStereo(n);
  const seq = [[0.0, 523.25], [0.065, 659.25], [0.13, 783.99], [0.195, 987.77]];
  seq.forEach(([at, f], idx) => {
    const m = Math.round(0.28 * SR);
    const sig = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      const tt = i / SR;
      sig[i] = (Math.sin(TWO_PI * f * tt) + 0.28 * Math.sin(TWO_PI * f * 2 * tt) * Math.exp(-tt * 22)) * Math.exp(-tt * 10.5);
    }
    addStereo(out, panMono(sig, -0.25 + idx * 0.16 + pan * 0.3), at, 0.32);
  });
  return stereoReverb(out, 0.4, 0.32);
}

function fx_pop(_dur = 0.09, pan = 0) {
  const n = Math.round(0.09 * SR);
  const air = bpM(makeNoise(n, 11), 3200, 9200);
  const sig = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (TWO_PI * (420 + 520 * Math.exp(-t * 55))) / SR;
    sig[i] = Math.sin(ph) * Math.exp(-t * 48) * 0.65 + air[i] * Math.exp(-t * 160) * 0.25;
  }
  return panMono(sig, pan);
}

function fx_snap(_dur = 0.08, pan = 0) {
  const n = Math.round(0.08 * SR);
  const nz = bpM(makeNoise(n, 23), 1800, 7800);
  const sig = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    sig[i] = nz[i] * Math.exp(-t * 130) * 0.72 + Math.sin(TWO_PI * 1650 * t) * Math.exp(-t * 110) * 0.32;
  }
  return panMono(sig, pan);
}

function fx_type(dur = 0.7, pan = 0) {
  const rng = makeRng(31);
  const n = Math.max(Math.round(dur * SR), Math.round(0.2 * SR));
  const out = makeStereo(n);
  let t = 0, idx = 0;
  while (t < dur - 0.04) {
    const m = Math.round(0.028 * SR);
    const cap = bpM(makeNoise(m, 31 + idx), 2200, 8400);
    const sig = new Float64Array(m);
    const f = 280 + (idx % 4) * 35;
    for (let i = 0; i < m; i++) {
      const tt = i / SR;
      sig[i] = Math.sin(TWO_PI * f * tt) * Math.exp(-tt * 150) * 0.55 + cap[i] * Math.exp(-tt * 280) * 0.58;
    }
    addStereo(out, panMono(sig, ((idx % 5) - 2) * 0.09 + pan * 0.4), t, 0.65);
    t += 0.056 + (rng() - 0.3) * 0.026;
    idx++;
  }
  return out;
}

function fx_riser(dur = 0.85) {
  const d = Math.max(0.3, dur);
  const n = Math.round(d * SR);
  const rL = makeNoise(n, 77), rR = makeNoise(n, 78);
  const lo = bpM(rL, 260, 1400);
  const hiL = bpM(rL, 1400, 9800), hiR = bpM(rR, 1500, 10400);
  const L = new Float64Array(n), R = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    ph += (TWO_PI * (220 * Math.pow(2.5, u))) / SR;
    const tone = Math.sin(ph) * Math.pow(u, 2.2) * 0.22;
    const sw = Math.pow(u, 1.65) * envVal(i, n, 0.05, 0.025) * 0.55;
    const uHi = Math.pow(u, 1.8);
    L[i] = (lo[i] * (1 - u * 0.5) + hiL[i] * uHi + tone) * sw;
    R[i] = (lo[i] * (1 - u * 0.5) + hiR[i] * uHi + tone) * sw;
  }
  return [L, R];
}

function fx_drop(_dur = 0.55, pan = 0) {
  const n = Math.round(0.55 * SR);
  const punch = bpM(makeNoise(n, 91), 1800, 8200);
  const sig = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (TWO_PI * (135 * Math.exp(-t * 16) + 42)) / SR;
    sig[i] = Math.sin(ph) * Math.exp(-t * 4.5) * 0.95 + punch[i] * Math.exp(-t * 90) * 0.42;
  }
  return panMono(sig, pan);
}

function fx_shutter(_dur = 0.12, pan = 0) {
  const n = Math.round(0.12 * SR);
  const nz = bpM(makeNoise(n, 14), 2800, 11200);
  const sig = new Float64Array(n);
  const off = Math.round(0.032 * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const c1 = nz[i] * Math.exp(-t * 210) * 0.7;
    const c2 = i >= off ? nz[i - off] * Math.exp(-((i - off) / SR) * 210) * 0.42 : 0;
    sig[i] = c1 + c2;
  }
  return panMono(sig, pan);
}

function fx_chime(dur = 1.4) {
  const d = Math.max(0.8, dur);
  const n = Math.round(d * SR);
  const out = makeStereo(n);
  const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66];
  freqs.forEach((f, idx) => {
    const sig = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      sig[i] = (Math.sin(TWO_PI * f * t) + 0.18 * Math.sin(TWO_PI * f * 2 * t) * Math.exp(-t * 8))
        * Math.exp(-t * (2.2 + idx * 0.35)) * envVal(i, n, 0.012, 0.15);
    }
    addStereo(out, panMono(sig, -0.45 + idx * 0.22), 0, 0.2);
  });
  return stereoReverb(out, 0.52, 0.45);
}

const FX = {
  decode_tick: fx_decode_tick,
  mac_click: fx_mac_click,
  click: fx_mac_click,
  glass_whoosh: fx_glass_whoosh,
  whoosh: fx_glass_whoosh,
  swoosh: fx_glass_whoosh,
  portal_morph: fx_portal_morph,
  morph: fx_portal_morph,
  stamp_thud: fx_stamp_thud,
  strikethrough_snip: fx_strikethrough_snip,
  mosaic_sweep: fx_mosaic_sweep,
  score_lift: fx_score_lift,
  prompt_copy: fx_score_lift,
  confirm: fx_score_lift,
  pop: fx_pop,
  snap: fx_snap,
  tock: fx_snap,
  type: fx_type,
  keystroke: fx_mac_click,
  riser: fx_riser,
  drop: fx_drop,
  basshit: fx_drop,
  shutter: fx_shutter,
  chime: fx_chime,
};

// ---------- Wide-Stereo ODESZA/Soar Electronic Anthem Synthesizer ----------

function supersawChord(freqs, n) {
  const detune = [-13, -5, 0, 5, 13];
  const L = new Float64Array(n), R = new Float64Array(n);
  const scale = 1 / (freqs.length * detune.length * 0.55);
  for (let fi = 0; fi < freqs.length; fi++) {
    const f = freqs[fi];
    for (let di = 0; di < detune.length; di++) {
      const ff = f * Math.pow(2, detune[di] / 1200);
      const ph0 = fi * 1.73 + di * 0.91;
      const pan = (di - 2) * 0.42;
      const ang = (pan + 1) * (Math.PI / 4);
      const gl = Math.cos(ang) * scale, gr = Math.sin(ang) * scale;
      const w = (TWO_PI * ff) / SR;
      for (let i = 0; i < n; i++) {
        const p = w * i + ph0;
        const v = Math.sin(p) + 0.48 * Math.sin(2 * p) + 0.28 * Math.sin(3 * p) + 0.16 * Math.sin(4 * p) + 0.09 * Math.sin(5 * p);
        L[i] += v * gl;
        R[i] += v * gr;
      }
    }
  }
  return [L, R];
}

function formantVocalNote(f0, durS, glideFrom = null) {
  const n = Math.max(64, Math.round(durS * SR));
  const raw = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const fi = glideFrom ? (glideFrom + (f0 - glideFrom) * (1 - Math.exp(-t / 0.028))) : f0;
    ph += (TWO_PI * fi) / SR;
    let v = 0;
    for (let k = 1; k <= 8; k++) v += Math.sin(k * ph) / Math.pow(k, 0.85);
    raw[i] = v;
  }
  const f1 = bpM(raw, 560, 840);
  const f2 = bpM(raw, 1080, 1520);
  const f3 = bpM(raw, 2450, 3150);
  const br = bpM(makeNoise(n, Math.round(f0)), 2800, 8600);
  const out = new Float64Array(n);
  const rel = Math.max(0.06, durS * 0.38);
  for (let i = 0; i < n; i++) {
    out[i] = (f1[i] * 1.0 + f2[i] * 0.72 + f3[i] * 0.36 + br[i] * 0.09) * envVal(i, n, 0.018, rel) * 0.65;
  }
  return out;
}

function musicAnthem(dur, bpm = 122) {
  const n = Math.ceil(dur * SR);
  const spb = 60 / bpm;
  const totalBeats = Math.ceil(dur / spb) + 2;

  const pads = makeStereo(n);
  const bass = makeStereo(n);
  const lead = makeStereo(n);
  const drums = makeStereo(n);
  const kickTimes = [];

  // Sunlit euphoric C Major / A Minor progression: Fmaj9 -> G6 -> Am9 -> Em7
  const chords = [
    [[174.61, 220.0, 261.63, 329.63, 392.0], 87.31],
    [[196.0, 246.94, 293.66, 329.63, 392.0], 98.0],
    [[220.0, 261.63, 329.63, 392.0, 493.88], 110.0],
    [[164.81, 246.94, 293.66, 392.0, 493.88], 82.41],
  ];

  const dropBeat = 11;
  const sprintBeat = 46;
  const climaxBeat = 50;
  const outroBeat = totalBeats > 56 ? 58 : Math.max(totalBeats - 8, 24);

  // 1. Stereo Supersaw Chords + Warm Sub Bass
  for (let bar = 0; bar < totalBeats; bar += 4) {
    const at = bar * spb;
    if (at >= dur) break;
    const isOutro = bar >= outroBeat;
    let [cFreqs, bFreq] = chords[(bar / 4) % 4];
    let barLen = Math.min(4 * spb, dur - at);
    if (isOutro) {
      cFreqs = [130.81, 196.0, 246.94, 293.66, 329.63, 392.0]; // Cmaj9 resolution
      bFreq = 65.41;
      barLen = Math.min(8 * spb, dur - at);
    }
    const m = Math.round(barLen * SR);
    if (m < 64) continue;

    let ch = supersawChord(cFreqs, m);
    const cutoff = bar < 4 ? 1350 : (bar < dropBeat ? 2450 : (isOutro ? 2000 : 5600));
    const gain = bar < 4 ? 0.42 : (bar < dropBeat ? 0.58 : (isOutro ? 0.54 : 0.74));
    ch = lpS(ch, cutoff);
    const rTail = isOutro ? barLen * 0.85 : 0.08;
    for (let i = 0; i < m; i++) {
      const e = envVal(i, m, 0.035, rTail) * gain;
      ch[0][i] *= e; ch[1][i] *= e;
    }
    addStereo(pads, ch, at, 1.0);

    if (bar >= 4 && !isOutro) {
      const b = new Float64Array(m);
      const wb = (TWO_PI * bFreq) / SR;
      for (let i = 0; i < m; i++) {
        b[i] = (Math.sin(wb * i) * 0.85 + Math.sin(2 * wb * i) * 0.25) * envVal(i, m, 0.02, 0.06);
      }
      addStereo(bass, panMono(b, 0), at, bar >= dropBeat ? 0.42 : 0.24);
    }
    if (isOutro) break;
  }

  // 2. Dramatic 130ms breath pocket immediately before Main Drop
  const p0 = Math.max(0, Math.round((dropBeat * spb - 0.13) * SR));
  const p1 = Math.min(n, Math.round(dropBeat * spb * SR));
  for (let i = p0; i < p1; i++) {
    const f = 1 - ((i - p0) / Math.max(1, p1 - p0)) * 0.92;
    pads[0][i] *= f; pads[1][i] *= f;
    bass[0][i] *= f; bass[1][i] *= f;
  }

  // 3. Modern Crisp Drums (Kick, Layered Stereo Clap/Snare, 16th Air Hats)
  for (let b = 0; b < totalBeats; b++) {
    const tb = b * spb;
    if (tb >= dur || b >= outroBeat) continue;

    // Build section: snaps on 2 & 4 + soft muffled pulse kick
    if (b >= 4 && b < dropBeat - 1) {
      if (b % 2 === 1) addStereo(drums, fx_snap(0.08, b % 4 === 1 ? 0.14 : -0.14), tb, 0.44);
      const mk = Math.round(0.18 * SR);
      const k = new Float64Array(mk);
      let ph = 0;
      for (let i = 0; i < mk; i++) {
        const tt = i / SR;
        ph += (TWO_PI * (92 * Math.exp(-tt * 28) + 48)) / SR;
        k[i] = Math.sin(ph) * Math.exp(-tt * 16);
      }
      addStereo(drums, panMono(k, 0), tb, 0.34);
      continue;
    }
    if (b < dropBeat) continue;

    const kOffs = b >= sprintBeat ? [0] : (b % 4 === 2 ? [0, 0.75 * spb] : [0]);
    for (const koff of kOffs) {
      const kt = tb + koff;
      if (kt >= dur) continue;
      kickTimes.push(kt);
      const mk = Math.round(0.24 * SR);
      const beater = bpM(makeNoise(mk, 400 + b), 2200, 5600);
      const k = new Float64Array(mk);
      let ph = 0;
      for (let i = 0; i < mk; i++) {
        const tt = i / SR;
        ph += (TWO_PI * (158 * Math.exp(-tt * 34) + 47)) / SR;
        k[i] = Math.sin(ph) * Math.exp(-tt * 11.5) + beater[i] * Math.exp(-tt * 240) * 0.28;
      }
      addStereo(drums, panMono(k, 0), kt, koff === 0 ? 0.72 : 0.44);
    }

    // Layered 3-burst wide stereo clap/snare
    if ((b - dropBeat) % 2 === 1) {
      const layers = [[0.0, -0.35, 0.34], [0.009, 0.0, 0.44], [0.017, 0.35, 0.34]];
      layers.forEach(([dm, panC, gC], li) => {
        const mc = Math.round(0.16 * SR);
        const cl = bpM(makeNoise(mc, 800 + b * 5 + li), 1200, 11800);
        for (let i = 0; i < mc; i++) cl[i] *= Math.exp(-(i / SR) * 26);
        addStereo(drums, panMono(cl, panC), tb + dm, gC);
      });
      const ms = Math.round(0.11 * SR);
      const sn = new Float64Array(ms);
      for (let i = 0; i < ms; i++) sn[i] = Math.sin(TWO_PI * 210 * (i / SR)) * Math.exp(-(i / SR) * 32) * 0.28;
      addStereo(drums, panMono(sn, 0), tb, 0.65);
    }

    // Swinging 16th-note high-bandwidth air hats (6.8 kHz - 15.6 kHz)
    for (let sub = 0; sub < 4; sub++) {
      const ht = tb + (sub * 0.25 + (sub % 2 === 1 ? 0.015 : 0)) * spb;
      if (ht >= dur) continue;
      const mh = Math.round(0.055 * SR);
      const hat = bpM(makeNoise(mh, 1500 + b * 4 + sub), 6800, 15600);
      const dec = sub === 2 ? 75 : 155;
      for (let i = 0; i < mh; i++) hat[i] *= Math.exp(-(i / SR) * dec);
      const gH = sub === 2 ? 0.24 : (sub === 0 ? 0.14 : 0.09);
      addStereo(drums, panMono(hat, sub % 2 === 0 ? -0.28 : 0.28), ht, gH);
    }
  }

  // 4. Vocal-Formant Hook Motif + Climax Kalimba Arp
  const motif = [
    [0.0, 659.25, 0.42, 587.33],
    [0.75, 783.99, 0.38, 659.25],
    [1.5, 880.0, 0.52, 783.99],
    [2.5, 783.99, 0.36, 880.0],
    [3.25, 659.25, 0.45, null],
    [4.0, 587.33, 0.48, 659.25],
    [5.5, 523.25, 0.55, 587.33],
    [6.75, 587.33, 0.42, 523.25],
  ];
  for (let pStart = dropBeat + 4; pStart < outroBeat - 2; pStart += 8) {
    if (pStart >= sprintBeat && pStart < climaxBeat) continue;
    for (const [offB, freq, lenB, glide] of motif) {
      const at = (pStart + offB) * spb;
      if (at >= outroBeat * spb || at >= dur) break;
      const v = formantVocalNote(freq, lenB * spb, glide);
      addStereo(lead, panMono(v, Math.floor(offB) % 2 === 0 ? 0.14 : -0.14), at, 0.34);
    }
  }

  // Climax sparkling kalimba arp
  const arp = [1046.5, 1318.51, 1567.98, 1975.53, 1567.98, 1318.51];
  for (let s = 0; s < Math.max(0, (outroBeat - climaxBeat) * 2); s++) {
    const at = (climaxBeat + s * 0.5) * spb;
    if (at >= dur) break;
    const f = arp[s % arp.length];
    const m = Math.round(0.32 * SR);
    const pl = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      const tt = i / SR;
      pl[i] = (Math.sin(TWO_PI * f * tt) + 0.22 * Math.sin(TWO_PI * f * 2 * tt) * Math.exp(-tt * 24)) * Math.exp(-tt * 11);
    }
    addStereo(lead, panMono(pl, Math.sin(s * 0.9) * 0.58), at, 0.2);
  }

  // 5. Sidechain Pump + Stereo Reverb + Dotted-8th Ping-Pong Delay
  const sc = buildSidechain(kickTimes, n, 0.66, Math.min(0.16, spb * 0.34));
  const padsP = makeStereo(n);
  const bassP = makeStereo(n);
  for (let i = 0; i < n; i++) {
    const s = sc[i];
    padsP[0][i] = pads[0][i] * s;
    padsP[1][i] = pads[1][i] * s;
    const bs = 0.38 + 0.62 * s;
    bassP[0][i] = bass[0][i] * bs;
    bassP[1][i] = bass[1][i] * bs;
  }
  const padsRev = stereoReverb(padsP, 0.44, 0.28);
  const leadFx = stereoReverb(pingPongDelay(lead, spb * 0.75, 0.36, 0.34), 0.46, 0.34);

  const mix = makeStereo(n);
  const tailN = Math.min(n, Math.round(0.35 * SR));
  for (let i = 0; i < n; i++) {
    const fade = i >= n - tailN ? (n - 1 - i) / tailN : 1;
    mix[0][i] = (padsRev[0][i] * 0.58 + bassP[0][i] * 0.72 + leadFx[0][i] * 0.68 + drums[0][i] * 0.88) * fade;
    mix[1][i] = (padsRev[1][i] * 0.58 + bassP[1][i] * 0.72 + leadFx[1][i] * 0.68 + drums[1][i] * 0.88) * fade;
  }
  return lpS(hpS(mix, 28), 16800);
}

// ---------- True Stereo External Track Loader (NEVER collapses to mono!) ----------
function loadAudioStereo(filePath) {
  const ff = process.env.FFMPEG || 'ffmpeg';
  const r = spawnSync(ff, ['-v', 'error', '-i', filePath, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], {
    maxBuffer: 1024 * 1024 * 128,
  });
  if (r.status !== 0) throw new Error(`ffmpeg decode failed for ${filePath}: ${r.stderr?.toString()}`);
  const buf = r.stdout;
  const f32 = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  const n = Math.floor(f32.length / 2);
  const L = new Float64Array(n), R = new Float64Array(n);
  for (let i = 0; i < n; i++) { L[i] = f32[i * 2]; R[i] = f32[i * 2 + 1]; }
  return [L, R];
}

// ---------- K-Weighted Integrated Loudness + -14 LUFS / -1.0 dBTP Master Bus ----------
function measureLufsApprox(st) {
  const kL = hpM(st[0], 65), kR = hpM(st[1], 65);
  let sum = 0;
  for (let i = 0; i < kL.length; i++) sum += kL[i] * kL[i] + kR[i] * kR[i];
  const ms = sum / Math.max(1, kL.length);
  return ms <= 1e-12 ? -70 : -0.691 + 10 * Math.log10(ms);
}

function masterBus(st, targetLufs = -14.0) {
  let y = lpS(hpS(st, 26), 16800);
  const n = y[0].length;

  // Subtle stereo-side high-shelf shimmer (+1.4 dB above 6 kHz on Side channel)
  const side = new Float64Array(n);
  for (let i = 0; i < n; i++) side[i] = (y[0][i] - y[1][i]) * 0.5;
  const sideAir = hpM(side, 6000);
  for (let i = 0; i < n; i++) {
    y[0][i] += sideAir[i] * 0.18;
    y[1][i] -= sideAir[i] * 0.18;
  }

  // Loudness match toward -14 LUFS
  const cur = measureLufsApprox(y);
  const gainDb = cur > -55 ? Math.max(-18, Math.min(18, targetLufs - cur)) : 0;
  const g = Math.pow(10, gainDb / 20);
  const ceil = Math.pow(10, -1.0 / 20); // -1.0 dBTP = 0.891
  const normTanh = Math.tanh(0.92);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    y[0][i] = (Math.tanh((y[0][i] * g / ceil) * 0.92) * ceil) / normTanh;
    y[1][i] = (Math.tanh((y[1][i] * g / ceil) * 0.92) * ceil) / normTanh;
    const p = Math.max(Math.abs(y[0][i]), Math.abs(y[1][i]));
    if (p > peak) peak = p;
  }
  if (peak > ceil) {
    const s = ceil / peak;
    for (let i = 0; i < n; i++) { y[0][i] *= s; y[1][i] *= s; }
  }
  return y;
}

function writeWav16(outPath, st) {
  const n = st[0].length;
  const dataBytes = n * 4; // 2 ch * 16-bit
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // Stereo
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  let off = 44;
  const L = st[0], R = st[1];
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * 32767))), off);
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * 32767))), off + 2);
    off += 4;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
}

// ---------- CLI Entry ----------
const proj = path.resolve(process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const scriptPath = path.join(proj, 'script.json');
const cuesPath = path.join(proj, 'data', 'cues.json');
const narrPath = path.join(proj, 'data', 'narration.wav');
const outPath = path.join(proj, 'data', 'mix.wav');

const script = fs.existsSync(scriptPath) ? JSON.parse(fs.readFileSync(scriptPath, 'utf8')) : {};
const cuesDoc = fs.existsSync(cuesPath) ? JSON.parse(fs.readFileSync(cuesPath, 'utf8')) : { duration: 30, cues: [] };
const dur = Number(cuesDoc.duration || 30);
const n = Math.ceil(dur * SR);
const bpm = Number(script.bpm || 122);
const musicMode = script.music ?? 'anthem';
const hasVo = script.mode === 'narrated' && fs.existsSync(narrPath);

let musicBuf = makeStereo(n);
if (musicMode && musicMode !== 'none') {
  const customPath = path.join(proj, musicMode);
  if (fs.existsSync(customPath)) {
    const raw = loadAudioStereo(customPath);
    const rn = raw[0].length;
    for (let i = 0; i < n; i++) {
      musicBuf[0][i] = raw[0][i % rn];
      musicBuf[1][i] = raw[1][i % rn];
    }
    const tail = Math.min(n, Math.round(0.6 * SR));
    for (let i = n - tail; i < n; i++) {
      const f = (n - 1 - i) / tail;
      musicBuf[0][i] *= f; musicBuf[1][i] *= f;
    }
  } else {
    musicBuf = musicAnthem(dur, bpm);
  }
}

const sfxBuf = makeStereo(n);
for (const c of cuesDoc.cues || []) {
  const fn = FX[c.type] || fx_pop;
  const seg = fn(Number(c.dur ?? 0.35), Number(c.pan ?? 0));
  addStereo(sfxBuf, seg, Number(c.t ?? 0), Number(c.gain ?? 0.85));
}
const sfxClean = lpS(sfxBuf, 16800);

const combined = makeStereo(n);
let targetLufs = -13.8;

if (hasVo) {
  const vo = loadAudioStereo(narrPath);
  const voBuf = makeStereo(n);
  addStereo(voBuf, vo, 0, 1.0);
  const voAbs = new Float64Array(n);
  for (let i = 0; i < n; i++) voAbs[i] = Math.abs((voBuf[0][i] + voBuf[1][i]) * 0.5);
  const voEnv = lpM(voAbs, 6.0);
  for (let i = 0; i < n; i++) {
    const duck = Math.max(0.28, Math.min(1.0, 1 - voEnv[i] * 3.8));
    combined[0][i] = voBuf[0][i] * 1.05 + musicBuf[0][i] * duck * 0.42 + sfxClean[0][i] * 0.48;
    combined[1][i] = voBuf[1][i] * 1.05 + musicBuf[1][i] * duck * 0.42 + sfxClean[1][i] * 0.48;
  }
  targetLufs = -14.0;
} else if (musicMode === 'none') {
  for (let i = 0; i < n; i++) { combined[0][i] = sfxClean[0][i] * 0.92; combined[1][i] = sfxClean[1][i] * 0.92; }
  targetLufs = -16.0;
} else {
  for (let i = 0; i < n; i++) {
    combined[0][i] = musicBuf[0][i] * 0.86 + sfxClean[0][i] * 0.58;
    combined[1][i] = musicBuf[1][i] * 0.86 + sfxClean[1][i] * 0.58;
  }
}

const mastered = masterBus(combined, targetLufs);
writeWav16(outPath, mastered);

const lufs = measureLufsApprox(mastered);
let pk = 0;
for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(mastered[0][i]), Math.abs(mastered[1][i]));
const peakDb = 20 * Math.log10(Math.max(1e-9, pk));
console.log(`mix.wav -> ${outPath} (${dur.toFixed(2)}s stereo 48kHz | music=${musicMode} | ~${lufs.toFixed(1)} LUFS | peak ${peakDb.toFixed(1)} dBFS | ${(cuesDoc.cues || []).length} cues)`);
