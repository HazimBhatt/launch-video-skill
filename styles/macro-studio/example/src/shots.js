// Macro Studio Reference Shots (12 rapid single-focus studio cuts)
import { W, H, CX, CY, U, PORTRAIT, clamp, lerp, seg, eo, eio, spring } from './core/lib.js';
import { B } from './core/brand.js';
import { L } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i));

  // B01 · Syntax Cloud opener
  add({
    id: 'B01', at: cut(0), cam: [CX, CY], zoom: 0.015,
    note: 'Opener: bare typography + syntax scatter',
    draw(lt, d) {
      K.sandBg(lt);
      K.scatterSyntaxCloud({
        headline: lt < d * 0.45 ? 'Build products' : 'that convert',
        tokens: [
          { txt: 'const mrr = await sync();', dx: -0.58, dy: -0.45, size: 22 },
          { txt: 'POST /v2/webhooks', dx: 0.56, dy: -0.48, size: 22, accent: true },
          { txt: 'retry: 3x', dx: -0.62, dy: 0.42, size: 21, muted: true },
          { txt: 'status: 200 OK', dx: 0.58, dy: 0.46, size: 22, muted: true },
        ],
        lt, disperse: seg(lt, d * 0.42, d * 0.95),
      });
    },
  });
  cue(cut(0) + 0.05, 'basshit', { gain: 0.8 });

  // B02 · Brand Capsule Flash
  add({
    id: 'B02', at: cut(1), cam: [CX, CY], zoom: 0.02,
    note: 'Clean full-bleed product flash + brand lockup',
    draw(lt, d) {
      if (lt < d * 0.52 && B.imgs.hero) {
        K.macroStageBleed(B.imgs.hero, { zoom: lerp(1.04, 1.14, lt / d), displayText: B.name, scrim: 0.34 });
      } else {
        K.sandBg(lt);
        K.scatterSyntaxCloud({ headline: B.name, sub: B.domain, lt: lt - d * 0.52 });
      }
    },
  });
  cue(cut(1), 'whoosh');

  // B03 · Solitary Prompt Input
  add({
    id: 'B03', at: cut(2), cam: [CX, CY], zoom: 0.015, watermark: true,
    note: 'Solitary prompt card typing + submit click',
    draw(lt, d) {
      K.sandBg(lt);
      const txt = `Track churn across every annual renewal on ${B.domain}`;
      const typed = txt.slice(0, Math.round(txt.length * seg(lt, 0.12, d * 0.65)));
      const clk = seg(lt, d * 0.68, d * 0.9);
      K.solitaryPromptCard({ typed, caret: lt < d * 0.72, pressed: Math.sin(clk * Math.PI) });
      K.cursor(lerp(CX + 280 * U, CX + (PORTRAIT ? W * 0.43 - 68 * U : 470 * U - 68 * U), eo(seg(lt, 0.3, d * 0.66))),
        lerp(CY + 140 * U, CY - (PORTRAIT ? 135 : 120) * U + 68 * U, eo(seg(lt, 0.3, d * 0.66))), { click: clk });
    },
  });
  cue(cut(2) + 0.15, 'type', { dur: 1.15 });
  cue(cut(2) + 1.65, 'click', { gain: 0.9 });

  // B04 · Macro Architecture Tree
  add({
    id: 'B04', at: cut(3), cam: [CX, CY], zoom: 0.02, watermark: true,
    note: 'Oversized file/feature hierarchy glide',
    draw(lt, d) {
      K.sandBg(lt);
      K.macroFileTree({
        scrollY: lerp(0, 140, eio(lt / d)),
        activeIdx: lt < d * 0.5 ? 1 : 3,
        lt,
        rows: [
          { label: 'Core Engine', depth: 0, kind: 'folder' },
          { label: 'BillingSync', depth: 1, glyph: 'check', accent: true },
          { label: 'Playbooks', depth: 1, kind: 'folder' },
          { label: 'RecoveryFlow', depth: 2, glyph: 'clock', accent: true },
          { label: 'WebhookGuard', depth: 2, glyph: 'shield' },
        ],
      });
    },
  });
  cue(cut(3), 'swoosh');

  // B05 · Edge-to-edge UI showcase bleed
  add({
    id: 'B05', at: cut(4), cam: [CX, CY], zoom: 0.03, watermark: true,
    note: 'Full-bleed UI macro zoom',
    draw(lt, d) {
      K.macroStageBleed(B.imgs.showcase || B.imgs.hero, {
        zoom: lerp(1.06, 1.24, eio(lt / d)), panX: 0.48, panY: 0.28, scrim: 0.14,
      });
    },
  });
  cue(cut(4), 'pop');

  // B06 · Morph Connector -> Velocity Blur Smear
  add({
    id: 'B06', at: cut(5), cam: [CX, CY], zoom: 0.015, watermark: true,
    note: 'Icon morph + horizontal blur smear',
    draw(lt, d) {
      if (lt < d * 0.72) {
        K.sandBg(lt);
        K.morphConnector({ leftText: 'Connect to', rightText: 'Stripe', glyph: 'chain', openP: seg(lt, 0.22, 0.65), lt });
      } else {
        K.velocitySmear(seg(lt, d * 0.72, d));
      }
    },
  });
  cue(cut(5) + 0.2, 'morph');

  // B07 · Horizontal Macro Timeline Scrub
  add({
    id: 'B07', at: cut(6), cam: [CX, CY], zoom: 0.015, watermark: true,
    note: 'Macro timeline scrub across automated recovery',
    draw(lt, d) {
      K.sandBg(lt);
      K.macroTimelineScrub({
        columns: ['Day 0', 'Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30'],
        scrubP: lt / d,
        zoom: lerp(1.0, 1.18, eio(lt / d)),
        lanes: [
          { col: 0, row: 0, span: 1.5, title: 'Card Expiring', sub: 'Trigger caught' },
          { col: 1, row: 1, span: 2.0, title: 'Smart Plain-Text', sub: '38% reply rate', accent: true },
          { col: 2, row: 2, span: 1.8, title: '1-Click Retry', sub: '+$1,420/mo recovered' },
        ],
      });
    },
  });
  cue(cut(6), 'slide', { dur: 0.9 });

  // B08 · Carbon Terminal + Code Slab
  add({
    id: 'B08', at: cut(7), cam: [CX, CY], zoom: 0.018, dark: true, watermark: true,
    note: 'Dark carbon terminal typing -> code slab',
    draw(lt, d) {
      if (lt < d * 0.5) {
        const toks = [
          { text: '→', color: '#84CC16' },
          { text: 'git', color: '#FFFFFF' },
          { text: 'push', color: '#F59E0B' },
          { text: 'main', color: '#7DD3FC' },
        ];
        const totalChars = toks.map((t) => t.text).join(' ').length;
        K.terminalTypeScreen({ tokens: toks, typedChars: totalChars * seg(lt, 0.05, d * 0.36), lt });
      } else {
        K.codeEditorSlab({
          lt: lt - d * 0.5,
          highlightIdx: 1,
          lines: [
            { segs: [{ t: 'await', c: '#F472B6' }, { t: ' metricflow.protect({', c: '#E5E7EB' }] },
            { indent: 1, segs: [{ t: 'retryWindow:', c: '#93C5FD' }, { t: " '48h'", c: '#FCD34D' }] },
            { indent: 1, segs: [{ t: 'zeroFeeLinks:', c: '#93C5FD' }, { t: ' true', c: '#84CC16' }] },
            { segs: [{ t: '});', c: '#E5E7EB' }] },
          ],
        });
      }
    },
  });
  cue(cut(7), 'basshit');
  cue(cut(7) + 0.1, 'type', { dur: 0.9 });

  // B09 · Scan Grid + Bokeh Floating Action Modal
  add({
    id: 'B09', at: cut(8), cam: [CX, CY], zoom: 0.015, watermark: true,
    note: 'Architectural scan grid -> bokeh action modal',
    draw(lt, d) {
      if (lt < d * 0.5) {
        K.scanGridOverlay({ img: B.imgs.showcase || B.imgs.hero, metricVal: '+38%', metricLabel: 'Recovery lift', scanP: seg(lt, 0, d * 0.5), lt });
      } else {
        const l2 = lt - d * 0.5;
        const clk = seg(l2, d * 0.25, d * 0.45);
        const pos = K.floatingActionModal({
          title: 'RenewalGuard', pillText: 'Public Check', warnText: '2 unpaid renewals detected',
          rowText: 'Enable smart retry links', btnText: 'Apply Fix', btnPressed: Math.sin(clk * Math.PI), t: lt, lt: l2,
        });
        K.cursor(lerp(CX + 180 * U, pos.btnX, eo(seg(l2, 0.05, d * 0.24))), lerp(CY + 140 * U, pos.btnY, eo(seg(l2, 0.05, d * 0.24))), { click: clk });
      }
    },
  });
  cue(cut(8) + 0.9, 'confirm');

  // B10 · Carbon Shield Verification Matrix
  add({
    id: 'B10', at: cut(9), cam: [CX, CY], zoom: 0.02, dark: true, watermark: true,
    note: 'Matte carbon geometric verification grid',
    draw(lt, d) {
      K.matrixGrid({ waveP: seg(lt, 0.05, d * 0.78), glyph: 'shield', activeColor: '#84CC16', lt });
    },
  });
  cue(cut(9), 'matrix', { dur: 1.3 });

  // B11 · Solitary Publish Click -> Quick Final UI
  add({
    id: 'B11', at: cut(10), cam: [CX, CY], zoom: 0.02,
    note: 'Centered Publish capsule click -> live product reveal',
    draw(lt, d) {
      if (lt < d * 0.55) {
        const clk = seg(lt, d * 0.28, d * 0.48);
        K.solitaryPublishBtn({ label: 'Publish', pressed: Math.sin(clk * Math.PI), lt });
        K.cursor(lerp(CX + 220 * U, CX + 18 * U, eo(seg(lt, 0.08, d * 0.28))), lerp(CY + 160 * U, CY + 8 * U, eo(seg(lt, 0.08, d * 0.28))), { click: clk });
      } else {
        K.macroStageBleed(B.imgs.hero || B.imgs.showcase, { zoom: lerp(1.04, 1.12, lt / d), panY: 0.22 });
      }
    },
  });
  cue(cut(10) + 0.65, 'click', { gain: 0.92 });
  cue(cut(10) + 1.25, 'pop');

  // B12 · Capsule Endcard
  add({
    id: 'B12', at: cut(11), cam: [CX, CY], zoom: 0.012,
    note: 'Brand wordmark -> hairline capsule mantra',
    draw(lt) {
      K.capsuleEndcard({ lt, tagline: 'Keep what you earned.', splitAt: 1.4 });
    },
  });
  cue(cut(11) + 1.4, 'chime', { gain: 0.75 });

  return { shots: S, cues: CUES };
}
