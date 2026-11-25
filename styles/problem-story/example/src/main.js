// Problem Story Boot (Warm Light Theme + Outlined Gold Highlight Captions)
import { W, H, ASPECT, setAspect, setCtx, ctx, clamp, eo, eio } from './core/lib.js';
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
  ctx.fillStyle = B.bg || '#F7F5EE';
  ctx.fillRect(0, 0, W, H);

  const S = OP._shots;
  let i = S.length - 1;
  while (i > 0 && S[i].at > t) i--;
  const sh = S[i];
  const end = i < S.length - 1 ? S[i + 1].at : T.dur;
  const d = Math.max(0.01, end - sh.at);
  const lt = t - sh.at;

  const punch = sh.punch === false ? 1 : 1 + 0.04 * (1 - eo(clamp(lt / 0.22)));
  const drift = 1 + (sh.zoom ?? 0.025) * eio(clamp(lt / d));
  const [cx, cy] = sh.cam || [W / 2, H / 2];

  const blit3D = () => ctx.drawImage(gl, 0, 0, W, H);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(punch * drift, punch * drift);
  ctx.translate(-cx, -cy);
  sh.draw(lt, d, t, blit3D);
  ctx.restore();

  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
  if (i > 0 && lt < 0.08 && sh.flash !== false) {
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.24 * (1 - lt / 0.08);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  const fade = Math.min(clamp(t / 0.16), clamp((T.dur - t) / 0.28));
  if (fade < 1) {
    ctx.fillStyle = '#F7F5EE';
    ctx.globalAlpha = 1 - fade;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  // High-contrast bright gold on thick dark stroke reads effortlessly over warm cream paper!
  drawCaption(t, { highlightColor: '#FACC15' });
}

(async () => {
  try {
    await Promise.all([
      document.fonts.load('900 96px Inter'),
      document.fonts.load('800 48px Inter'),
      document.fonts.load('italic 700 84px Caladea'),
      document.fonts.load('700 32px FreeMono'),
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

    const E3D = makeStage3D(gl, { w: W, h: H, accent: B.accent, bg: B.bg });
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
