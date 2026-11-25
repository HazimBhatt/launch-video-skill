#!/usr/bin/env node
// Product URL Probe (0 npm deps, Chrome CDP):
//   node scripts/probe.mjs <url> <out-dir> [--wait 1800] [--actions actions.json]
//
// Extracts data/brand.json (palette, fonts, logo, copy, proof, pricing, code snippets, sections)
// and captures real high-DPI product screenshots into assets/captures/.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findChrome } from './env.mjs';

const args = process.argv.slice(2);
function getOpt(flag, def = null) {
  const i = args.indexOf(flag);
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return def;
}
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) { i++; continue; }
  positional.push(args[i]);
}
const targetUrl = positional[0];
const outDir = path.resolve(positional[1] || '.');
const waitMs = Number(getOpt('--wait', 1800));
const actionsFile = getOpt('--actions', null);

if (!targetUrl) {
  console.error('Usage: node probe.mjs <url> <out-dir> [--wait 1800] [--actions actions.json]');
  process.exit(2);
}

const CHROME = findChrome();
if (!CHROME) {
  console.error('Google Chrome not found. Install Chrome or set CHROME=/path/to/chrome');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openCdp(url) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-probe-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${prof}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--window-size=1440,900',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    'about:blank',
  ], { stdio: 'ignore' });

  let dbg = null;
  for (let i = 0; i < 150 && !dbg; i++) {
    try {
      dbg = fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
    } catch { await sleep(100); }
  }
  if (!dbg) throw new Error('Chrome DevTools port did not open');

  const res = await fetch(`http://127.0.0.1:${dbg}/json/new?about:blank`, { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; });

  let seq = 0;
  const pending = new Map();
  let loadResolve = null;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    } else if (m.method === 'Page.loadEventFired' && loadResolve) {
      loadResolve();
      loadResolve = null;
    }
  };

  const send = (method, params = {}) => new Promise((res2, rej) => {
    const id = ++seq;
    pending.set(id, { res: res2, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expression) => {
    const x = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (x.exceptionDetails) {
      throw new Error(x.exceptionDetails.exception?.description || x.exceptionDetails.text);
    }
    return x.result?.value;
  };
  const waitLoad = (timeoutMs = 20000) => Promise.race([
    new Promise((r) => { loadResolve = r; }),
    sleep(timeoutMs),
  ]);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 2, mobile: false,
  });

  const navPromise = waitLoad(25000);
  await send('Page.navigate', { url });
  await navPromise;
  await ev(`(async () => {
    try { await document.fonts.ready; } catch {}
    const imgs = [...document.images].filter(i => !i.complete);
    await Promise.race([
      Promise.all(imgs.map(i => new Promise(r => { i.onload = r; i.onerror = r; }))),
      new Promise(r => setTimeout(r, 4000))
    ]);
  })()`);
  await sleep(waitMs);

  const close = async () => {
    try { ws.close(); } catch {}
    try { chrome.kill('SIGKILL'); } catch {}
    await sleep(250);
    try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
  };
  return { send, ev, close };
}

async function saveShot(send, filePath, clip = null) {
  const params = { format: 'png' };
  if (clip) params.clip = { ...clip, scale: 2 };
  const { data } = await send('Page.captureScreenshot', params);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
}

const EXTRACT_FN = `(() => {
  const rgbToHex = (s) => {
    if (!s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') return null;
    const m = s.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.15) return null;
    return '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const lum = (hex) => {
    if (!hex) return 0;
    const n = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const f = n.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const sat = (hex) => {
    if (!hex) return 0;
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx === 0 ? 0 : (mx - mn) / mx;
  };
  const vis = (el) => {
    if (!el) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) < 0.1) return false;
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  };
  const cleanText = (el) => (el?.innerText || el?.textContent || '').replace(/\\s+/g, ' ').trim();

  // Palette extraction
  const bodyBg = rgbToHex(getComputedStyle(document.body).backgroundColor) || rgbToHex(getComputedStyle(document.documentElement).backgroundColor) || '#FFFFFF';
  const isDark = lum(bodyBg) < 0.35;
  const h1 = [...document.querySelectorAll('h1')].find(vis) || [...document.querySelectorAll('h2')].find(vis);
  const textCol = rgbToHex(getComputedStyle(h1 || document.body).color) || (isDark ? '#F8FAFC' : '#111827');
  const bodyP = [...document.querySelectorAll('p')].find(p => vis(p) && cleanText(p).length > 35);
  const mutedCol = rgbToHex(getComputedStyle(bodyP || document.body).color) || (isDark ? '#94A3B8' : '#4B5563');

  // CTA buttons for true accent color
  const ctas = [...document.querySelectorAll('a, button')].filter(el => {
    if (!vis(el)) return false;
    const r = el.getBoundingClientRect();
    if (r.top > 1100 || r.width < 60 || r.height < 26 || r.height > 90) return false;
    const txt = cleanText(el);
    return txt.length >= 2 && txt.length <= 40;
  });
  let accent = null, accentText = null, ctaPrimary = '';
  const colorCounts = new Map();
  for (const el of ctas) {
    const st = getComputedStyle(el);
    const bg = rgbToHex(st.backgroundColor);
    const fg = rgbToHex(st.color);
    const score = (sat(bg) * 3 + (el.tagName === 'BUTTON' ? 1 : 0.6)) * (el.getBoundingClientRect().top > 120 ? 1.5 : 1);
    if (bg && bg !== bodyBg && sat(bg) > 0.2) {
      colorCounts.set(bg, (colorCounts.get(bg) || 0) + score);
      if (!accent || colorCounts.get(bg) > colorCounts.get(accent)) {
        accent = bg; accentText = fg; ctaPrimary = cleanText(el);
      }
    }
  }
  if (!accent) {
    for (const el of document.querySelectorAll('a, span, strong, mark, svg')) {
      const fg = rgbToHex(getComputedStyle(el).color);
      if (fg && fg !== '#0000EE' && fg !== '#551A8B' && sat(fg) > 0.35) { accent = fg; break; }
    }
  }
  if (!accent) accent = isDark ? '#6366F1' : '#2563EB';
  if (!accentText) accentText = lum(accent) > 0.45 ? '#0A0A0D' : '#FFFFFF';
  if (!ctaPrimary && ctas[0]) ctaPrimary = cleanText(ctas[0]);

  let surface = null;
  for (const el of document.querySelectorAll('section, article, pre, [class*="card"], [class*="panel"], [class*="box"]')) {
    if (!vis(el)) continue;
    const bg = rgbToHex(getComputedStyle(el).backgroundColor);
    if (bg && bg !== bodyBg && Math.abs(lum(bg) - lum(bodyBg)) > 0.02 && Math.abs(lum(bg) - lum(bodyBg)) < 0.3) {
      surface = bg; break;
    }
  }
  if (!surface) surface = isDark ? '#14161D' : '#FFFFFF';

  // Fonts
  const displayFont = (getComputedStyle(h1 || document.body).fontFamily || 'Inter').split(',')[0].replace(/['"]/g, '').trim();
  const bodyFont = (getComputedStyle(document.body).fontFamily || 'Inter').split(',')[0].replace(/['"]/g, '').trim();
  const codeEl = document.querySelector('pre, code');
  const monoFont = codeEl ? getComputedStyle(codeEl).fontFamily.split(',')[0].replace(/['"]/g, '').trim() : 'monospace';
  const googleFontsUrls = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href).filter(h => h.includes('fonts.googleapis.com'));

  // Logo extraction
  let logoSvg = null, logoImg = null;
  const header = document.querySelector('header, nav') || document.body;
  const svgs = [...header.querySelectorAll('svg')].filter(s => {
    const r = s.getBoundingClientRect();
    return r.width >= 16 && r.width <= 260 && r.height >= 14 && r.height <= 90;
  });
  if (svgs[0]) {
    const clone = svgs[0].cloneNode(true);
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const r = svgs[0].getBoundingClientRect();
    if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', '0 0 ' + Math.round(r.width) + ' ' + Math.round(r.height));
    logoSvg = clone.outerHTML;
  }
  const hImg = header.querySelector('img');
  if (hImg && hImg.src) logoImg = hImg.src;
  const iconLink = document.querySelector('link[rel*="icon"]')?.href || '';
  const ogImg = document.querySelector('meta[property="og:image"]')?.content || '';

  // Copy & sections
  const meta = (n) => document.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]')?.content?.trim() || '';
  const ogSite = meta('og:site_name');
  const title = document.title.trim();
  const nameGuess = ogSite || title.split(/[-|—:•]/)[0].trim() || location.hostname.replace(/^www\\./, '').split('.')[0];

  const heroSubhead = (() => {
    if (h1) {
      const p = h1.parentElement?.querySelector('p') || h1.nextElementSibling;
      if (p && cleanText(p).length > 18 && cleanText(p).length < 280) return cleanText(p);
    }
    return bodyP ? cleanText(bodyP) : meta('description');
  })();

  const features = [];
  const seenFeat = new Set();
  for (const h of document.querySelectorAll('h2, h3')) {
    if (!vis(h)) continue;
    const t = cleanText(h);
    if (!t || t.length < 4 || t.length > 90 || seenFeat.has(t)) continue;
    let desc = '';
    const sib = h.nextElementSibling;
    if (sib && (sib.tagName === 'P' || sib.tagName === 'DIV') && cleanText(sib).length < 260) desc = cleanText(sib);
    seenFeat.add(t);
    features.push({ title: t, body: desc });
    if (features.length >= 8) break;
  }

  // Proof / Metrics / Testimonials
  const allText = document.body.innerText || '';
  const metricMatches = [...allText.matchAll(/(?:^|\\s)([+$]?\\d[\\d.,]*\\s*(?:%|x\\b|ms\\b|s\\b|k\\+|m\\+|\\+|users|developers|devs|teams|stars|companies|minutes|hours))/gi)]
    .map(m => m[1].trim()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);

  const quotes = [...document.querySelectorAll('blockquote, [class*="testimonial"], [class*="quote"]')]
    .filter(vis).map(el => cleanText(el)).filter(t => t.length > 25 && t.length < 280).slice(0, 4);

  // Pricing detection
  const pricingMatches = [...allText.matchAll(/(\\$\\d+(?:\\.\\d{2})?(?:\\s*\\/\\s*(?:mo|month|yr|year|seat|user))?|Free forever|Open source|Lifetime)/gi)]
    .map(m => m[0].trim()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
  const pricingEl = [...document.querySelectorAll('section, div')].find(el => {
    const idc = ((el.id || '') + ' ' + (el.className || '')).toLowerCase();
    return (idc.includes('pricing') || idc.includes('plans')) && el.getBoundingClientRect().height > 200;
  });

  // Code / CLI snippets
  const codeSnippets = [...document.querySelectorAll('pre, code')]
    .filter(vis).map(el => (el.innerText || '').trim())
    .filter(t => t.length >= 6 && t.length <= 420 && (t.includes('\\n') || /^(npx|npm|pnpm|yarn|bun|pip|uv|curl|git|docker|brew|cargo|go)\\b/i.test(t)))
    .filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

  // UI showcase candidate (largest product visual / app mockup / hero media below nav)
  let uiRect = null;
  let bestArea = 0;
  for (const el of document.querySelectorAll('img, video, canvas, pre, [class*="demo"], [class*="preview"], [class*="dashboard"], [class*="mockup"], [class*="window"], [class*="app"], [class*="editor"]')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.top + window.scrollY < 70) continue;
    if (r.width < 460 || r.height < 240 || r.width > 1420 || r.height > 920) continue;
    const area = r.width * r.height * (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'CANVAS' ? 1.25 : 1);
    if (area > bestArea) {
      bestArea = area;
      uiRect = {
        x: Math.max(0, Math.round(r.left)),
        y: Math.max(0, Math.round(r.top + window.scrollY)),
        width: Math.min(1440, Math.round(r.width)),
        height: Math.min(900, Math.round(r.height)),
      };
    }
  }

  return {
    name: nameGuess,
    title,
    domain: location.hostname.replace(/^www\\./, ''),
    url: location.href,
    theme: isDark ? 'dark' : 'light',
    palette: { bg: bodyBg, surface, text: textCol, muted: mutedCol, accent, accentText },
    fonts: { display: displayFont, body: bodyFont, mono: monoFont, googleFontsUrls },
    logo: { hasSvg: !!logoSvg, svg: logoSvg, img: logoImg || iconLink || ogImg },
    copy: {
      h1: cleanText(h1),
      heroSubhead,
      metaDescription: meta('description') || meta('og:description'),
      ctaPrimary,
      navLinks: [...header.querySelectorAll('a')].filter(vis).map(cleanText).filter(Boolean).slice(0, 8),
      navUrls: [...header.querySelectorAll('a')].filter(vis).map(a => ({ label: cleanText(a), href: a.href })).filter(x => x.label && x.href && x.href.startsWith('http')).slice(0, 8),
      features,
      proofMetrics: metricMatches,
      quotes,
      pricing: pricingMatches,
      codeSnippets,
    },
    layout: {
      scrollHeight: document.documentElement.scrollHeight,
      uiRect,
      pricingY: pricingEl ? Math.max(0, Math.round(pricingEl.getBoundingClientRect().top + window.scrollY - 60)) : null,
    },
  };
})()`;

const outDataDir = path.join(outDir, 'data');
const outCapDir = path.join(outDir, 'assets', 'captures');
const outBrandDir = path.join(outDir, 'assets', 'brand');
fs.mkdirSync(outDataDir, { recursive: true });
fs.mkdirSync(outCapDir, { recursive: true });
fs.mkdirSync(outBrandDir, { recursive: true });

const cdp = await openCdp(targetUrl);
try {
  // Optional quick consent dismissal (never throws if absent)
  await cdp.ev(`(() => {
    for (const b of document.querySelectorAll('button')) {
      const t = (b.innerText || '').trim().toLowerCase();
      if (/^(accept|accept all|got it|dismiss|close|i agree)$/.test(t) && b.getBoundingClientRect().top > 450) {
        try { b.click(); } catch {}
        break;
      }
    }
  })()`).catch(() => {});
  await sleep(300);

  const info = await cdp.ev(EXTRACT_FN);

  // Save SVG or downloaded icon logo
  let logoRel = null;
  if (info.logo.hasSvg && info.logo.svg) {
    logoRel = 'assets/brand/logo.svg';
    fs.writeFileSync(path.join(outDir, logoRel), info.logo.svg, 'utf8');
  } else if (info.logo.img) {
    try {
      const r = await fetch(info.logo.img);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || '';
        const ext = ct.includes('svg') ? '.svg' : ct.includes('webp') ? '.webp' : ct.includes('jpeg') ? '.jpg' : '.png';
        logoRel = 'assets/brand/logo' + ext;
        fs.writeFileSync(path.join(outDir, logoRel), buf);
      }
    } catch {}
  }

  const actionsList = (actionsFile && fs.existsSync(actionsFile))
    ? JSON.parse(fs.readFileSync(actionsFile, 'utf8'))
    : [];
  const runClean = async (act) => {
    const hideTexts = act.hideTexts || [];
    const hideSel = act.selectors || [];
    await cdp.ev(`(() => {
      for (const sel of ${JSON.stringify(hideSel)}) {
        document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
      }
      const needles = ${JSON.stringify(hideTexts.map(s => String(s).toLowerCase()))};
      if (needles.length) {
        for (const el of document.querySelectorAll('section, article, aside, div, a, button')) {
          const txt = (el.innerText || '').trim().toLowerCase();
          if (!txt || txt.length > 120) continue;
          if (needles.some(n => txt.includes(n))) {
            const st = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            const isFloating = st.position === 'fixed' || st.position === 'sticky';
            if (isFloating || (r.width < 600 && r.height < 420 && (st.borderStyle === 'dashed' || el.children.length <= 5))) {
              el.style.visibility = 'hidden';
              el.style.opacity = '0';
              if (isFloating) el.style.display = 'none';
            }
          }
        }
      }
    })()`);
  };
  for (const act of actionsList) {
    if (act.type === 'clean') await runClean(act);
  }

  // 1. Desktop Hero (top of page)
  await cdp.ev('window.scrollTo(0, 0)');
  await sleep(350);
  await saveShot(cdp.send, path.join(outCapDir, 'desktop-hero.png'));

  const totalH = info.layout.scrollHeight || 2400;
  // 2. Desktop Mid 1 & 2
  const y1 = Math.min(Math.max(700, Math.round(totalH * 0.33)), Math.max(0, totalH - 900));
  await cdp.ev(`window.scrollTo(0, ${y1})`);
  await sleep(450);
  await saveShot(cdp.send, path.join(outCapDir, 'desktop-mid-1.png'));

  const y2 = Math.min(Math.max(1400, Math.round(totalH * 0.65)), Math.max(0, totalH - 900));
  await cdp.ev(`window.scrollTo(0, ${y2})`);
  await sleep(450);
  await saveShot(cdp.send, path.join(outCapDir, 'desktop-mid-2.png'));

  // 3. UI Showcase crop (if isolated visual block found)
  let hasShowcase = false;
  if (info.layout.uiRect) {
    const r = info.layout.uiRect;
    const scrollTarget = Math.max(0, r.y - 80);
    await cdp.ev(`window.scrollTo(0, ${scrollTarget})`);
    await sleep(400);
    const clipY = Math.max(0, r.y - scrollTarget);
    if (clipY + r.height <= 900) {
      await saveShot(cdp.send, path.join(outCapDir, 'ui-showcase.png'), {
        x: r.x, y: clipY, width: r.width, height: r.height,
      });
      hasShowcase = true;
    }
  }
  if (!hasShowcase) {
    fs.copyFileSync(path.join(outCapDir, 'desktop-hero.png'), path.join(outCapDir, 'ui-showcase.png'));
  }

  // 4. Pricing capture if found
  let hasPricing = false;
  if (info.layout.pricingY != null) {
    await cdp.ev(`window.scrollTo(0, ${info.layout.pricingY})`);
    await sleep(400);
    await saveShot(cdp.send, path.join(outCapDir, 'pricing.png'));
    hasPricing = true;
  }

  // 5. Optional custom scripted interactions (scroll, click, clickText, type, clean, wait, shot [with optional selector or matchText crop])
  const customShots = [];
  for (const act of actionsList) {
    if (act.type === 'scroll') {
      await cdp.ev(`window.scrollTo(0, ${Number(act.y || 0)})`);
    } else if (act.type === 'wait') {
      await sleep(Number(act.ms || 500));
    } else if (act.type === 'click' && act.selector) {
      await cdp.ev(`document.querySelector(${JSON.stringify(act.selector)})?.click()`);
    } else if (act.type === 'clickText' && act.text) {
      await cdp.ev(`(() => {
        const want = ${JSON.stringify(String(act.text).toLowerCase())};
        const el = [...document.querySelectorAll('button, a, [role="tab"]')].find(e => (e.innerText || '').toLowerCase().includes(want));
        if (el) el.click();
      })()`);
    } else if (act.type === 'clean') {
      await runClean(act);
    } else if (act.type === 'type' && act.selector) {
      await cdp.ev(`(() => {
        const el = document.querySelector(${JSON.stringify(act.selector)});
        if (!el) return;
        el.focus();
        el.value = ${JSON.stringify(act.text || '')};
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
    } else if (act.type === 'shot') {
      const fname = `${(act.name || 'custom').replace(/[^a-z0-9_-]+/gi, '-')}.png`;
      let clip = null;
      if (act.selector || act.matchText) {
        const rect = await cdp.ev(`(() => {
          let el = ${act.selector ? `document.querySelector(${JSON.stringify(act.selector)})` : 'null'};
          const needle = ${act.matchText ? JSON.stringify(String(act.matchText).toLowerCase()) : 'null'};
          if (!el && needle) {
            const cands = [...document.querySelectorAll('section, article, form, div')].filter(c => {
              const t = (c.innerText || '').toLowerCase();
              const r = c.getBoundingClientRect();
              return t.includes(needle) && r.width >= ${Number(act.minW ?? 220)} && r.height >= ${Number(act.minH ?? 80)} && r.width <= 1360 && r.height <= 820;
            });
            cands.sort((a, b) => (a.getBoundingClientRect().width * a.getBoundingClientRect().height) - (b.getBoundingClientRect().width * b.getBoundingClientRect().height));
            el = cands[0] || null;
          }
          if (!el) return null;
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = el.getBoundingClientRect();
          const pad = ${Number(act.pad ?? 18)};
          const docX = Math.max(0, Math.round(r.left + window.scrollX - pad));
          const docY = Math.max(0, Math.round(r.top + window.scrollY - pad));
          return {
            x: docX,
            y: docY,
            width: Math.min(1440 - docX, Math.round(r.width + pad * 2)),
            height: Math.round(r.height + pad * 2),
          };
        })()`);
        if (rect && rect.width > 40 && rect.height > 40) {
          await sleep(250);
          clip = rect;
        }
      }
      await saveShot(cdp.send, path.join(outCapDir, fname), clip);
      customShots.push(`assets/captures/${fname}`);
    }
    await sleep(Number(act.delay || 250));
  }

  // 6. Mobile capture (390x844 @ 2x)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await cdp.ev('window.scrollTo(0, 0)');
  await sleep(450);
  await saveShot(cdp.send, path.join(outCapDir, 'mobile-hero.png'));

  const brand = {
    name: info.name,
    domain: info.domain,
    url: info.url,
    theme: info.theme,
    palette: info.palette,
    fonts: info.fonts,
    logo: logoRel,
    copy: info.copy,
    captures: {
      hero: 'assets/captures/desktop-hero.png',
      showcase: 'assets/captures/ui-showcase.png',
      mid1: 'assets/captures/desktop-mid-1.png',
      mid2: 'assets/captures/desktop-mid-2.png',
      mobile: 'assets/captures/mobile-hero.png',
      ...(hasPricing ? { pricing: 'assets/captures/pricing.png' } : {}),
      custom: customShots,
    },
  };
  fs.writeFileSync(path.join(outDataDir, 'brand.json'), JSON.stringify(brand, null, 2), 'utf8');
  console.log(`Probed ${info.url} (${info.theme} theme, accent ${info.palette.accent})`);
  console.log(`  brand.json -> ${path.join(outDataDir, 'brand.json')}`);
  console.log(`  captures   -> ${outCapDir}`);
} finally {
  await cdp.close();
}
process.exit(0);
