// Brand loader: reads data/brand.json + assets/captures/* + assets/brand/logo.* BEFORE OP.ready = true.
// Provides contrast-safe brand tokens in `B` so every shot uses the actual product's DNA, never generic colors.
import { lum, mixHex, rgba } from './lib.js';

export const B = {
  name: 'LaunchKit',
  domain: 'launchkit.dev',
  url: 'https://launchkit.dev',
  theme: 'dark',
  accent: '#6366F1',
  accentBright: '#818CF8',
  accentSoft: 'rgba(99,102,241,0.18)',
  accentGlow: 'rgba(99,102,241,0.45)',
  onAccent: '#FFFFFF',
  bg: '#090A0F',
  surface: '#12141E',
  surfaceHi: '#1B1E2E',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: 'rgba(255,255,255,0.12)',
  danger: '#EF4444',
  success: '#10B981',
  displayFont: 'Inter',
  bodyFont: 'Inter',
  monoFont: 'FreeMono',
  copy: { h1: '', heroSubhead: '', ctaPrimary: 'Get Started', features: [], proofMetrics: [], pricing: [], codeSnippets: [] },
  imgs: {},
  ai: {},
  logoImg: null,
};

function loadImg(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

export async function loadBrand(styleTheme = 'dark') {
  let raw = null;
  try {
    const r = await fetch('data/brand.json', { cache: 'no-store' });
    if (r.ok) raw = await r.json();
  } catch {}

  if (raw) {
    B.name = raw.name || B.name;
    B.domain = raw.domain || B.domain;
    B.url = raw.url || B.url;
    B.theme = raw.theme || B.theme;
    if (raw.copy) B.copy = { ...B.copy, ...raw.copy };

    const p = raw.palette || {};
    let acc = p.accent || B.accent;
    // Guard against muddy/invisible accent colors in dark or light styles
    if (styleTheme === 'dark') {
      if (lum(acc) < 0.09) acc = mixHex(acc, '#FFFFFF', 0.42);
      B.accent = acc;
      B.accentBright = mixHex(acc, '#FFFFFF', 0.25);
      B.bg = p.bg && lum(p.bg) < 0.08 ? p.bg : mixHex('#08090D', acc, 0.06);
      B.surface = mixHex(B.bg, '#FFFFFF', 0.055);
      B.surfaceHi = mixHex(B.bg, '#FFFFFF', 0.11);
      B.text = '#F8FAFC';
      B.muted = '#94A3B8';
      B.border = 'rgba(255,255,255,0.12)';
    } else {
      if (lum(acc) > 0.72) acc = mixHex(acc, '#111827', 0.45);
      B.accent = acc;
      B.accentBright = mixHex(acc, '#000000', 0.15);
      B.bg = p.bg && lum(p.bg) > 0.75 ? p.bg : '#F6F5F0';
      B.surface = '#FFFFFF';
      B.surfaceHi = '#F1F0EA';
      B.text = '#111827';
      B.muted = '#4B5563';
      B.border = 'rgba(17,24,39,0.12)';
    }
    B.accentSoft = rgba(B.accent, 0.16);
    B.accentGlow = rgba(B.accent, 0.48);
    B.onAccent = lum(B.accent) > 0.48 ? '#090A0F' : '#FFFFFF';

    // Load Google Fonts from the probed site if online and preserve matching bundled studio font choices
    const gf = raw.fonts?.googleFontsUrls || [];
    if (gf.length) {
      for (const href of gf.slice(0, 2)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
    }
    const reqDisp = raw.fonts?.display;
    if (reqDisp && typeof document !== 'undefined') {
      await Promise.all([
        document.fonts.load(`500 32px "${reqDisp}"`),
        document.fonts.load(`700 48px "${reqDisp}"`),
      ]).catch(() => {});
      if (document.fonts.check(`700 32px "${reqDisp}"`) || document.fonts.check(`500 32px "${reqDisp}"`)) {
        B.displayFont = reqDisp;
        B.bodyFont = reqDisp;
      }
    }
    B.monoFont = 'JetBrains Mono';

    if (raw.logo) B.logoImg = await loadImg(raw.logo);

    const caps = raw.captures || {};
    const entries = Object.entries(caps).filter(([k, v]) => typeof v === 'string');
    if (Array.isArray(caps.custom)) {
      for (const cPath of caps.custom) {
        const key = cPath.split('/').pop().replace(/\.[^.]+$/, '');
        entries.push([key, cPath]);
      }
    }
    const loaded = await Promise.all(entries.map(async ([k, src]) => [k, await loadImg(src)]));
    for (const [k, img] of loaded) {
      if (img) B.imgs[k] = img;
    }

    const aiMap = raw.aiImages || raw.ai || {};
    const aiEntries = Array.isArray(aiMap)
      ? aiMap.map((src) => [src.split('/').pop().replace(/\.[^.]+$/, ''), src])
      : Object.entries(aiMap).filter(([, v]) => typeof v === 'string');
    if (aiEntries.length) {
      const aiLoaded = await Promise.all(aiEntries.map(async ([k, src]) => [k, await loadImg(src)]));
      for (const [k, img] of aiLoaded) {
        if (img) B.ai[k] = img;
      }
    }
  }
  return B;
}
