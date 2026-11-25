// KINETIC NOIR EXAMPLE: BranchBox (branchbox.dev)
// Demonstrates: 3D tilted product capture + spring cursor + UI spotlight zoom + responsive 16:9 & 9:16 layout.
import { ctx, W, H, CX, CY, U, PORTRAIT, LOUT, clamp, lerp, seg, eo, eio, spring, rr, rgba } from './core/lib.js';
import { B } from './core/brand.js';
import { L, beatPulse } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots(E3D) {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);

  // ── 1 · HOOK: Status quo pain stack shatters ─────────────────────────────
  {
    const st = cut(0), end = cut(1), d0 = end - st;
    const pains = [
      ['Migration Conflict', 'ERROR 500 · schema_version mismatch on staging-db', 'CONFLICT'],
      ['18m 40s pg_dump Wait', 'Blocked 4 PRs waiting on shared database snapshot', 'BLOCKED'],
      ['Unmasked Customer PII', 'prod_users.email leaked into local dev seed', 'RISK'],
    ];
    add({
      id: 'S01', at: st, cam: [CX, CY], zoom: 0.04, flash: false,
      note: 'Hook: staging chaos cards + kinetic pain headline',
      draw(lt, d, t) {
        K.obsidianBg(t, { pulse: beatPulse(t), glowY: CY * 0.65 });
        const wipe = eo(seg(lt, d0 - 0.24, d0 - 0.01));
        const tx = lerp(0, -W * 1.15, wipe);

        ctx.save();
        ctx.translate(tx, 0);
        K.badge('THE OLD WAY', CX, PORTRAIT ? 210 : 120, { scale: spring(lt) });
        K.kineticTitle(['Staging databases', '*break every Friday.'], {
          x: CX, y: PORTRAIT ? 390 : 265, size: PORTRAIT ? 84 : 94, lt, stagger: 0.07,
        });

        const cardW = PORTRAIT ? W * 0.86 : 740 * U;
        const baseY = PORTRAIT ? 740 : 515;
        pains.forEach(([title, detail, tag], idx) => {
          const delay = 0.45 + idx * 0.36;
          const raw = Math.max(0, lt - delay);
          const p = lerp(0.88, 1, spring(raw, { stiffness: 260, damping: 20 }));
          const a = clamp(raw * 9);
          const jitter = Math.sin(t * 28 + idx * 2) * 2.5 * (1 - wipe);
          const rot = (idx - 1) * 0.025 + Math.sin(t * 3 + idx) * 0.008;
          K.painCard(title, detail, {
            x: CX + jitter, y: baseY + idx * (128 * U), w: cardW, rot, scale: p, alpha: a, badgeText: tag,
          });
        });
        ctx.restore();
      },
    });
    cue(st + 0.1, 'snap');
    cue(st + 0.48, 'alarm', { dur: 0.85, gain: 0.7 });
    cue(st + 0.86, 'pop', { gain: 0.7 });
    cue(st + 1.22, 'pop', { gain: 0.75 });
    cue(end - 0.5, 'riser', { dur: 0.48 });
  }

  // ── 2 · 3D HERO REVEAL: Real product capture floats in 3D space ───────────
  {
    const st = cut(1);
    add({
      id: 'S02', at: st, cam: [CX, CY], zoom: 0.02, punch: false,
      note: '3D studio reveal of real desktop-hero capture + kinetic headline',
      draw(lt, d, t, blit3D) {
        const k = eio(seg(lt, 0, d));
        const enter = spring(lt, { stiffness: 170, damping: 22 });
        const img = B.imgs.hero || B.imgs.showcase;

        E3D.render({
          img,
          rotY: lerp(-0.48, 0.14, k),
          rotX: lerp(0.18, 0.04, k),
          cardX: PORTRAIT ? 0 : lerp(0.65, 0.35, k),
          cardY: PORTRAIT ? 0.36 : -0.05,
          camPos: [0, 0.25, PORTRAIT ? lerp(9.8, 9.0, k) : lerp(5.8, 4.9, k)],
          lookAt: [0, PORTRAIT ? 0.08 : 0, 0],
          bloomStrength: 0.28 + beatPulse(t) * 0.14,
        });
        blit3D();

        // Top/Left headline overlay
        const titleX = PORTRAIT ? CX : 100 * U;
        const titleY = PORTRAIT ? H * 0.77 : 240 * U;
        const align = PORTRAIT ? 'center' : 'left';
        K.badge(B.name + ' · v2', titleX, titleY - 125 * U, { scale: lerp(0.88, 1, enter), accent: true, align });
        K.kineticTitle(['Fork Postgres per PR', 'in *400ms.'], {
          x: titleX, y: titleY, size: PORTRAIT ? 76 : 74, lt: Math.max(0, lt - 0.12), align, maxW: PORTRAIT ? W * 0.86 : 760 * U,
        });
      },
    });
    cue(st, 'drop', { gain: 0.95 });
    cue(st + 0.04, 'whoosh', { gain: 0.7 });
  }

  // ── 3 · LIVE UI INTERACTION: Spring cursor clicks + Spotlight zoom ────────
  {
    const st = cut(2);
    const clickAtT = 1.15;
    add({
      id: 'S03', at: st, cam: [CX, CY], zoom: 0.025,
      note: 'Real UI showcase capture: cursor clicks + spotlight zoom on 380ms fork',
      draw(lt, d, t) {
        K.obsidianBg(t, { pulse: beatPulse(t), glowX: CX * 1.15 });
        const uiImg = B.imgs.showcase || B.imgs.hero;
        const pop = lerp(0.9, 1, spring(lt, { stiffness: 210, damping: 23 }));

        const topY = PORTRAIT ? 200 : 108 * U;
        K.kineticTitle(['One click. *Zero staging drift.*'], {
          x: CX, y: topY, size: PORTRAIT ? 66 : 64, lt, stagger: 0.07,
        });

        const fw = PORTRAIT ? W * 0.9 : 1480 * U;
        const fh = PORTRAIT ? H * 0.44 : 740 * U;
        const fx = (W - fw) / 2;
        const fy = PORTRAIT ? 440 : 215 * U;

        const zoomIn = eio(seg(lt, clickAtT + 0.18, clickAtT + 1.05));
        const spotAlpha = eo(seg(lt, clickAtT + 0.12, clickAtT + 0.55));
        K.browserFrame(uiImg, {
          x: fx, y: fy, w: fw, h: fh,
          url: `${B.domain}/branches/pr-418`,
          zoom: lerp(1.0, 1.38, zoomIn),
          panX: lerp(0.5, 0.18, zoomIn),
          panY: lerp(0.0, 0.35, zoomIn),
          scale: pop,
          alpha: clamp(lt * 8),
          sheenT: seg(lt, 0.25, 1.1),
          spotlight: spotAlpha > 0.01 ? [0.02, 0.22, 0.52, 0.45, spotAlpha] : null,
        });

        // Cursor flies toward "+ Create Fork" top-right button, clicks, then moves to active branch
        const move1 = eio(seg(lt, 0.2, clickAtT));
        const move2 = eio(seg(lt, clickAtT + 0.3, clickAtT + 1.2));
        const btnX = fx + fw * 0.87, btnY = fy + fh * 0.14;
        const targetX = fx + fw * 0.36, targetY = fy + fh * 0.46;
        const curX = lt < clickAtT + 0.25 ? lerp(fx + fw * 0.25, btnX, move1) : lerp(btnX, targetX, move2);
        const curY = lt < clickAtT + 0.25 ? lerp(fy + fh * 0.72, btnY, move1) : lerp(btnY, targetY, move2);

        K.cursor(curX, curY, {
          click: seg(lt, clickAtT, clickAtT + 0.42),
          label: lt > clickAtT + 0.2 ? '380ms ✓' : 'Create Fork',
        });
      },
    });
    cue(st, 'whoosh');
    cue(st + clickAtT, 'click', { gain: 0.9 });
    cue(st + clickAtT + 0.18, 'shutter', { gain: 0.75 });
  }

  // ── 4 · BENCHMARK PROOF: Hard numbers + Bento cards ──────────────────────
  {
    const st = cut(3);
    add({
      id: 'S04', at: st, cam: [CX, CY], zoom: 0.03,
      note: 'Hard benchmark proof: 380ms vs 18m 40s + Bento metric cards',
      draw(lt, d, t) {
        K.obsidianBg(t, { pulse: beatPulse(t) });
        const left = LOUT.pane('left'), right = LOUT.pane('right');

        K.badge('BENCHMARK · 420GB PROD DB', PORTRAIT ? CX : left.x, PORTRAIT ? 150 : left.y + 40, {
          scale: spring(lt), accent: true, align: PORTRAIT ? 'center' : 'left',
        });
        K.kineticTitle(['*2,900x faster', 'than pg_dump.'], {
          x: PORTRAIT ? CX : left.x, y: PORTRAIT ? 300 : left.y + 210,
          size: PORTRAIT ? 74 : 76, lt: Math.max(0, lt - 0.08),
          align: PORTRAIT ? 'center' : 'left', maxW: left.w,
        });

        // Animated comparison bars inside left pane
        const barY = PORTRAIT ? 480 : left.y + 430;
        const barW = PORTRAIT ? W * 0.84 : left.w * 0.92;
        const barX = PORTRAIT ? (W - barW) / 2 : left.x;
        const pBar = eo(seg(lt, 0.35, 1.35));

        const drawBar = (y, label, val, pct, col) => {
          ctx.save();
          ctx.fillStyle = B.muted;
          ctx.font = `800 ${Math.round(22 * U)}px Inter, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(label, barX, y);
          ctx.textAlign = 'right';
          ctx.fillStyle = col;
          ctx.fillText(val, barX + barW, y);
          rr(barX, y + 18 * U, barW, 20 * U, 10 * U);
          ctx.fillStyle = B.surfaceHi;
          ctx.fill();
          rr(barX, y + 18 * U, Math.max(20 * U, barW * pct * pBar), 20 * U, 10 * U);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.restore();
        };
        drawBar(barY, 'Legacy pg_dump restore', '18m 40s', 0.95, '#EF4444');
        drawBar(barY + 86 * U, 'BranchBox CoW fork', '0.38s', 0.05, '#10B981');

        // Right pane: 3 modular Bento proof cards
        const gap = 22 * U;
        const cw = (right.w - gap) / 2;
        const ch = (right.h - gap) / 2;
        const cards = [
          { x: right.x, y: right.y, w: cw, h: ch, label: 'FORK LATENCY', value: `${Math.round(lerp(0, 380, eo(seg(lt, 0.25, 1.1))))}ms`, sub: 'Isolated Postgres 16 branch', highlight: true, delay: 0.18 },
          { x: right.x + cw + gap, y: right.y, w: cw, h: ch, label: 'DELTA STORAGE', value: `${Math.round(lerp(0, 14, eo(seg(lt, 0.4, 1.2))))} MB`, sub: 'Shared copy-on-write blocks', highlight: false, delay: 0.32 },
          { x: right.x, y: right.y + ch + gap, w: right.w, h: ch, label: 'SECURITY & COMPLIANCE', value: '100% PII Scrubbed', sub: 'Emails, tokens & cards masked before any dev connects', highlight: false, delay: 0.48 },
        ];
        cards.forEach((c) => {
          K.bentoCard({ ...c, scale: spring(Math.max(0, lt - c.delay), { stiffness: 250, damping: 22 }) });
        });
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.22, 'snap');
    cue(st + 0.48, 'pop');
    cue(st + 0.72, 'pop');
  }

  // ── 5 · AUTO-EXPIRE + MOBILE / ANYWHERE FIT ──────────────────────────────
  {
    const st = cut(4);
    add({
      id: 'S05', at: st, cam: [CX, CY], zoom: 0.03,
      note: 'Desktop + Mobile real captures + zero zombie staging costs',
      draw(lt, d, t) {
        K.obsidianBg(t, { pulse: beatPulse(t) });
        K.kineticTitle(['Auto-expires on *merge.', 'Zero *zombie bills.'], {
          x: CX, y: PORTRAIT ? 210 : 145 * U, size: PORTRAIT ? 74 : 74, lt, stagger: 0.08,
        });

        const heroImg = B.imgs.hero;
        const mobImg = B.imgs.mobile || B.imgs.hero;
        const s1 = lerp(0.9, 1, spring(Math.max(0, lt - 0.1), { stiffness: 210, damping: 22 }));
        const s2 = lerp(0.9, 1, spring(Math.max(0, lt - 0.24), { stiffness: 210, damping: 22 }));

        if (PORTRAIT) {
          K.browserFrame(heroImg, { x: 64, y: 400, w: W - 128, h: 610, url: B.domain, scale: s1, alpha: clamp(lt * 8), panY: eio(seg(lt, 0.2, d)) * 0.2 });
          K.browserFrame(mobImg, { x: CX + 40, y: 900, w: 400, h: 740, url: B.domain, scale: s2, alpha: clamp(lt * 8), radius: 38, chrome: false });
          K.bentoCard({ x: 64, y: 1080, w: 460, h: 250, label: 'ZOMBIE INSTANCES', value: '$0 / mo', sub: 'Reclaimed automatically on PR close', highlight: true, scale: s2 });
          K.bentoCard({ x: 64, y: 1360, w: 460, h: 250, label: 'CLEANUP HOOK', value: 'GitHub Action', sub: 'Zero manual teardown scripts', highlight: false, scale: s2 });
        } else {
          K.browserFrame(heroImg, { x: 160, y: 290, w: 1120, h: 660, url: B.domain, scale: s1, alpha: clamp(lt * 8), panY: eio(seg(lt, 0.2, d)) * 0.25 });
          K.browserFrame(mobImg, { x: 1350, y: 270, w: 390, h: 690, url: B.domain, scale: s2, alpha: clamp(lt * 8), radius: 40, chrome: false });
        }
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.32, 'pop');
  }

  // ── 6 · CONVERSION CTA ENDCARD ───────────────────────────────────────────
  {
    const st = cut(5);
    add({
      id: 'S06', at: st, cam: [CX, CY], zoom: 0.02,
      note: 'Conversion CTA endcard with logo, CLI pill, button & cursor click',
      draw(lt, d, t) {
        K.obsidianBg(t, { pulse: beatPulse(t), glowY: CY, glowRadius: 0.85 });
        K.ctaEndcard({
          lt,
          tagline: 'Ship PRs, not migrations.',
          cta: B.copy.ctaPrimary || 'Deploy First Branch',
          urlText: `${B.domain} · Free hobby tier`,
          command: B.copy.codeSnippets?.[0] || 'npx branchbox init',
        });
      },
    });
    cue(st, 'drop', { gain: 0.85 });
    cue(st + 0.85, 'click', { gain: 0.95 });
    cue(st + 0.92, 'chime', { gain: 0.85 });
  }

  return { shots: S, cues: CUES };
}
