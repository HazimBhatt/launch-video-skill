// Macro Studio Boot: rapid single-focus match cuts across Warm Sand (#EFECE6), Matte Carbon (#161719), and Bokeh stages.
import { W, H, U, ASPECT, setAspect, setCtx, ctx, clamp, eo, eio } from './core/lib.js';
import { B, loadBrand } from './core/brand.js';
import { T, loadTiming } from './core/timing.js';
import { buildCaptions, drawCaption, captionList } from './core/captions.js';
import { makeStage3D } from './core/engine3d.js';
import { buildShots } from './shots.js';

const cv = document.getElementById('cv');
const gl = document.getElementById('gl');
setCtx(cv.getContext('2d'));
const OP = (window.OP = { ready: false });

function draw(t) {
  t = clamp(t, 0, T.dur - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#EFECE6';
  ctx.fillRect(0, 0, W, H);

  const S = OP._shots;
  let i = S.length - 1;
  while (i > 0 && S[i].at > t) i--;
  const sh = S[i];
  const end = i < S.length - 1 ? S[i + 1].at : T.dur;
  const d = Math.max(0.01, end - sh.at);
  const lt = t - sh.at;

  const punch = sh.punch === false ? 1 : 1 + 0.025 * (1 - eo(clamp(lt / 0.18)));
  const drift = 1 + (sh.zoom ?? 0.018) * eio(clamp(lt / d));
  const [cx, cy] = sh.cam || [W / 2, H / 2];

  const blit3D = () => ctx.drawImage(gl, 0, 0, W, H);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(punch * drift, punch * drift);
  ctx.translate(-cx, -cy);
  sh.draw(lt, d, t, blit3D);
  ctx.restore();

  // Whisper-subtle corner studio brand watermark across mid-film scenes (never on endcard/opener unless enabled)
  if (sh.watermark && B.logoImg) {
    ctx.save();
    ctx.globalAlpha = sh.dark ? 0.34 : 0.24;
    const ls = 24 * U;
    const iw = B.logoImg.naturalWidth || B.logoImg.width || ls;
    const ih = B.logoImg.naturalHeight || B.logoImg.height || ls;
    const sc = Math.min(ls / iw, ls / ih);
    const dw = iw * sc, dh = ih * sc;
    ctx.drawImage(B.logoImg, 32 * U + (ls - dw) / 2, 28 * U + (ls - dh) / 2, dw, dh);
    ctx.fillStyle = sh.dark ? '#F5F4F0' : '#141413';
    ctx.font = `600 ${Math.round(17 * U)}px '${B.displayFont || 'Inter'}', 'Inter', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(B.name, 32 * U + ls + 10 * U, 28 * U + ls / 2);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
  if (i > 0 && lt < 0.07 && sh.flash === true) {
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.22 * (1 - lt / 0.07);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  const fade = Math.min(clamp(t / 0.14), clamp((T.dur - t) / 0.24));
  if (fade < 1) {
    ctx.fillStyle = '#EFECE6';
    ctx.globalAlpha = 1 - fade;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  drawCaption(t, { highlightColor: '#FACC15' });
}

(async () => {
  try {
    await Promise.all([
      document.fonts.load('500 32px "DM Sans"'),
      document.fonts.load('600 48px "DM Sans"'),
      document.fonts.load('700 64px "DM Sans"'),
      document.fonts.load('500 32px Inter'),
      document.fonts.load('600 48px Inter'),
      document.fonts.load('700 64px Inter'),
      document.fonts.load('500 32px "JetBrains Mono"'),
      document.fonts.load('700 32px "JetBrains Mono"'),
    ]).catch(() => {});

    const q = new URLSearchParams(location.search);
    const script = await (await fetch('script.json', { cache: 'no-store' })).json();
    const aspect = q.get('aspect') || script.aspect || '16:9';
    setAspect(aspect);
    cv.width = W; cv.height = H;
    gl.width = W; gl.height = H;

    await loadBrand('light');
    await loadTiming();
    buildCaptions(script);

    const E3D = makeStage3D(gl, { w: W, h: H, accent: B.accent, bg: '#EFECE6' });
    const { shots, cues } = buildShots(E3D);
    shots.sort((a, b) => a.at - b.at);

    OP._shots = shots;
    OP.script = script;
    OP.size = () => ({ w: W, h: H, aspect: ASPECT });
    OP.duration = () => T.dur;
    OP.draw = draw;
    OP.frame = (t, qual = 0.92) => { draw(t); return cv.toDataURL('image/jpeg', qual); };
    OP.shots = () => shots.map((s, idx) => ({
      id: s.id, at: +s.at.toFixed(3),
      end: +(idx < shots.length - 1 ? shots[idx + 1].at : T.dur).toFixed(3),
      note: s.note || '',
    }));
    OP.captions = () => captionList().map((c) => ({
      s: +c.s.toFixed(3), e: +c.e.toFixed(3),
      text: c.words.map((w) => (w.hi ? '*' : '') + w.txt).join(' '),
    }));
    OP.cues = () => cues.slice().sort((a, b) => a.t - b.t);
    OP.ready = true;

    if (!q.has('capture')) {
      if (q.has('t')) draw(+q.get('t'));
      else {
        const audio = new Audio('data/mix.wav');
        let t0 = null;
        const btn = document.getElementById('play');
        btn.hidden = false;
        btn.onclick = () => {
          btn.hidden = true;
          t0 = performance.now();
          audio.currentTime = 0;
          audio.play().catch(() => {});
        };
        const loop = (now) => {
          const t = t0 == null ? 0 : (now - t0) / 1000;
          draw(t);
          if (t0 != null && t > T.dur) { t0 = null; btn.hidden = false; }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }
    }
  } catch (e) {
    OP.bootError = String((e && e.stack) || e);
    console.error(e);
  }
})();
