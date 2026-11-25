// Renders bento-proof/style-sheet.png (1920x1080)
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
      document.fonts.load('700 32px FreeMono'),
    ]).catch(() => {});
    await loadBrand('light');

    c.fillStyle = '#F4F4F7';
    c.fillRect(0, 0, 1920, 1080);

    c.fillStyle = '#111827';
    c.font = '900 38px Inter, sans-serif';
    c.textAlign = 'left';
    c.fillText('BENTO PROOF · SWISS GRID STYLE SHEET', 54, 62);
    c.fillStyle = '#4B5563';
    c.font = '800 20px Inter, sans-serif';
    c.textAlign = 'right';
    c.fillText('SWISS LIGHT · SPARKLINES + QUOTES + PRICE ANCHOR', 1866, 60);

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

    // 1. SPARKLINE BENTO TILE
    panel(48, 92, 620, 460, '1. SPARKLINE RESULT TILE');
    c.save();
    K.bentoTile({
      x: 76, y: 148, w: 564, h: 378,
      label: 'RECOVERED MRR / MO',
      value: '+$1,420/mo',
      sub: 'Live rolling count-up + trend curve',
      spark: [12, 18, 22, 35, 42, 60, 74, 96, 118, 142],
      sparkP: 1,
    });
    c.restore();

    // 2. PRICE ANCHOR CARD
    panel(690, 92, 570, 460, '2. STRIKETHROUGH PRICE ANCHOR');
    c.save();
    c.translate(716, 148);
    c.scale(0.86, 0.72);
    K.priceAnchorCard({
      x: 0, y: 0, w: 604, h: 525,
      oldItems: [['Enterprise Churn BI', '$149/mo'], ['Dunning Add-on', '$59/mo'], ['Webhook Glue', '$40/mo']],
      oldTotal: '$248/mo', newPrice: '$19/mo', newNote: 'Flat indie rate · Zero seat fees', strikeT: 1,
    });
    c.restore();

    // 3. REAL UI IN SWISS FRAME
    panel(1282, 92, 590, 460, '3. LIVE PRODUCT TILE + FOCUS');
    c.save();
    c.translate(1308, 150);
    c.scale(0.42, 0.52);
    K.browserFrame(B.imgs.showcase || B.imgs.hero, { x: 0, y: 0, w: 1280, h: 660, url: 'metricflow.io/playbooks', spotlight: [0.46, 0.2, 0.5, 0.52, 0.9] });
    K.cursor(920, 260, { click: 0.45, label: 'Sent ✓' });
    c.restore();

    // 4. FOUNDER PROOF + ACCENT BENTO
    panel(48, 574, 1180, 458, '4. VERIFIED FOUNDER QUOTE + HIGH-CONTRAST METRIC CELLS');
    c.save();
    K.quoteCard({
      x: 78, y: 636, w: 590, h: 360,
      resultPill: 'SAVED $1,840 MRR · 30 DAYS',
      quote: 'MetricFlow caught 11 annual cancellations before renewal. Paid for itself 90x over.',
      author: 'Maya Lin', role: 'Founder, RelayDocs',
    });
    K.bentoTile({ x: 694, y: 636, w: 245, h: 360, label: 'WIN-BACK RATE', value: '38%', accent: true, sub: 'Personal plain-text triggers' });
    K.bentoTile({ x: 960, y: 636, w: 245, h: 360, label: 'SETUP TIME', value: '90s', sub: 'Read-only Stripe OAuth' });
    c.restore();

    // 5. CONVERSION & DESIGN RULES
    panel(1250, 574, 622, 458, '5. BENTO CONVERSION RULES');
    const rules = [
      '1. Lead with money/time outcome (+$1,420 MRR) in frame 1.',
      '2. Snap modular cells cleanly onto 118 BPM beat grid.',
      '3. Use real customer quotes with dollar results, never 5 stars.',
      '4. Slash bloated multi-tool stack price right before CTA.',
      '5. Embed real scraped product screenshots inside Swiss tiles.',
      '6. Risk-reversal CTA button + cursor click closes cleanly.',
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
