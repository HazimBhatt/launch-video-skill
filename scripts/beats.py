"""Beat-grid timing for Voice-Free Kinetic Launch Videos (no TTS, no audio file needed -> pure stdlib).

  node scripts/py.mjs scripts/beats.py <project> [--bpm 124]

Reads script.json:
  "mode": "beats",
  "bpm": 124,           # musical tempo (beats per minute)
  "lead": 0.25,         # optional lead-in before beat 0
  "outro": 1.2,         # hold after final line
  "lines": [
    { "text": "Stop writing billing webhooks.", "caps": "STOP WRITING | *WEBHOOKS", "beats": 6 },
    ...
  ]

Writes:
  data/lines.json  (compatible with L(i), Le(i), T.dur)
  data/words.json  (compatible with Wd('word', line) and captions.js!)
  data/beats.json  (exact beat & bar timestamps for shots.js and mix.py!)
Also removes any stale data/narration.wav so mix.py knows this project is voice-free.
"""
import argparse, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

norm = lambda w: re.sub(r'[^a-z0-9]+', '', w.lower())


def default_beats(text):
    n = len([w for w in text.split() if norm(w)])
    # Snap natural reading pacing to musical 2-beat phrases (min 4 beats, typical 6 or 8)
    raw = max(4.0, n * 0.95)
    return int(round(raw / 2.0) * 2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project')
    ap.add_argument('--bpm', type=float)
    a = ap.parse_args()
    P = Path(a.project)
    S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
    bpm = float(a.bpm or S.get('bpm', 124))
    spb = 60.0 / bpm
    lead = float(S.get('lead', 0.25))
    outro = float(S.get('outro', 1.2))

    nar = P / 'data/narration.wav'
    if nar.exists():
        nar.unlink()

    t = lead
    lines, words = [], []
    for i, ln in enumerate(S['lines']):
        b_cnt = float(ln.get('beats') or default_beats(ln['text']))
        d_line = b_cnt * spb
        gap = float(ln.get('gap', 0.0))
        start = t
        end = t + d_line
        lines.append({'i': i, 'text': ln['text'], 'start': round(start, 3), 'end': round(end, 3), 'beats': b_cnt})

        # Spread tokens inside the active 86% of the beat window so chunks pop cleanly before the next bar
        toks = [w for w in ln['text'].split() if w.strip()]
        if toks:
            active = d_line * 0.86
            wts = [max(2, len(norm(w))) + 2.0 for w in toks]
            tot = sum(wts)
            cur = start + 0.03
            for w, wt in zip(toks, wts):
                wd = active * wt / tot
                words.append({'w': w, 'line': i, 's': round(cur, 3), 'e': round(cur + wd * 0.9, 3)})
                cur += wd
        print(f'{i:2d} {start:6.2f}-{end:6.2f} ({b_cnt:4.1f}b)  {ln["text"]}')
        t = end + gap

    dur = t + outro
    beats = []
    bt = lead
    k = 0
    while bt <= dur + 1e-6:
        beats.append({'i': k, 'bar': k // 4, 'beat_in_bar': k % 4, 't': round(bt, 3)})
        k += 1
        bt = lead + k * spb

    (P / 'data').mkdir(exist_ok=True)
    (P / 'data/lines.json').write_text(
        json.dumps({'duration': round(dur, 3), 'mode': 'beats', 'bpm': bpm, 'lead': lead, 'lines': lines}, indent=1),
        encoding='utf-8',
    )
    (P / 'data/words.json').write_text(json.dumps(words, indent=1), encoding='utf-8')
    (P / 'data/beats.json').write_text(json.dumps({'bpm': bpm, 'spb': round(spb, 4), 'lead': lead, 'beats': beats}, indent=1), encoding='utf-8')
    (P / 'data/words.txt').write_text('\n'.join(f"{w['s']:7.2f} {w['e']:7.2f}  L{w['line']:<2d} {w['w']}" for w in words), encoding='utf-8')
    from vo_script import export_vo_script
    vo_md, vo_txt, _ = export_vo_script(P)
    print(f'beat timing: {len(lines)} lines, {len(beats)} beats @ {bpm:.0f} BPM ({dur:.2f} s) -> data/lines.json, data/words.json, data/beats.json, {vo_md.name}')


if __name__ == '__main__':
    main()
