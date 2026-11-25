// Renders macro-studio/style-sheet.png (1920x1080)
import { setAspect, setCtx, rr } from './core/lib.js';
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
      document.fonts.load('600 48px "DM Sans"'),
      document.fonts.load('500 28px Inter'),
      document.fonts.load('600 32px Inter'),
      document.fonts.load('700 36px Inter'),
      document.fonts.load('500 20px "JetBrains Mono"'),
      document.fonts.load('700 24px "JetBrains Mono"'),
    ]).catch(() => {});
    await loadBrand('light');

    K.sandBg(0);
    c.fillStyle = '#141413';
    c.font = '700 34px "DM Sans", Inter, sans-serif';
    c.textAlign = 'left';
    c.fillText('MACRO STUDIO · APPLE / BASE44 PACING STYLE SHEET', 54, 60);
    c.fillStyle = '#57534E';
    c.font = '500 17px "JetBrains Mono", monospace';
    c.textAlign = 'right';
    c.fillText('1 FOCUS PER BEAT · ALABASTER + CARBON + BOKEH · SFX-ONLY VO READY', 1866, 58);

    const cell = (x, y, w, h, title, dark = false) => {
      rr(x, y, w, h, 20);
      c.fillStyle = dark ? '#161719' : '#FFFFFF';
      c.fill();
      c.lineWidth = 1.4;
      c.strokeStyle = 'rgba(20,20,19,0.12)';
      c.stroke();
      c.fillStyle = dark ? '#E5E7EB' : '#57534E';
      c.font = '500 15px "JetBrains Mono", monospace';
      c.textAlign = 'left';
      c.fillText(title, x + 22, y + 32);
    };

    // 1. Solitary prompt
    cell(48, 92, 590, 440, '1. SOLITARY INPUT STUDIO');
    c.save(); c.beginPath(); rr(54, 140, 578, 380, 14); c.clip();
    c.translate(343, 330); c.scale(0.56, 0.56); c.translate(-960, -540);
    K.sandBg(0);
    K.solitaryPromptCard({ typed: 'I want to enter a fair 1v1 battle for...', pressed: 0.4 });
    c.restore();

    // 2. Bokeh floating modal
    cell(664, 92, 592, 440, '2. BOKEH FLOATING ACTION');
    c.save(); c.beginPath(); rr(670, 140, 580, 380, 14); c.clip();
    c.translate(960, 330); c.scale(0.56, 0.56); c.translate(-960, -540);
    K.floatingActionModal({ title: 'Fair Match Ready', pillText: 'Zero Bias', warnText: 'Matched in 4 hours', rowText: 'Lock 48h 1v1 stage', btnText: 'Enter Arena' });
    c.restore();

    // 3. Matte Carbon Terminal
    cell(1282, 92, 590, 440, '3. CARBON TERMINAL / MATRIX', true);
    c.save(); c.beginPath(); rr(1288, 140, 578, 380, 14); c.clip();
    c.translate(1577, 330); c.scale(0.56, 0.56); c.translate(-960, -540);
    K.terminalTypeScreen({ tokens: [{ text: '→', color: '#84CC16' }, { text: 'git', color: '#fff' }, { text: 'push', color: '#F59E0B' }] });
    c.restore();

    // 4. Pill Morph + Capsule Lockup
    cell(48, 558, 900, 474, '4. MORPH PILLS & HAIRLINE CAPSULE ENDCARD');
    c.save(); c.beginPath(); rr(54, 606, 888, 414, 14); c.clip();
    c.translate(498, 750); c.scale(0.58, 0.58); c.translate(-960, -540);
    K.morphConnector({ leftText: 'Submit URL', rightText: '1v1 Arena', glyph: 'swords', openP: 1 });
    c.restore();
    c.save(); c.beginPath(); rr(54, 830, 888, 190, 14); c.clip();
    c.translate(498, 925); c.scale(0.62, 0.62); c.translate(-960, -540);
    K.capsuleEndcard({ lt: 2.8, tagline: 'Win on product.', splitAt: 1.0 });
    c.restore();

    // 5. Pacing rules
    cell(974, 558, 898, 474, '5. MACRO STUDIO DIRECTOR RULES');
    const rules = [
      '1. ONE undivided hero subject per cut (zero 4-box clutter).',
      '2. Fast 1.3s-2.6s beats (12-16 scenes) tuned for external VO.',
      '3. Alternate Sand (#EFECE6) -> Full-Bleed -> Carbon (#161719) -> Bokeh.',
      '4. Every transition earned by cursor click, keystrokes, or smear.',
      '5. Zero pulse dots, zero AI sparkles, zero generic claims.',
      '6. Auto-export timed data/voiceover-script.md + SFX-only MP4.',
    ];
    c.textAlign = 'left';
    rules.forEach((r, i) => {
      c.fillStyle = i % 2 === 0 ? '#141413' : '#57534E';
      c.font = '600 21px "DM Sans", Inter, sans-serif';
      c.fillText(r, 1004, 636 + i * 62);
    });

    window.OP.ready = true;
  } catch (e) {
    window.OP.bootError = String(e.stack || e);
  }
})();
