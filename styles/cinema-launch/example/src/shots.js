// Cinema Launch Reference Shots — Brand-Agnostic Studio Template (122 BPM, 60 FPS)
// Demonstrates every cinema-launch primitive cleanly with zero leaked template copy.
import { W, H, CX, CY, U, PORTRAIT, clamp, lerp, seg, eo, eo4, eio, bezier2, drawCover, drawContain, rr, fontSpec } from './core/lib.js';
import { B } from './core/brand.js';
import { L, Le } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots({ E3D }) {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i));
  const durOf = (i) => Math.max(0.4, Le(i) - cut(i));

  // S01 · Chromatic Scramble-Decode Opener
  add({
    id: 'S01', at: cut(0),
    note: 'Chromatic scramble-decode hook on sunlit editorial paper',
    draw(lt, d, t) {
      K.paperWorldBg(t);
      K.withCamera({ zoom: lerp(1.0, 1.03, eio(lt / d)) }, () => {
        K.chromaticDecodeText({
          text: B.copy.h1 || 'Ship work people notice.',
          progress: seg(lt, 0.04, d * 0.68),
          t,
          size: PORTRAIT ? 64 : 74,
          underlineP: seg(lt, d * 0.66, d * 0.92),
        });
      });
    },
  });
  cue(cut(0) + 0.06, 'decode_tick', { dur: durOf(0) * 0.62 });

  // S02 · Brand Reveal Over Living Daylight Sky
  add({
    id: 'S02', at: cut(1),
    transitionIn: { type: 'mist', dur: 0.2 },
    note: 'Atmospheric sky plate + aspect-safe squircle emblem & wordmark',
    draw(lt, d, t) {
      K.livingPlateBg(B.ai.skyDaylight || null, t, { zoom: lerp(1.04, 1.09, lt / d) });
      K.inlineEmblemSentence({
        prefix: '',
        suffix: B.name,
        emblemImg: B.logoImg,
        size: PORTRAIT ? 62 : 76,
        weight: 800,
        emblemPop: lt * 2.2,
      });
    },
  });
  cue(cut(1), 'glass_whoosh', { dur: 0.45 });

  // S03 · Liquid Glass Prompt Capsule + 2.6x Macro Zoom + Bezier Cursor Click + Spinner Morph
  add({
    id: 'S03', at: cut(2),
    note: 'Liquid Glass prompt capsule typing -> 2.6x macro push -> click -> spinner',
    draw(lt, d, t) {
      const zoomP = eio(seg(lt, d * 0.48, d * 0.76));
      const clickP = seg(lt, d * 0.74, d * 0.9);
      const spinP = seg(lt, d * 0.78, d);
      K.livingPlateBg(B.ai.skyDaylight || null, t, { zoom: lerp(1.06, 1.24, zoomP) });

      const query = B.domain || 'product.app';
      const typed = query.slice(0, Math.round(query.length * seg(lt, 0.1, d * 0.46)));
      // Compute world button position cleanly before macro camera transform
      const probeRect = {
        btnX: CX + (PORTRAIT ? 880 : 840) * U / 2 - 58 * U,
        btnY: CY + 12 * U,
      };
      K.withCamera({
        zoom: lerp(1.0, 2.55, zoomP),
        focusX: lerp(CX, probeRect.btnX - 45 * U, zoomP),
        focusY: lerp(CY, probeRect.btnY, zoomP),
        viewX: CX,
        viewY: CY,
      }, () => {
        const pos = K.promptCapsule({
          typed,
          chips: ['Inspect live', 'Fix issues', 'Export clean'],
          caret: spinP <= 0.01,
          caretT: t,
          pressed: clickP,
          spinnerP: spinP,
          rimGlow: zoomP,
          yOffset: 12,
        });
        const curT = eo(seg(lt, d * 0.44, d * 0.73));
        const [cx, cy] = bezier2(
          [pos.btnX + 240 * U, pos.btnY + 170 * U],
          [pos.btnX + 110 * U, pos.btnY + 25 * U],
          [pos.btnX + 4 * U, pos.btnY + 4 * U],
          curT,
        );
        if (lt > d * 0.42) K.macCursor(cx, cy, { kind: curT > 0.88 ? 'pointer' : 'arrow', click: clickP });
      });
    },
  });
  cue(cut(2) + durOf(2) * 0.12, 'type', { dur: durOf(2) * 0.36 });
  cue(cut(2) + durOf(2) * 0.48, 'riser', { dur: durOf(2) * 0.42 });
  cue(cut(2) + durOf(2) * 0.74, 'mac_click', { gain: 0.95 });

  // S04 · Floating Evidence Card Fan Around Liquid Glass Capsule
  add({
    id: 'S04', at: cut(3),
    note: 'Apple Liquid Glass center card + radial floating UI fan',
    draw(lt, d, t) {
      K.livingPlateBg(B.ai.skyDaylight || null, t, { zoom: lerp(1.06, 1.11, lt / d) });
      const gatherP = seg(lt, d * 0.68, d * 0.98);
      K.floatingCardFan({
        lt,
        gatherP,
        cards: [
          { x: CX - 560 * U, y: CY - 220 * U, w: 380, h: 240, rot: -5, img: B.imgs.hero, caption: 'Live view' },
          { x: CX + 560 * U, y: CY - 210 * U, w: 380, h: 240, rot: 4.5, img: B.imgs.showcase || B.imgs.hero, caption: 'Diagnostics' },
          { x: CX - 520 * U, y: CY + 230 * U, w: 360, h: 220, rot: 3.5, img: B.imgs.mid1 || B.imgs.hero, caption: 'Metrics' },
          { x: CX + 520 * U, y: CY + 220 * U, w: 360, h: 220, rot: -4, img: B.imgs.mid2 || B.imgs.showcase, caption: 'Ship ready' },
        ],
      });
      const cw = (PORTRAIT ? 660 : 620) * U, ch = 128 * U;
      K.frostedGlassCard({ x: CX - cw / 2, y: CY - ch / 2, w: cw, h: ch, r: 28 * U, dark: false });
      const ctx = K.getCtx();
      ctx.save();
      ctx.font = fontSpec(600, 26 * U, B.displayFont);
      ctx.fillStyle = '#111110';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Live workspace for ${B.domain}`, CX, CY);
      ctx.restore();
    },
  });
  cue(cut(3), 'drop', { gain: 0.9 });
  cue(cut(3), 'glass_whoosh', { dur: 0.4 });

  // S05 · Dual 3D Angled macOS Windows Over Transparent Sky + Real-Time Scan-Wipe Transform
  add({
    id: 'S05', at: cut(4),
    note: 'Dual 3D perspective macOS windows over sky with real-time scan wipe',
    draw(lt, d, t) {
      K.livingPlateBg(B.ai.skyDaylight || null, t, { zoom: lerp(1.06, 1.12, lt / d) });
      const wipeP = eio(seg(lt, d * 0.22, d * 0.68));
      E3D.renderDualCompare({
        t,
        portrait: PORTRAIT,
        enterP: seg(lt, 0, 0.45),
        orbitX: lerp(-0.14, 0.14, eio(lt / d)),
        camZ: lerp(6.25, 5.8, eio(lt / d)),
        left: {
          img: B.imgs.hero,
          title: 'Before',
          badge: 'Baseline',
          badgeBg: '#3F3F46',
        },
        right: {
          img: B.imgs.hero,
          afterImg: B.imgs.showcase || B.imgs.mid1 || B.imgs.hero,
          wipeP,
          wipeColor: B.accent,
          title: 'After',
          badge: 'Upgraded',
          badgeBg: B.emerald,
          highlightRing: wipeP > 0.05 && wipeP < 0.95 ? 1 : 0,
        },
      });
      K.getCtx().drawImage(E3D.canvas, 0, 0, W, H);
      K.floatingGlassPill({
        text: wipeP > 0.6 ? 'Instant live upgrade' : 'Upgrade hierarchy and contrast',
        dark: false,
        accentDot: B.accentDeep,
        popP: seg(lt, 0.15, 0.5),
      });
    },
  });
  cue(cut(4), 'glass_whoosh', { dur: 0.45 });
  cue(cut(4) + durOf(4) * 0.22, 'portal_morph', { dur: durOf(4) * 0.45 });
  cue(cut(4) + durOf(4) * 0.68, 'confirm');

  // S06 · Split Frosted-Glass Live Edit Diff Synced to Live Preview
  add({
    id: 'S06', at: cut(5),
    note: 'Split frosted-glass live edit diff + live synced preview',
    draw(lt, d, t) {
      K.livingPlateBg(B.ai.skyDaylight || null, t, { zoom: lerp(1.05, 1.1, lt / d) });
      const strikeP = seg(lt, d * 0.22, d * 0.42);
      const swapP = seg(lt, d * 0.42, d * 0.68);
      const ctaP = seg(lt, d * 0.68, d * 0.9);

      if (PORTRAIT) {
        K.liveDiffGlassCard({
          x: 70 * U, y: 220 * U, w: W - 140 * U, h: 640 * U,
          header: 'Live Edit',
          badge: 'Instant sync',
          beforeText: 'The All-in-One Platform for Modern Teams',
          afterText: B.copy.h1 || 'Ship faster with real proof.',
          strikeP, swapP,
          ctaBefore: 'Learn More',
          ctaAfter: B.copy.ctaPrimary || 'Start Free',
          ctaSwapP: ctaP,
        });
        K.macWindowFrame({
          x: 70 * U, y: 920 * U, w: W - 140 * U, h: 740 * U,
          title: B.domain,
          badge: swapP > 0.5 ? 'Live' : 'Editing',
          drawBody: (bx, by, bw, bh) => {
            if (B.imgs.showcase || B.imgs.hero) drawCover(K.getCtx(), B.imgs.showcase || B.imgs.hero, bx, by, bw, bh, { panY: 0.05 });
          },
        });
      } else {
        K.liveDiffGlassCard({
          x: 96 * U, y: 170 * U, w: 760 * U, h: 740 * U,
          header: 'Live Edit',
          badge: 'Instant sync',
          beforeText: 'The All-in-One Platform for Modern Teams',
          afterText: B.copy.h1 || 'Ship faster with real proof.',
          strikeP, swapP,
          ctaBefore: 'Learn More',
          ctaAfter: B.copy.ctaPrimary || 'Start Free',
          ctaSwapP: ctaP,
        });
        K.macWindowFrame({
          x: 904 * U, y: 170 * U, w: 920 * U, h: 740 * U,
          title: B.domain,
          badge: swapP > 0.5 ? 'Updated' : 'Live Preview',
          drawBody: (bx, by, bw, bh) => {
            if (B.imgs.showcase || B.imgs.hero) drawCover(K.getCtx(), B.imgs.showcase || B.imgs.hero, bx, by, bw, bh, { panY: 0.04 });
          },
        });
      }
    },
  });
  cue(cut(5) + durOf(5) * 0.22, 'strikethrough_snip');
  cue(cut(5) + durOf(5) * 0.58, 'score_lift');

  // S07 · Pixel-Mosaic Block Dissolve Into Annotated Full Workspace
  add({
    id: 'S07', at: cut(6),
    transitionIn: { type: 'mosaic', dur: 0.48, tile: 36 },
    note: 'Pixel-mosaic wipe into full annotated workspace with curved callout arrows',
    draw(lt, d, t) {
      K.paperWorldBg(t);
      const pad = PORTRAIT ? 44 * U : 86 * U;
      const wx = pad, wy = PORTRAIT ? 280 * U : 88 * U;
      const ww = W - pad * 2, wh = PORTRAIT ? 1280 * U : H - 176 * U;
      K.macWindowFrame({
        x: wx, y: wy, w: ww, h: wh,
        title: `${B.name} Workspace`,
        badge: 'Ready',
        drawBody: (bx, by, bw, bh) => {
          if (B.imgs.showcase || B.imgs.hero) drawCover(K.getCtx(), B.imgs.showcase || B.imgs.hero, bx, by, bw, bh, { panY: 0.04 });
        },
      });
      K.calloutBubble({ text: 'Live Preview', x: wx + ww * 0.16, y: wy + wh * 0.24, targetX: wx + ww * 0.34, targetY: wy + wh * 0.38, popP: seg(lt, 0.55, 0.95) });
      K.calloutBubble({ text: 'Instant Export', x: wx + ww * 0.84, y: wy + wh * 0.72, targetX: wx + ww * 0.68, targetY: wy + wh * 0.6, borderColor: B.emerald, curve: -0.22, popP: seg(lt, 0.85, 1.25) });
    },
  });
  cue(cut(6), 'mosaic_sweep', { dur: 0.48 });
  cue(cut(6) + 0.55, 'pop');
  cue(cut(6) + 0.85, 'pop');

  // S08 · Editorial Meta Endcard (Inline Emblem + Domain Lockup)
  add({
    id: 'S08', at: cut(7),
    note: 'Stark editorial meta punchline -> clean domain endcard',
    draw(lt, d, t) {
      K.paperWorldBg(t);
      if (lt < d * 0.55) {
        K.inlineEmblemSentence({
          prefix: 'Built with',
          suffix: `${B.name}.`,
          emblemImg: B.logoImg,
          size: PORTRAIT ? 52 : 62,
          emblemPop: lt * 2.5,
        });
      } else {
        K.blurRevealText({
          text: B.domain,
          sub: 'Start free today',
          progress: seg(lt, d * 0.55, d * 0.78),
          size: PORTRAIT ? 66 : 82,
          weight: 800,
          ink: B.text,
        });
      }
    },
  });
  cue(cut(7), 'chime', { gain: 0.72 });
  cue(cut(7) + durOf(7) * 0.55, 'confirm', { gain: 0.6 });

  return { shots: S, cues: CUES };
}
