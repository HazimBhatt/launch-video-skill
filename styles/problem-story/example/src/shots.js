// PROBLEM STORY EXAMPLE: InvoiceSnap (invoicesnap.co) — Founder Narrative + Before/After Wipe + Real UI Relief
import { ctx, W, H, CX, CY, U, PORTRAIT, LOUT, clamp, lerp, seg, eo, eio, spring, rr } from './core/lib.js';
import { B } from './core/brand.js';
import { L, beatPulse } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots(E3D) {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);

  // ── 1 · HUMAN CHAOS SCENE: Friday 11:48 PM billing nightmare ────────────────
  {
    const st = cut(0), end = cut(1), d0 = end - st;
    const cards = [
      ['SLACK', '38 unread threads in #client-acme', 'Did we bill Tuesday hotspot deploy?', '#E11D48'],
      ['GIT LOG', '27 commits since Nov 1', 'chore: fix stripe webhook + pdf export...', '#EA580C'],
      ['SHEETS', 'Invoice_v7_FINAL_REAL.xlsx', '#REF! Formula error in cell G14', '#D97706'],
    ];
    add({
      id: 'S01', at: st, cam: [CX, CY], zoom: 0.03, flash: false,
      note: 'Founder pain story: Friday 11:48 PM Slack + Git + Sheets chaos',
      draw(lt, d, t) {
        K.paperBg(t, { pulse: beatPulse(t) });
        const wipe = eo(seg(lt, d0 - 0.24, d0 - 0.01));
        ctx.save();
        ctx.translate(lerp(0, -W * 1.1, wipe), 0);
        K.clockBadge(PORTRAIT ? CX : 170 * U, PORTRAIT ? 185 : 155 * U, 52 * U, t, 11.8);
        K.badge('FRIDAY · 11:48 PM', CX, PORTRAIT ? 280 : 115, { scale: spring(lt), dot: false });
        K.editorialTitle(['Unpaid Friday nights', 'chasing *billable hours.*'], {
          x: CX, y: PORTRAIT ? 415 : 230, size: PORTRAIT ? 74 : 78, lt, stagger: 0.05,
        });
        const cardW = PORTRAIT ? W * 0.88 : 780 * U;
        const baseY = PORTRAIT ? 690 : 445;
        cards.forEach(([tag, title, sub, col], i) => {
          const delay = 0.35 + i * 0.45;
          const raw = Math.max(0, lt - delay);
          const sc = lerp(0.88, 1, spring(raw, { stiffness: 260, damping: 20 }));
          const a = clamp(raw * 9);
          const jit = Math.sin(t * 24 + i * 2) * 2 * (1 - wipe);
          K.chaosCard(tag, title, sub, {
            x: CX + jit, y: baseY + i * 130 * U, w: cardW,
            rot: (i - 1) * 0.02 + Math.sin(t * 2.5 + i) * 0.006,
            scale: sc, alpha: a, tint: col,
          });
        });
        ctx.restore();
      },
    });
    cue(st + 0.1, 'tock');
    cue(st + 0.4, 'pop');
    cue(st + 0.85, 'pop');
    cue(st + 1.35, 'alarm', { dur: 0.8, gain: 0.55 });
    cue(end - 0.45, 'riser', { dur: 0.42 });
  }

  // ── 2 · BEFORE -> AFTER WIPE INTO REAL UI CAPTURE ──────────────────────────
  {
    const st = cut(1), end = cut(2), d0 = end - st;
    const drawMessy = (bx, by, bw, bh) => {
      ctx.fillStyle = '#FEF2F2';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#991B1B';
      ctx.font = `700 ${Math.round(20 * U)}px FreeMono, monospace`;
      ctx.textAlign = 'left';
      const rawLines = [
        'commit 8f21a: fix auth redirect (2.5h?)',
        '[Slack #ops] Alex: sent updated logo PNG',
        'CSV export row 19: "misc bug work" $???',
        'commit c901d: stripe idempotency key',
        'Reminder: invoice overdue 4 days (?!)',
        'Total hours: ~18.5h ??? verify calendar',
      ];
      rawLines.forEach((ln, i) => {
        ctx.fillStyle = i % 2 ? '#B91C1C' : '#7F1D1D';
        ctx.fillText(ln, bx + 42 * U, by + 64 * U + i * 54 * U);
      });
    };

    add({
      id: 'S02', at: st, cam: [CX, CY], zoom: 0.025,
      note: 'Interactive Before/After divider sweeps across messy commits into clean UI capture',
      draw(lt, d, t) {
        K.paperBg(t, { pulse: beatPulse(t) });
        K.editorialTitle(['Messy week in.', '*Clean invoice* out.'], {
          x: CX, y: PORTRAIT ? 190 : 100, size: PORTRAIT ? 70 : 68, lt, stagger: 0.04,
        });
        const fw = PORTRAIT ? W * 0.9 : 1380 * U;
        const fh = PORTRAIT ? H * 0.44 : 620 * U;
        const splitPos = lerp(0.84, 0.14, eio(seg(lt, 0.45, Math.min(2.6, d0 - 0.5))));
        K.splitCompare({
          x: (W - fw) / 2, y: PORTRAIT ? 375 : 190, w: fw, h: fh,
          split: splitPos,
          afterImg: B.imgs.hero || B.imgs.showcase,
          drawBefore: drawMessy,
          scale: lerp(0.9, 1, spring(lt, { stiffness: 220, damping: 22 })),
        });
      },
    });
    cue(st, 'drop', { gain: 0.85 });
    cue(st + 0.5, 'swoosh', { gain: 0.75 });
  }

  // ── 3 · LIVE WORKFLOW + POINTER ANNOTATIONS ──────────────────────────────
  {
    const st = cut(2);
    const clickAtT = 1.35;
    add({
      id: 'S03', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Real InvoiceSnap UI builder + pointer annotations + Send Stripe link click',
      draw(lt, d, t) {
        K.paperBg(t, { pulse: beatPulse(t) });
        K.editorialTitle(['Verified lines. *One click* to pay.'], {
          x: CX, y: PORTRAIT ? 185 : 95, size: PORTRAIT ? 66 : 64, lt, stagger: 0.04,
        });

        const uiImg = B.imgs.showcase || B.imgs.hero;
        const fw = PORTRAIT ? W * 0.9 : 1420 * U;
        const fh = PORTRAIT ? H * 0.44 : 635 * U;
        const fx = (W - fw) / 2, fy = PORTRAIT ? 355 : 185;
        const zoomIn = eio(seg(lt, clickAtT + 0.2, clickAtT + 1.0));
        const spotA = eo(seg(lt, clickAtT + 0.12, clickAtT + 0.5));

        K.browserFrame(uiImg, {
          x: fx, y: fy, w: fw, h: fh,
          url: `${B.domain}/invoices/inv_209`,
          zoom: lerp(1, 1.24, zoomIn),
          panX: lerp(0.5, 0.78, zoomIn),
          panY: lerp(0, 0.22, zoomIn),
          scale: lerp(0.9, 1, spring(lt, { stiffness: 210, damping: 23 })),
          sheenT: seg(lt, 0.25, 1.0),
          spotlight: spotA > 0.01 ? [0.5, 0.22, 0.46, 0.62, spotA] : null,
        });

        // Clean callout pointer before click zooms in
        if (lt > 0.35 && lt < clickAtT + 0.35) {
          K.pointerTag(fx + fw * 0.28, fy + fh * 0.46, fx + fw * 0.14, fy + fh * 0.84, 'Auto-grouped Git commits', seg(lt, 0.35, 0.85));
        }

        const mx = lerp(fx + fw * 0.35, fx + fw * 0.87, eio(seg(lt, 0.25, clickAtT)));
        const my = lerp(fy + fh * 0.65, fy + fh * 0.16, eio(seg(lt, 0.25, clickAtT)));
        K.cursor(mx, my, {
          click: seg(lt, clickAtT, clickAtT + 0.4),
          label: lt > clickAtT + 0.2 ? 'Link Sent ✓' : 'Send Stripe Link',
        });
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.45, 'pop');
    cue(st + clickAtT, 'click', { gain: 0.9 });
    cue(st + clickAtT + 0.25, 'chime', { gain: 0.75 });
  }

  // ── 4 · RELIEF & ROI PROOF CARDS ─────────────────────────────────────────
  {
    const st = cut(3);
    add({
      id: 'S04', at: st, cam: [CX, CY], zoom: 0.025,
      note: 'Real founder relief metrics: 12s generation + 2 hrs saved/month',
      draw(lt, d, t) {
        K.paperBg(t, { pulse: beatPulse(t) });
        K.badge('RECLAIM YOUR FRIDAY', CX, PORTRAIT ? 200 : 120, { scale: spring(lt), accent: true });
        K.editorialTitle(['Stop formatting *spreadsheets.*', 'Start getting *paid faster.*'], {
          x: CX, y: PORTRAIT ? 355 : 235, size: PORTRAIT ? 68 : 72, lt: Math.max(0, lt - 0.06),
        });

        const gap = 26 * U;
        const cw = PORTRAIT ? W * 0.86 : 460 * U;
        const ch = PORTRAIT ? 250 : 320;
        const y0 = PORTRAIT ? 560 : 405;
        const cards = [
          { label: 'OLD FRIDAY', value: '1h 55m', sub: 'Digging Slack threads & fixing formulas', hi: false, delay: 0.16 },
          { label: 'INVOICESNAP', value: '12 sec', sub: 'Review drafted lines + click Send', hi: true, delay: 0.3 },
          { label: 'CLIENT PAYS', value: '3.2x faster', sub: 'Embedded Apple Pay & ACH via Stripe', hi: false, delay: 0.44 },
        ];
        cards.forEach((c, i) => {
          const cx0 = PORTRAIT ? CX - cw / 2 : CX - (cw * 1.5 + gap) + i * (cw + gap);
          const cy0 = PORTRAIT ? y0 + i * (ch + 20) : y0;
          K.bentoCard({ x: cx0, y: cy0, w: cw, h: ch, label: c.label, value: c.value, sub: c.sub, highlight: c.hi, scale: spring(Math.max(0, lt - c.delay), { stiffness: 250, damping: 22 }) });
        });
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.18, 'pop');
    cue(st + 0.34, 'snap');
    cue(st + 0.5, 'pop');
  }

  // ── 5 · WARM FOUNDER CTA ENDCARD ─────────────────────────────────────────
  {
    const st = cut(4);
    add({
      id: 'S05', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Founder CTA endcard with domain & click above captions',
      draw(lt, d, t) {
        K.paperBg(t, { pulse: beatPulse(t), glowY: CY });
        K.ctaEndcard({
          lt,
          tagline: 'Bill your last sprint in 12s.',
          cta: B.copy.ctaPrimary || 'Draft First Invoice Free',
          urlText: `${B.domain} · No card required`,
        });
      },
    });
    cue(st, 'drop', { gain: 0.8 });
    cue(st + 0.85, 'click', { gain: 0.95 });
    cue(st + 0.92, 'chime', { gain: 0.85 });
  }

  return { shots: S, cues: CUES };
}
