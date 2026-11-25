// Timing: every visual beat, cut, cursor move, and caption sits on the narration or musical beat clock.
export const T = { dur: 0, mode: 'beats', bpm: 124, lines: [], words: [], beats: [] };
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']+/g, '');

export async function loadTiming() {
  const get = async (f, req = true) => {
    const r = await fetch(f, { cache: 'no-store' });
    if (!r.ok) {
      if (!req) return null;
      throw new Error(`missing ${f}: run beats.py or voice.py + words.py`);
    }
    return r.json();
  };
  const lines = await get('data/lines.json', true);
  const words = await get('data/words.json', true);
  const beats = await get('data/beats.json', false);
  T.lines = lines.lines;
  T.words = words;
  T.dur = lines.duration;
  T.mode = lines.mode || 'narrated';
  T.bpm = lines.bpm || beats?.bpm || 124;
  T.beats = beats?.beats || [];
  return T;
}

export const L = (i) => { const l = T.lines[i]; if (!l) throw new Error(`no line ${i}`); return l.start; };
export const Le = (i) => { const l = T.lines[i]; if (!l) throw new Error(`no line ${i}`); return l.end; };
export function Wd(word, line, which = 's') {
  const n = norm(word);
  const hit = T.words.find((w) => (line == null || w.line === line) && norm(w.w).startsWith(n));
  if (!hit) throw new Error(`word "${word}" not found${line != null ? ` in line ${line}` : ''}`);
  return hit[which];
}
export const lineWords = (i) => T.words.filter((w) => w.line === i);

/** Musical beat pulse in 0..1 (peaks at 1 on each beat, decays smoothly). Great for subtle glow/scale thumps! */
export function beatPulse(t, periodBeats = 1) {
  const spb = (60 / (T.bpm || 124)) * periodBeats;
  const lead = T.beats[0]?.t || 0;
  if (t < lead) return 0;
  const ph = ((t - lead) % spb) / spb;
  return Math.exp(-ph * 5.5);
}
export const beatTime = (idx) => (T.beats[idx] ? T.beats[idx].t : (T.beats[0]?.t || 0) + idx * (60 / (T.bpm || 124)));
