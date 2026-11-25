// Brand DNA, real capture loader, and photographic atmospheric plate registry
export const B = {
  name: 'Studio',
  domain: 'example.com',
  url: 'https://example.com',
  theme: 'light',
  bg: '#FAF9F7',
  darkBg: '#0E0E0D',
  surface: '#FFFFFF',
  text: '#111110',
  muted: '#6B6964',
  accent: '#FF9E8A',
  accentDeep: '#E8765E',
  accentText: '#111110',
  emerald: '#15803D',
  crimson: '#B91C1C',
  displayFont: '"Bricolage Grotesque", "Inter", "DM Sans", sans-serif',
  bodyFont: '"Inter", "DM Sans", sans-serif',
  monoFont: '"JetBrains Mono", ui-monospace, monospace',
  stencilFont: '"Stardos Stencil", "JetBrains Mono", monospace',
  copy: {
    h1: '',
    heroSubhead: '',
    ctaPrimary: 'Try free',
    features: [],
    proofMetrics: [],
    pricing: [],
    codeSnippets: [],
  },
  logoImg: null,
  imgs: {},
  ai: {},
  raw: null,
};

function loadImg(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadBrand() {
  let data = null;
  try {
    const r = await fetch('data/brand.json', { cache: 'no-store' });
    if (r.ok) data = await r.json();
  } catch {}

  if (!data) return B;
  B.raw = data;
  B.name = data.name || B.name;
  B.domain = data.domain || B.domain;
  B.url = data.url || B.url;
  B.theme = data.theme || B.theme;

  const p = data.palette || {};
  if (p.bg) B.bg = p.bg;
  if (p.darkBg) B.darkBg = p.darkBg;
  if (p.surface) B.surface = p.surface;
  if (p.text) B.text = p.text;
  if (p.muted) B.muted = p.muted;
  if (p.accent) B.accent = p.accent;
  if (p.accentDeep) B.accentDeep = p.accentDeep;
  if (p.accentText) B.accentText = p.accentText;
  if (p.emerald) B.emerald = p.emerald;
  if (p.crimson) B.crimson = p.crimson;

  if (data.fonts?.display) {
    B.displayFont = `"${data.fonts.display}", "Bricolage Grotesque", "Inter", "DM Sans", sans-serif`;
  }
  if (data.fonts?.body) {
    B.bodyFont = `"${data.fonts.body}", "Inter", "DM Sans", sans-serif`;
  }
  if (data.fonts?.mono) {
    B.monoFont = `"${data.fonts.mono}", "JetBrains Mono", ui-monospace, monospace`;
  }

  if (data.copy) B.copy = { ...B.copy, ...data.copy };

  const tasks = [];
  if (data.logo) {
    tasks.push(loadImg(data.logo).then((im) => { B.logoImg = im; }));
  }

  const caps = data.captures || {};
  for (const [k, v] of Object.entries(caps)) {
    if (k === 'custom' && Array.isArray(v)) {
      v.forEach((pItem, idx) => {
        const key = String(pItem).split('/').pop().replace(/\.[^.]+$/, '');
        tasks.push(loadImg(pItem).then((im) => {
          if (im) {
            B.imgs[`custom${idx}`] = im;
            B.imgs[key] = im;
          }
        }));
      });
    } else if (typeof v === 'string') {
      tasks.push(loadImg(v).then((im) => { if (im) B.imgs[k] = im; }));
    }
  }

  const aiMap = data.aiImages || {};
  for (const [k, v] of Object.entries(aiMap)) {
    if (typeof v === 'string') {
      tasks.push(loadImg(v).then((im) => { if (im) B.ai[k] = im; }));
    }
  }

  await Promise.all(tasks);
  return B;
}
