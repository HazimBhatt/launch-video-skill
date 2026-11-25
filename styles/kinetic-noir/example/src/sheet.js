// Renders kinetic-noir/style-sheet.png (1920x1080) using the style's own code and real captures!
import { W, H, setAspect, setCtx, ctx, rr, circle, rgba } from './core/lib.js';
import { B, loadBrand } from './core/brand.js';
import { makeStage3D } from './core/engine3d.js';
import * as K from './core/kit.js';

const cv = document.getElementById('cv');
const gl = document.getElementById('gl');
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

    const E3D = makeStage3D(gl, { w: 960, h: 540, accent: B.accentBright, bg: B.bg });
    E3D.render({ img: B.imgs.hero, rotY: -0.26, rotX: 0.08, cardX: 0, cardY: 0.05, camPos: [0, 0.25, 4.9], bloomStrength: 0.35 });

    // Background
    c.fillStyle = '#090A0F';
    c.fillRect(0, 0, 1920, 1080);

    // Header
    c.fillStyle = '#F8FAFC';
    c.font = '900 40px Inter, sans-serif';
    c.textAlign = 'left';
    c.fillText('KINETIC NOIR · LAUNCH VIDEO STYLE SHEET', 54, 62);
    c.fillStyle = '#94A3B8';
    c.font = '800 22px Inter, sans-serif';
    c.textAlign = 'right';
    c.fillText('LINEAR / VERCEL MOTION · BEATS OR NARRATED · 16:9 & 9:16', 1866, 60);

    const panel = (x, y, w, h, title) => {
      rr(x, y, w, h, 18);
      c.fillStyle = '#11131D';
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = 'rgba(255,255,255,0.12)';
      c.stroke();
      c.fillStyle = '#818CF8';
      c.font = '800 18px Inter, sans-serif';
      c.textAlign = 'left';
      c.fillText(title, x + 22, y + 34);
    };

    // 1. HERO FRAME (3D Stage preview)
    panel(48, 92, 620, 460, '1. 3D HERO STAGE + BRAND GLOW');
    c.save();
    rr(68, 148, 580, 326, 12);
    c.clip();
    c.drawImage(gl, 68, 148, 580, 326);
    c.restore();
    c.fillStyle = '#CBD5E1';
    c.font = '800 16px Inter, sans-serif';
    c.textAlign = 'left';
    c.fillText('Probed URL capture floated on Three.js studio floor', 70, 522);

    // 2. ADAPTIVE BRAND PALETTE & TYPOGRAPHY
    panel(690, 92, 570, 460, '2. AUTO-PROBED BRAND PALETTE');
    const swatches = [
      ['OBSIDIAN BG', B.bg],
      ['SURFACE', B.surface],
      ['BRAND ACCENT', B.accent],
      ['BRIGHT GLOW', B.accentBright],
      ['TEXT', B.text],
      ['DANGER', '#EF4444'],
    ];
    swatches.forEach(([lbl, hex], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const sx = 716 + col * 176, sy = 156 + row * 124;
      rr(sx, sy, 156, 74, 12);
      c.fillStyle = hex;
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.2)';
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = '#E2E8F0';
      c.font = '800 13px Inter, sans-serif';
      c.textAlign = 'left';
      c.fillText(lbl, sx, sy + 94);
      c.fillStyle = '#94A3B8';
      c.font = '700 13px FreeMono, monospace';
      c.fillText(hex, sx, sy + 112);
    });
    c.fillStyle = '#E2E8F0';
    c.font = '900 32px Inter, sans-serif';
    c.fillText('Inter Black · Tight -0.035em', 716, 462);
    c.fillStyle = '#94A3B8';
    c.font = '700 18px FreeMono, monospace';
    c.fillText('Injects probed brand font + accent automatically', 716, 502);

    // 3. COMPONENT ZOO
    panel(1282, 92, 590, 460, '3. MOTION COMPONENT ZOO');
    c.save();
    c.translate(1310, 150);
    c.scale(0.32, 0.32);
    K.browserFrame(B.imgs.showcase, { x: 0, y: 0, w: 1200, h: 660, url: 'branchbox.dev', spotlight: [0.04, 0.2, 0.48, 0.45, 0.9] });
    K.cursor(450, 290, { click: 0.45, label: '380ms' });
    c.restore();
    c.save();
    c.translate(1730, 235);
    c.scale(0.45, 0.45);
    K.bentoCard({ x: -240, y: -120, w: 480, h: 240, label: 'LATENCY', value: '380ms', sub: 'Copy-on-Write', highlight: true });
    c.restore();
    c.save();
    c.translate(1575, 445);
    c.scale(0.72, 0.72);
    K.painCard('Migration Conflict', 'ERROR 500 · schema drift', { x: 0, y: 0, w: 660, badgeText: 'CONFLICT' });
    c.restore();

    // 4. RESPONSIVE SCENES
    panel(48, 574, 1180, 458, '4. SCENES & DUAL-ASPECT ADAPTATION (16:9 + 9:16)');
    const sceneCards = [
      ['(A) PAIN STACK', '#18131A', 'Chaos cards jitter & wipe'],
      ['(B) 3D STUDIO SLAB', '#101426', 'Real screenshot + bloom'],
      ['(C) SPOTLIGHT ZOOM', '#0E1722', 'Spring cursor + click'],
      ['(D) BENCHMARK + CTA', '#131628', 'Bento proof + command'],
    ];
    sceneCards.forEach(([t, bg, sub], i) => {
      const sx = 72 + i * 284, sy = 640;
      rr(sx, sy, 264, 340, 14);
      c.fillStyle = bg;
      c.fill();
      c.strokeStyle = i === 1 ? B.accentBright : 'rgba(255,255,255,0.12)';
      c.lineWidth = i === 1 ? 2 : 1;
      c.stroke();
      c.fillStyle = '#F8FAFC';
      c.font = '900 18px Inter, sans-serif';
      c.textAlign = 'left';
      c.fillText(t, sx + 18, sy + 286);
      c.fillStyle = '#94A3B8';
      c.font = '700 15px Inter, sans-serif';
      c.fillText(sub, sx + 18, sy + 314);
      if (B.imgs.hero && i === 1) {
        c.save(); rr(sx + 16, sy + 20, 232, 160, 8); c.clip(); c.drawImage(B.imgs.hero, sx + 16, sy + 20, 232, 160); c.restore();
      } else if (B.imgs.showcase && i === 2) {
        c.save(); rr(sx + 16, sy + 20, 232, 160, 8); c.clip(); c.drawImage(B.imgs.showcase, sx + 16, sy + 20, 232, 160); c.restore();
      } else {
        circle(sx + 132, sy + 110, 42, rgba(B.accentBright, 0.25));
      }
    });

    // 5. CONVERSION & MOTION RULES
    panel(1250, 574, 622, 458, '5. GROWTH-ENGINEER RULES');
    const rules = [
      '1. Never open on a logo: start on status-quo pain.',
      '2. Real UI captures from URL — zero generic stock shapes.',
      '3. Beat-locked cuts (124 BPM) OR Kokoro/mic narration.',
      '4. Spring cursor physics + click ripples guide eye focus.',
      '5. Hard numbers over adjectives ("380ms vs 18m").',
      '6. Crisp CTA endcard with exact CLI / domain + click.',
    ];
    c.textAlign = 'left';
    rules.forEach((r, i) => {
      c.fillStyle = i % 2 === 0 ? '#F8FAFC' : '#CBD5E1';
      c.font = '800 20px Inter, sans-serif';
      c.fillText(r, 1278, 650 + i * 58);
    });

    window.OP.ready = true;
  } catch (e) {
    window.OP.bootError = String(e.stack || e);
  }
})();
