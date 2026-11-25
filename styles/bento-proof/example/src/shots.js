// BENTO PROOF EXAMPLE: MetricFlow (metricflow.io) — Swiss Grid + Live Sparklines + Founder Quote + Price Anchor
import { ctx, W, H, CX, CY, U, PORTRAIT, LOUT, clamp, lerp, seg, eo, eio, spring } from './core/lib.js';
import { B } from './core/brand.js';
import { L, beatPulse } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots(E3D) {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);

  // ── 1 · RESULT-FIRST HOOK: Recover silent churn ──────────────────────────
  {
    const st = cut(0), end = cut(1), d0 = end - st;
    const spark = [12, 18, 16, 28, 34, 48, 52, 74, 88, 96, 118, 142];
    add({
      id: 'S01', at: st, cam: [CX, CY], zoom: 0.03, flash: false,
      note: 'Result-first hook: churn recovery sparkline tile + outcome number',
      draw(lt, d, t) {
        K.swissGridBg(t, { pulse: beatPulse(t) });
        const wipe = eo(seg(lt, d0 - 0.24, d0 - 0.01));
        ctx.save();
        ctx.translate(lerp(0, -W * 1.1, wipe), 0);
        K.badge('STRIPE + POSTHOG CHURN RADAR', CX, PORTRAIT ? 200 : 115, { scale: spring(lt), accent: true });
        K.kineticTitle(['Stop losing *23% of MRR*', 'to silent churn.'], {
          x: CX, y: PORTRAIT ? 355 : 235, size: PORTRAIT ? 74 : 82, lt, stagger: 0.05,
        });

        const tw = PORTRAIT ? W * 0.88 : 980 * U;
        const th = PORTRAIT ? 580 : 520;
        const ty = PORTRAIT ? 560 : 375;
        const saved = Math.round(lerp(0, 1420, eo(seg(lt, 0.25, 1.8))));
        K.bentoTile({
          x: CX - tw / 2, y: ty, w: tw, h: th,
          label: 'RECOVERED MRR / MO (MEDIAN SAAS)',
          value: `+$${saved.toLocaleString()}/mo`,
          sub: 'Triggered by failed-payment retries & pre-cancellation behavior alerts',
          spark, sparkP: seg(lt, 0.35, 2.2),
          scale: lerp(0.9, 1, spring(lt, { stiffness: 230, damping: 22 })),
        });
        ctx.restore();
      },
    });
    cue(st + 0.1, 'snap');
    cue(st + 0.45, 'pop');
    cue(end - 0.4, 'riser', { dur: 0.38 });
  }

  // ── 2 · SWISS BENTO GRID ASSEMBLY ────────────────────────────────────────
  {
    const st = cut(1);
    const spark2 = [42, 46, 51, 55, 64, 68, 72];
    add({
      id: 'S02', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Asymmetric 4-cell Swiss Bento with embedded UI + live stats',
      draw(lt, d, t) {
        K.swissGridBg(t, { pulse: beatPulse(t) });
        K.kineticTitle(['Live radar. *One dashboard.*'], {
          x: CX, y: PORTRAIT ? 175 : 95, size: PORTRAIT ? 68 : 66, lt, stagger: 0.04,
        });

        const pad = 64 * U, gap = 22 * U;
        const gx = pad, gy = PORTRAIT ? 310 : 185;
        const gw = W - pad * 2, gh = PORTRAIT ? H - 390 : H - 250;

        const sc1 = lerp(0.88, 1, spring(Math.max(0, lt - 0.02), { stiffness: 260, damping: 22 }));
        const sc2 = lerp(0.88, 1, spring(Math.max(0, lt - 0.14), { stiffness: 260, damping: 22 }));
        const sc3 = lerp(0.88, 1, spring(Math.max(0, lt - 0.24), { stiffness: 260, damping: 22 }));
        const sc4 = lerp(0.88, 1, spring(Math.max(0, lt - 0.34), { stiffness: 260, damping: 22 }));

        if (PORTRAIT) {
          const topH = gh * 0.44;
          K.bentoTile({ x: gx, y: gy, w: gw, h: topH, label: 'REAL PRODUCT UI · RADAR', img: B.imgs.showcase || B.imgs.hero, scale: sc1 });
          const cw = (gw - gap) / 2, midY = gy + topH + gap, midH = (gh - topH - gap * 2) * 0.48;
          K.bentoTile({ x: gx, y: midY, w: cw, h: midH, label: 'WIN-BACK RATE', value: '38%', accent: true, sub: 'Personal plain-text triggers', scale: sc2 });
          K.bentoTile({ x: gx + cw + gap, y: midY, w: cw, h: midH, label: 'SETUP TIME', value: '90s', sub: 'Read-only Stripe OAuth', scale: sc3 });
          K.bentoTile({ x: gx, y: midY + midH + gap, w: gw, h: gh - topH - midH - gap * 2, label: 'SAVED ACCOUNTS', value: '412 SaaS teams', spark: spark2, sparkP: seg(lt, 0.5, 2.2), sub: 'Monitoring $14.2M annualized Stripe MRR', scale: sc4 });
        } else {
          const leftW = gw * 0.56, rightW = gw - leftW - gap;
          K.bentoTile({ x: gx, y: gy, w: leftW, h: gh, label: 'LIVE RADAR UI · CHURN ALERTS', img: B.imgs.hero || B.imgs.showcase, scale: sc1 });
          const topH = gh * 0.46, botH = gh - topH - gap;
          const cw = (rightW - gap) / 2;
          K.bentoTile({ x: gx + leftW + gap, y: gy, w: cw, h: topH, label: 'WIN-BACK RATE', value: '38%', accent: true, sub: 'Plain-text triggers', scale: sc2 });
          K.bentoTile({ x: gx + leftW + gap + cw + gap, y: gy, w: cw, h: topH, label: 'SETUP TIME', value: '90 sec', sub: 'Read-only OAuth', scale: sc3 });
          K.bentoTile({ x: gx + leftW + gap, y: gy + topH + gap, w: rightW, h: botH, label: 'SAVED REVENUE LIFT', value: '+$1,420/mo', spark: spark2, sparkP: seg(lt, 0.5, 2.2), sub: 'Automated dunning + usage dropoff pings', scale: sc4 });
        }
      },
    });
    cue(st, 'drop', { gain: 0.8 });
    cue(st + 0.12, 'pop');
    cue(st + 0.26, 'pop');
    cue(st + 0.4, 'snap');
    cue(st + 0.54, 'pop');
  }

  // ── 3 · UI FOCUS + PLAYBOOK ACTION CLICK ────────────────────────────────
  {
    const st = cut(2);
    const clickAtT = 1.1;
    add({
      id: 'S03', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Real MetricFlow win-back playbook click + spotlight focus',
      draw(lt, d, t) {
        K.swissGridBg(t, { pulse: beatPulse(t) });
        K.kineticTitle(['One click triggers *personal win-backs.*'], {
          x: CX, y: PORTRAIT ? 185 : 98, size: PORTRAIT ? 66 : 64, lt, stagger: 0.04,
        });
        const uiImg = B.imgs.showcase || B.imgs.hero;
        const fw = PORTRAIT ? W * 0.9 : 1440 * U;
        const fh = PORTRAIT ? H * 0.46 : 720 * U;
        const fx = (W - fw) / 2, fy = PORTRAIT ? 390 : 195;
        const zoomIn = eio(seg(lt, clickAtT + 0.16, clickAtT + 1.0));
        const spotA = eo(seg(lt, clickAtT + 0.1, clickAtT + 0.5));

        K.browserFrame(uiImg, {
          x: fx, y: fy, w: fw, h: fh,
          url: `${B.domain}/playbooks/at-risk`,
          zoom: lerp(1, 1.32, zoomIn),
          panX: lerp(0.5, 0.78, zoomIn),
          panY: lerp(0, 0.28, zoomIn),
          scale: lerp(0.9, 1, spring(lt, { stiffness: 210, damping: 23 })),
          sheenT: seg(lt, 0.22, 1.0),
          spotlight: spotA > 0.01 ? [0.46, 0.2, 0.5, 0.52, spotA] : null,
        });

        const mx = lerp(fx + fw * 0.3, fx + fw * 0.8, eio(seg(lt, 0.2, clickAtT)));
        const my = lerp(fy + fh * 0.7, fy + fh * 0.25, eio(seg(lt, 0.2, clickAtT)));
        K.cursor(mx, my, {
          click: seg(lt, clickAtT, clickAtT + 0.4),
          label: lt > clickAtT + 0.2 ? '14 emails sent ✓' : 'Trigger Win-Back',
        });
      },
    });
    cue(st, 'whoosh');
    cue(st + clickAtT, 'click', { gain: 0.9 });
    cue(st + clickAtT + 0.2, 'shutter', { gain: 0.75 });
  }

  // ── 4 · FOUNDER PROOF + STRIKETHROUGH PRICE ANCHORING ───────────────────
  {
    const st = cut(3);
    add({
      id: 'S04', at: st, cam: [CX, CY], zoom: 0.025,
      note: 'Verified testimonial quote + 10x strikethrough pricing anchor',
      draw(lt, d, t) {
        K.swissGridBg(t, { pulse: beatPulse(t) });
        K.kineticTitle(['Replace *$248/mo bloat* for $19.'], {
          x: CX, y: PORTRAIT ? 185 : 105, size: PORTRAIT ? 68 : 70, lt, stagger: 0.04,
        });

        const left = LOUT.pane('left'), right = LOUT.pane('right');
        const cardY = PORTRAIT ? 340 : 210;
        const cardH = PORTRAIT ? 520 : H - 290;

        K.quoteCard({
          x: left.x, y: cardY, w: PORTRAIT ? W - 144 * U : left.w * 1.06, h: PORTRAIT ? 510 : cardH,
          resultPill: 'SAVED $1,840 MRR · 30 DAYS',
          quote: 'MetricFlow caught 11 annual cancellations before their Slack renewal notice even fired. Paid for itself 90x over.',
          author: 'Maya Lin',
          role: 'Founder, RelayDocs ($42k MRR)',
          scale: spring(Math.max(0, lt - 0.12), { stiffness: 230, damping: 22 }),
        });

        K.priceAnchorCard({
          x: PORTRAIT ? right.x : right.x + 28 * U,
          y: PORTRAIT ? 910 : cardY,
          w: PORTRAIT ? W - 144 * U : right.w - 28 * U,
          h: PORTRAIT ? 640 : cardH,
          oldItems: [
            ['Enterprise Churn BI', '$149/mo'],
            ['Dunning Retry Add-on', '$59/mo'],
            ['Webhook Glue & Zapier', '$40/mo'],
          ],
          oldTotal: '$248/mo',
          newPrice: '$19/mo',
          newNote: 'Flat indie rate · Up to $25k MRR',
          strikeT: seg(lt, 0.6, 1.5),
          scale: spring(Math.max(0, lt - 0.28), { stiffness: 230, damping: 22 }),
        });
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.2, 'pop');
    cue(st + 0.65, 'snap');
    cue(st + 1.05, 'chime', { dur: 0.65, gain: 0.75 });
  }

  // ── 5 · CONVERSION CTA ENDCARD ───────────────────────────────────────────
  {
    const st = cut(4);
    add({
      id: 'S05', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Conversion CTA endcard with 14-day risk reversal',
      draw(lt, d, t) {
        K.swissGridBg(t, { pulse: beatPulse(t) });
        K.ctaEndcard({
          lt,
          tagline: 'Keep every customer you earned.',
          cta: B.copy.ctaPrimary || 'Start 14-Day Free Trial',
          urlText: `${B.domain} · 90s Stripe setup · No card needed`,
        });
      },
    });
    cue(st, 'drop', { gain: 0.85 });
    cue(st + 0.85, 'click', { gain: 0.95 });
    cue(st + 0.92, 'chime', { gain: 0.85 });
  }

  return { shots: S, cues: CUES };
}
