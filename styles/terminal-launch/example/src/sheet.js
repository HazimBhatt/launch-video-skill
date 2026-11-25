// Renders terminal-launch/style-sheet.png (1920x1080)
import { setAspect, setCtx, rr, rgba } from './core/lib.js';
import { B, loadBrand } from './core/brand.js';
import * as K from './core/kit.js';

const cv = document.getElementById('cv');
const c = cv.getContext('2d');
setCtx(c);
setAspect('16:9');
window.OP = { ready: false };

(async () => {
  try {
    await Promise.all([
      document.fonts.load('900 96px Inter'),
      document.fonts.load('800 48px Inter'),
      document.fonts.load('700 32px FreeMono'),
    ]).catch(() => {});
    await loadBrand('dark');

    c.fillStyle = '#07090E';
    c.fillRect(0, 0, 1920, 1080);

    c.fillStyle = '#F8FAFC';
    c.font = '900 40px Inter, sans-serif';
    c.textAlign = 'left';
    c.fillText('TERMINAL LAUNCH · DEVTOOL / CLI STYLE SHEET', 54, 62);
    c.fillStyle = '#94A3B8';
    c.font = '700 20px FreeMono, monospace';
    c.textAlign = 'right';
    c.fillText('PHOSPHOR CARBON · LIVE CLI + DIFF + UI · NARRATED OR BEATS', 1866, 60);

    const panel = (x, y, w, h, title) => {
      rr(x, y, w, h, 18);
      c.fillStyle = '#0D111C';
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = 'rgba(255,255,255,0.12)';
      c.stroke();
      c.fillStyle = '#34D399';
      c.font = '700 17px FreeMono, monospace';
      c.textAlign = 'left';
      c.fillText(title, x + 22, y + 32);
    };

    // 1. LIVE TERMINAL
    panel(48, 92, 620, 460, '1. LIVE ANIMATED CLI WINDOW');
    c.save();
    c.translate(72, 148);
    c.scale(0.5, 0.72);
    K.terminalWindow({
      x: 0, y: 0, w: 1140, h: 480,
      title: 'zsh · ~/app',
      lt: 3.5, t: 1.0, fontScale: 1.15,
      items: [
        { at: 0, kind: 'cmd', text: 'npx tracepulse init --edge' },
        { at: 0.5, kind: 'ok', text: '✓ Instrumented 14 API routes' },
        { at: 0.9, kind: 'err', text: 'POST /api/webhooks  500  [tr_9f3c]' },
        { at: 1.2, kind: 'accent', text: '↳ Replay ready in 1.8ms overhead' },
      ],
    });
    c.restore();
    c.fillStyle = '#94A3B8';
    c.font = '700 16px Inter, sans-serif';
    c.fillText('Keystroke-synced CLI + ANSI stdout + type/chime SFX', 72, 522);

    // 2. CODE DIFF COLLAPSE
    panel(690, 92, 570, 460, '2. BOILERPLATE -> 3-LINE SDK DIFF');
    c.save();
    c.translate(714, 148);
    c.scale(0.47, 0.72);
    K.codeDiff({
      x: 0, y: 0, w: 1110, h: 460,
      title: 'route.ts',
      beforeLines: ['const raw = await req.text();', 'logger.info({ id, ts });', 'await saveDebugBlob(headers);'],
      afterLines: ["import { trace } from 'tracepulse';", 'export const POST = trace(handler);'],
      collapseT: 0.85,
    });
    c.restore();
    c.fillStyle = '#94A3B8';
    c.font = '700 16px Inter, sans-serif';
    c.fillText('Visually proves integration speed without reading docs', 714, 522);

    // 3. REAL UI TRACE INSPECTOR
    panel(1282, 92, 590, 460, '3. TRACE REPLAY UI + CURSOR');
    c.save();
    c.translate(1308, 150);
    c.scale(0.42, 0.52);
    K.browserFrame(B.imgs.showcase || B.imgs.hero, { x: 0, y: 0, w: 1280, h: 660, url: 'tracepulse.dev/traces/tr_9f3c', spotlight: [0.02, 0.2, 0.52, 0.5, 0.9] });
    K.cursor(440, 260, { click: 0.4, label: 'Replay ✓' });
    c.restore();
    c.fillStyle = '#94A3B8';
    c.font = '700 16px Inter, sans-serif';
    c.fillText('Real scraped UI capture + spotlight mask + click', 1308, 522);

    // 4. BENCHMARK & PROOF
    panel(48, 574, 1180, 458, '4. BENCHMARK PROOF & DUAL-MODE TIMING');
    c.save();
    K.benchmarkBars({
      x: 84, y: 660, w: 540, p: 1,
      bars: [
        { label: 'Legacy Collector + Sidecar', val: '142 ms', pct: 0.92, color: '#EF4444' },
        { label: 'TracePulse Edge SDK', val: '1.8 ms', pct: 0.08, color: '#34D399', highlight: true },
      ],
    });
    K.bentoCard({ x: 668, y: 642, w: 250, h: 210, label: 'OVERHEAD', value: '1.8 ms', sub: 'Async batched ring', highlight: true });
    K.bentoCard({ x: 938, y: 642, w: 250, h: 210, label: 'YAML CONFIG', value: '0 lines', sub: 'Auto OTLP export', highlight: false });
    c.fillStyle = '#CBD5E1';
    c.font = '700 18px FreeMono, monospace';
    c.fillText('✓ KOKORO VOICE + WHISPER CAPTIONS   ✓ OR 126 BPM BEATS   ✓ 16:9 & 9:16', 84, 975);
    c.restore();

    // 5. DEVTOOL LAUNCH RULES
    panel(1250, 574, 622, 458, '5. DEVTOOL CONVERSION RULES');
    const rules = [
      '1. Lead with exact dev workflow friction (40m log grep).',
      '2. Show real copy-pasteable SDK / CLI syntax immediately.',
      '3. Pair terminal output with live Web UI trace proof.',
      '4. Quantify overhead in ms/KB — devs reject hype words.',
      '5. Keep bottom safe zone clear for synced captions.',
      '6. End with exact `npx` command + free tier offer.',
    ];
    c.textAlign = 'left';
    rules.forEach((r, i) => {
      c.fillStyle = i % 2 === 0 ? '#F8FAFC' : '#CBD5E1';
      c.font = '800 19px Inter, sans-serif';
      c.fillText(r, 1278, 646 + i * 58);
    });

    window.OP.ready = true;
  } catch (e) {
    window.OP.bootError = String(e.stack || e);
  }
})();
