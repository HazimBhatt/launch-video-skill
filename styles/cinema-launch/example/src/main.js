// Cinema Launch runtime: dual-buffer cross-shot compositor, transparent 3D stage, lossless frame export
import { W, H, CX, CY, FPS, setAspect, clamp, eo, seg } from './core/lib.js';
import { B, loadBrand } from './core/brand.js';
import { T, loadTiming } from './core/timing.js';
import { buildCaptions, drawCaption } from './core/captions.js';
import { makeCinemaStage3D } from './core/engine3d.js';
import * as K from './core/kit.js';
import { buildShots } from './shots.js';

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d', { alpha: false });
const gl = document.getElementById('gl');

const bufA = document.createElement('canvas');
const ctxA = bufA.getContext('2d');
const bufB = document.createElement('canvas');
const ctxB = bufB.getContext('2d');

let SHOTS = [];
let CUES = [];
let CAPS = [];
let DUR = 30;
let SCRIPT = null;
let E3D = null;

function resizeAll(aspect) {
  const s = setAspect(aspect);
  cv.width = bufA.width = bufB.width = s.W;
  cv.height = bufA.height = bufB.height = s.H;
  gl.width = s.W;
  gl.height = s.H;
  if (E3D) E3D.resize(s.W, s.H);
}

function renderShotTo(targetCtx, shot, t) {
  const lt = clamp(t - shot.at, 0, Math.max(0.001, shot.end - shot.at));
  const d = Math.max(0.001, shot.end - shot.at);
  K.bindCtx(targetCtx, E3D);
  targetCtx.save();
  targetCtx.setTransform(1, 0, 0, 1, 0, 0);
  targetCtx.clearRect(0, 0, W, H);
  targetCtx.fillStyle = shot.bg || (shot.dark ? B.darkBg : B.bg);
  targetCtx.fillRect(0, 0, W, H);

  // Opt-in cut punch only (zero forced uniform template bounce)
  if (shot.punch && shot.punch > 0) {
    const p = 1 + shot.punch * (1 - eo(seg(lt, 0, 0.22)));
    const fx = shot.cam ? shot.cam[0] : CX;
    const fy = shot.cam ? shot.cam[1] : CY;
    targetCtx.translate(fx, fy);
    targetCtx.scale(p, p);
    targetCtx.translate(-fx, -fy);
  }
  shot.draw(lt, d, t);
  targetCtx.restore();
}

function findShotIdx(t) {
  for (let i = SHOTS.length - 1; i >= 0; i--) {
    if (t >= SHOTS[i].at - 1e-6) return i;
  }
  return 0;
}

export function drawAt(tRaw) {
  const t = clamp(tRaw, 0, DUR);
  const idx = findShotIdx(t);
  const cur = SHOTS[idx];
  const tr = cur.transitionIn;

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (tr && tr.dur > 0 && idx > 0 && t - cur.at < tr.dur) {
    const prev = SHOTS[idx - 1];
    const p = clamp((t - cur.at) / tr.dur, 0, 1);
    renderShotTo(ctxA, prev, cur.at - 0.001);
    renderShotTo(ctxB, cur, t);
    K.bindCtx(ctx, E3D);
    K.composeTransition(ctx, bufA, bufB, p, tr);
  } else {
    renderShotTo(ctx, cur, t);
  }

  K.bindCtx(ctx, E3D);
  if (CAPS.length) drawCaption(ctx, CAPS, t);

  // Subtle opt-in end tail fade (never hardcoded to beige)
  if (SCRIPT?.fadeOut && t > DUR - SCRIPT.fadeOut) {
    const fp = seg(t, DUR - SCRIPT.fadeOut, DUR);
    ctx.save();
    ctx.fillStyle = cur.bg || B.bg;
    ctx.globalAlpha = fp;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

async function boot() {
  try {
    const qs = new URLSearchParams(location.search);
    const [timing, brand, scriptRes] = await Promise.all([
      loadTiming(),
      loadBrand(),
      fetch('script.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    ]);
    SCRIPT = scriptRes || {};
    const aspect = qs.get('aspect') || SCRIPT?.aspect || '16:9';
    resizeAll(aspect);

    // Wait for fonts (local + Google Fonts if online, bounded to 2.5s so offline never hangs)
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch {}

    E3D = makeCinemaStage3D(gl, { w: W, h: H });
    K.bindCtx(ctx, E3D);

    const built = buildShots({ E3D, B, SCRIPT });
    SHOTS = built.shots || [];
    CUES = built.cues || [];
    DUR = T.dur || 30;
    for (let i = 0; i < SHOTS.length; i++) {
      SHOTS[i].end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR;
    }
    CAPS = buildCaptions(timing.words, SCRIPT);

    window.OP = {
      ready: true,
      bootError: null,
      duration: () => DUR,
      size: () => ({ w: W, h: H, aspect: W > H ? '16:9' : '9:16', fps: FPS }),
      shots: () => SHOTS.map((s) => ({ id: s.id, at: s.at, end: s.end, note: s.note || '' })),
      cues: () => CUES,
      captions: () => CAPS,
      draw: (t) => drawAt(t),
      frame: (t, q = 0.96, fmt = 'jpeg') => {
        drawAt(t);
        if (fmt === 'png') return cv.toDataURL('image/png');
        return cv.toDataURL('image/jpeg', q);
      },
    };

    drawAt(0);

    // Interactive browser preview mode
    if (!qs.has('capture')) {
      const btn = document.getElementById('play');
      btn.hidden = false;
      let audio = null;
      let raf = 0;
      let startWall = 0;
      const loop = () => {
        const elapsed = audio ? audio.currentTime : (performance.now() - startWall) / 1000;
        if (elapsed >= DUR) {
          drawAt(DUR);
          btn.hidden = false;
          return;
        }
        drawAt(elapsed);
        raf = requestAnimationFrame(loop);
      };
      btn.onclick = async () => {
        btn.hidden = true;
        cancelAnimationFrame(raf);
        try {
          audio = new Audio('data/mix.wav');
          await audio.play();
        } catch {
          audio = null;
          startWall = performance.now();
        }
        loop();
      };
    }
  } catch (err) {
    window.OP = { ready: false, bootError: String(err?.stack || err) };
    console.error(err);
  }
}

boot();
