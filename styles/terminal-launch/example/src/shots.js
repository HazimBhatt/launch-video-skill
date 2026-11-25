// TERMINAL LAUNCH EXAMPLE: TracePulse (tracepulse.dev) — Narrated + Word Captions + Live CLI & Real Web UI
import { ctx, W, H, CX, CY, U, PORTRAIT, LOUT, clamp, lerp, seg, eo, eio, spring } from './core/lib.js';
import { B } from './core/brand.js';
import { L, beatPulse } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots(E3D) {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);

  // ── 1 · HOOK: Brittle logging boilerplate collapses on line 0 ───────────────
  {
    const st = cut(0), end = cut(1), d0 = end - st;
    const beforeLines = [
      'try { const raw = await req.text();',
      '  logger.info("webhook:", { id, ts });',
      '  // missing SQL + Stripe headers...',
      '  await saveDebugBlob(req.headers);',
      '} catch (err) { console.error(err); }',
    ];
    const afterLines = [
      "import { trace } from 'tracepulse';",
      'export const POST = trace(handler);',
    ];
    add({
      id: 'S01', at: st, cam: [CX, CY], zoom: 0.03, flash: false,
      note: 'Hook: manual log debugging code diff',
      draw(lt, d, t) {
        K.terminalGridBg(t, { pulse: beatPulse(t) });
        K.badge('WITHOUT TRACEPULSE', CX, PORTRAIT ? 190 : 105, { scale: spring(lt), dot: false });
        K.kineticTitle(['Stop reading *400 lines', 'of webhook logs.'], {
          x: CX, y: PORTRAIT ? 350 : 225, size: PORTRAIT ? 74 : 78, lt, stagger: 0.05,
        });
        const w = PORTRAIT ? W * 0.9 : 1120 * U;
        const h = PORTRAIT ? 580 : 420;
        const y = PORTRAIT ? 560 : 350;
        K.codeDiff({
          x: CX - w / 2, y, w, h,
          title: 'app/api/webhooks/stripe/route.ts',
          beforeLines, afterLines,
          collapseT: seg(lt, Math.max(1.2, d0 * 0.45), d0 - 0.35),
          scale: lerp(0.9, 1, spring(lt, { stiffness: 240, damping: 22 })),
        });
      },
    });
    cue(st + 0.1, 'snap');
    cue(st + 1.5, 'pop');
    cue(end - 0.45, 'riser', { dur: 0.42 });
  }

  // ── 2 · ONE COMMAND CLI: Typing + Live ANSI Trace Output ──────────────────
  {
    const st = cut(1);
    const termLines = [
      { at: 0.0, kind: 'cmd', text: 'npx tracepulse init --edge', cps: 42 },
      { at: 0.85, kind: 'ok', text: '✓ Instrumented 14 API routes (Next 15)' },
      { at: 1.25, kind: 'accent', text: '✓ Streaming OpenTelemetry -> us-east' },
      { at: 1.75, kind: 'muted', text: '──────────────────────────────────────' },
      { at: 2.0, kind: 'err', text: 'POST /api/webhooks  500  [tr_9f3c]  42ms' },
      { at: 2.5, kind: 'ok', text: '↳ Captured SQL + payload (1.8ms overhead)' },
    ];
    add({
      id: 'S02', at: st, cam: [CX, CY], zoom: 0.025,
      note: '1-command CLI setup + instant telemetry capture',
      draw(lt, d, t) {
        K.terminalGridBg(t, { pulse: beatPulse(t), glowX: CX * 0.85 });
        K.badge('1-LINE SETUP', CX, PORTRAIT ? 190 : 105, { scale: spring(lt), accent: true });
        K.kineticTitle(['One import. *Zero YAML.*'], {
          x: CX, y: PORTRAIT ? 340 : 215, size: PORTRAIT ? 74 : 78, lt, stagger: 0.04,
        });
        const w = PORTRAIT ? W * 0.9 : 1160 * U;
        const h = PORTRAIT ? 620 : 450;
        const y = PORTRAIT ? 540 : 325;
        K.terminalWindow({
          x: CX - w / 2, y, w, h,
          title: 'zsh · ~/projects/saas-app',
          items: termLines,
          lt, t,
          scale: lerp(0.9, 1, spring(lt, { stiffness: 220, damping: 22 })),
        });
      },
    });
    cue(st + 0.14, 'type', { dur: 0.72, gain: 0.85 });
    cue(st + 0.95, 'pop');
    cue(st + 1.35, 'pop');
    cue(st + 2.1, 'alarm', { dur: 0.4, gain: 0.6 });
    cue(st + 2.6, 'chime', { dur: 0.65, gain: 0.8 });
  }

  // ── 3 · SPLIT LIVE TRACE REPLAY + REAL UI CAPTURE ─────────────────────────
  {
    const st = cut(2);
    const clickAtT = 1.05;
    add({
      id: 'S03', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Live Trace Replay inspector: click failing trace -> spotlight SQL timeline',
      draw(lt, d, t) {
        K.terminalGridBg(t, { pulse: beatPulse(t), glowX: CX * 1.25 });
        K.kineticTitle(['Replay prod state *locally.*'], {
          x: CX, y: PORTRAIT ? 185 : 95, size: PORTRAIT ? 66 : 64, lt, stagger: 0.04,
        });

        const uiImg = B.imgs.showcase || B.imgs.hero;
        const fw = PORTRAIT ? W * 0.9 : 1460 * U;
        const fh = PORTRAIT ? H * 0.45 : 670 * U;
        const fx = (W - fw) / 2;
        const fy = PORTRAIT ? 360 : 185;
        const zoomIn = eio(seg(lt, clickAtT + 0.18, clickAtT + 1.0));
        const spotA = eo(seg(lt, clickAtT + 0.12, clickAtT + 0.55));

        K.browserFrame(uiImg, {
          x: fx, y: fy, w: fw, h: fh,
          url: `${B.domain}/traces/tr_9f3c`,
          zoom: lerp(1.0, 1.32, zoomIn),
          panX: lerp(0.5, 0.2, zoomIn),
          panY: lerp(0, 0.25, zoomIn),
          scale: lerp(0.9, 1, spring(lt, { stiffness: 210, damping: 23 })),
          sheenT: seg(lt, 0.2, 1.0),
          spotlight: spotA > 0.01 ? [0.02, 0.2, 0.52, 0.5, spotA] : null,
        });

        const move1 = eio(seg(lt, 0.2, clickAtT));
        const move2 = eio(seg(lt, clickAtT + 0.28, clickAtT + 1.1));
        const bx = fx + fw * 0.88, by = fy + fh * 0.15;
        const tx = fx + fw * 0.34, ty = fy + fh * 0.45;
        const mx = lt < clickAtT + 0.25 ? lerp(fx + fw * 0.4, bx, move1) : lerp(bx, tx, move2);
        const my = lt < clickAtT + 0.25 ? lerp(fy + fh * 0.65, by, move1) : lerp(by, ty, move2);
        K.cursor(mx, my, {
          click: seg(lt, clickAtT, clickAtT + 0.4),
          label: lt > clickAtT + 0.2 ? 'Replaying locally ✓' : 'Replay Locally',
        });
      },
    });
    cue(st, 'whoosh');
    cue(st + clickAtT, 'click', { gain: 0.9 });
    cue(st + clickAtT + 0.18, 'shutter', { gain: 0.7 });
  }

  // ── 4 · BENCHMARK + 3D STAGE PROOF ────────────────────────────────────────
  {
    const st = cut(3);
    add({
      id: 'S04', at: st, cam: [CX, CY], zoom: 0.025,
      note: '1.8ms OTel overhead benchmark + Bento stats',
      draw(lt, d, t) {
        K.terminalGridBg(t, { pulse: beatPulse(t) });
        const left = LOUT.pane('left'), right = LOUT.pane('right');

        K.badge('PRODUCTION OVERHEAD', PORTRAIT ? CX : left.x, PORTRAIT ? 150 : left.y + 30, {
          scale: spring(lt), accent: true, align: PORTRAIT ? 'center' : 'left',
        });
        K.kineticTitle(['Full OTel. *1.8ms*', 'cold overhead.'], {
          x: PORTRAIT ? CX : left.x, y: PORTRAIT ? 295 : left.y + 185,
          size: PORTRAIT ? 70 : 72, lt: Math.max(0, lt - 0.06),
          align: PORTRAIT ? 'center' : 'left', maxW: left.w,
        });

        const barW = PORTRAIT ? W * 0.84 : left.w * 0.92;
        const barX = PORTRAIT ? (W - barW) / 2 : left.x;
        const barY = PORTRAIT ? 455 : left.y + 375;
        K.benchmarkBars({
          x: barX, y: barY, w: barW, p: seg(lt, 0.3, 1.3),
          bars: [
            { label: 'Legacy Collector + Sidecar', val: '142 ms', pct: 0.94, color: '#EF4444' },
            { label: 'TracePulse Edge SDK', val: '1.8 ms', pct: 0.06, color: '#34D399', highlight: true },
          ],
        });

        const gap = 22 * U;
        const cw = (right.w - gap) / 2, ch = (right.h * (PORTRAIT ? 0.68 : 0.84) - gap) / 2;
        const cards = [
          { x: right.x, y: right.y, w: cw, h: ch, label: 'OVERHEAD', value: '1.8 ms', sub: 'Async batched ring buffer', highlight: true, delay: 0.16 },
          { x: right.x + cw + gap, y: right.y, w: cw, h: ch, label: 'COLLECTOR YAML', value: '0 lines', sub: 'Native OTLP export included', highlight: false, delay: 0.28 },
          { x: right.x, y: right.y + ch + gap, w: right.w, h: ch, label: 'REPLAY ACCURACY', value: '100% deterministic', sub: 'Headers, env & SQL row snapshots sanitized at edge', highlight: false, delay: 0.42 },
        ];
        cards.forEach((c) => K.bentoCard({ ...c, scale: spring(Math.max(0, lt - c.delay), { stiffness: 250, damping: 22 }) }));
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.24, 'snap');
    cue(st + 0.55, 'pop');
  }

  // ── 5 · CONVERSION CTA ENDCARD ───────────────────────────────────────────
  {
    const st = cut(4);
    add({
      id: 'S05', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Conversion CTA endcard above caption zone',
      draw(lt, d, t) {
        K.terminalGridBg(t, { pulse: beatPulse(t), glowY: CY, glowRadius: 0.85 });
        K.ctaEndcard({
          lt,
          tagline: 'Replay prod in 12 seconds.',
          cta: B.copy.ctaPrimary || 'Get Free API Key',
          urlText: `${B.domain} · Free 100k spans/mo`,
          command: B.copy.codeSnippets?.[0] || 'npx tracepulse init',
        });
      },
    });
    cue(st, 'drop', { gain: 0.85 });
    cue(st + 0.85, 'click', { gain: 0.95 });
    cue(st + 0.92, 'chime', { gain: 0.85 });
  }

  return { shots: S, cues: CUES };
}
