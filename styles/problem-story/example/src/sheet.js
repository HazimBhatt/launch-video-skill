// Renders problem-story/style-sheet.png (1920x1080)
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
      document.fonts.load('900 96px Inter'),
      document.fonts.load('800 48px Inter'),
      document.fonts.load('italic 700 84px Caladea'),
      document.fonts.load('700 32px FreeMono'),
    ]).catch(() => {});
    await loadBrand('light');

    c.fillStyle = '#F7F5EE';
    c.fillRect(0, 0, 1920, 1080);

    c.fillStyle = '#111827';
    c.font = '900 40px Inter, sans-serif';
    c.textAlign = 'left';
    c.fillText('PROBLEM STORY · EDITORIAL FOUNDER STYLE SHEET', 54, 62);
    c.fillStyle = '#4B5563';
    c.font = '800 21px Inter, sans-serif';
    c.textAlign = 'right';
    c.fillText('WARM STONE + SERIF ACCENTS · VECTOR CHAOS TO REAL UI', 1866, 60);

    const panel = (x, y, w, h, title) => {
      rr(x, y, w, h, 18);
      c.fillStyle = '#FFFFFF';
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = 'rgba(17,24,39,0.12)';
      c.stroke();
      c.fillStyle = B.accent;
      c.font = '800 18px Inter, sans-serif';
      c.textAlign = 'left';
      c.fillText(title, x + 22, y + 34);
    };

    // 1. VECTOR CHAOS SCENE
    panel(48, 92, 620, 460, '1. VECTOR STORYTELLING PAIN SCENE');
    c.save();
    K.clockBadge(585, 195, 42, 0.4, 11.8);
    K.chaosCard('SLACK', '38 unread #client threads', 'Was Tuesday deploy billed?', { x: 350, y: 270, w: 500, rot: -0.025, tint: '#E11D48' });
    K.chaosCard('SHEETS', 'Invoice_FINAL_v7.xlsx', '#REF! Formula error', { x: 360, y: 405, w: 500, rot: 0.02, tint: '#D97706' });
    c.restore();

    // 2. BEFORE / AFTER WIPER
    panel(690, 92, 570, 460, '2. BEFORE -> AFTER SPLIT WIPER');
    c.save();
    c.translate(716, 150);
    c.scale(0.45, 0.56);
    K.splitCompare({
      x: 0, y: 0, w: 1140, h: 610, split: 0.42,
      afterImg: B.imgs.hero,
      drawBefore: (bx, by, bw, bh) => {
        c.fillStyle = '#FEF2F2'; c.fillRect(bx, by, bw, bh);
        c.fillStyle = '#991B1B'; c.font = '700 22px FreeMono';
        c.fillText('commit 8f21: bug work (~3h?)', bx + 36, by + 90);
        c.fillText('[Slack] forgot billing rate', bx + 36, by + 160);
        c.fillText('Invoice_v7_FINAL_REAL.csv', bx + 36, by + 230);
      },
    });
    c.restore();
    c.fillStyle = '#4B5563';
    c.font = '700 16px Inter, sans-serif';
    c.fillText('Dramatic draggable wipe into scraped product UI', 716, 522);

    // 3. ANNOTATED PRODUCT WORKFLOW
    panel(1282, 92, 590, 460, '3. WORKFLOW UI + POINTER CALLOUTS');
    c.save();
    c.translate(1308, 150);
    c.scale(0.42, 0.52);
    K.browserFrame(B.imgs.showcase || B.imgs.hero, { x: 0, y: 0, w: 1280, h: 660, url: 'invoicesnap.co/inv_209', spotlight: [0.55, 0.18, 0.42, 0.55, 0.9] });
    K.pointerTag(360, 290, 170, 530, 'Auto-grouped commits', 1);
    K.cursor(980, 200, { click: 0.45, label: 'Send Link ✓' });
    c.restore();

    // 4. TYPOGRAPHY & RELIEF METRICS
    panel(48, 574, 1180, 458, '4. EDITORIAL TYPE + RELIEF METRIC CARDS');
    c.save();
    K.editorialTitle(['Messy Friday out.', '*Paid fast* in.'], { x: 345, y: 740, size: 58, lt: 2, maxW: 540 });
    K.bentoCard({ x: 640, y: 650, w: 265, h: 295, label: 'OLD FRIDAY', value: '1h 55m', sub: 'Chasing Slack & CSV', highlight: false });
    K.bentoCard({ x: 930, y: 650, w: 265, h: 295, label: 'INVOICESNAP', value: '12 sec', sub: 'Stripe link sent', highlight: true });
    c.restore();

    // 5. CONVERSION STORYTELLING RULES
    panel(1250, 574, 622, 458, '5. FOUNDER STORYTELLING RULES');
    const rules = [
      '1. Start inside the human friction (late hour, messy tabs).',
      '2. Contrast geometric Inter with warm serif *italics*.',
      '3. Reveal product via Before/After wipe — earn the click.',
      '4. Use pointer annotations to explain complex SaaS screens.',
      '5. Keep outlined gold captions clean in safe bottom zone.',
      '6. Quantify hours & speed gained before asking for signup.',
    ];
    c.textAlign = 'left';
    rules.forEach((r, i) => {
      c.fillStyle = i % 2 === 0 ? '#111827' : '#4B5563';
      c.font = '800 19px Inter, sans-serif';
      c.fillText(r, 1278, 646 + i * 58);
    });

    window.OP.ready = true;
  } catch (e) {
    window.OP.bootError = String(e.stack || e);
  }
})();
