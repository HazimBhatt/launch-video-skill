"""Estimated timing with NO voice or audio models (stdlib only): script.json -> data/lines.json + data/words.json."""
import argparse, json, re
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('project')
ap.add_argument('--wps', type=float, default=2.9, help='speaking rate in words per second')
a = ap.parse_args()
P = Path(a.project)
S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
speed = float(S.get('speed', 1.0))
t = float(S.get('lead', 0.35))
lines, words = [], []
for i, ln in enumerate(S['lines']):
    toks = ln['text'].split()
    letters = [len(re.sub(r'[^A-Za-z0-9]', '', w)) or 1 for w in toks]
    base = max(0.8, len(toks) / (a.wps * speed))
    unit = base / max(1.0, sum(l + 2.5 for l in letters))
    start = t
    for w, l in zip(toks, letters):
        d = (l + 2.5) * unit
        words.append({'w': w, 'line': i, 's': round(t, 3), 'e': round(t + d * 0.92, 3)})
        t += d
        if w.endswith(','):
            t += 0.14
        elif re.search(r'[.?!]$', w) and w is not toks[-1]:
            t += 0.28
    lines.append({'i': i, 'text': ln['text'], 'start': round(start, 3), 'end': round(t, 3)})
    t += float(ln.get('gap', S.get('gap', 0.25)))
dur = lines[-1]['end'] + float(S.get('outro', 1.0))
(P / 'data').mkdir(exist_ok=True)
(P / 'data/lines.json').write_text(json.dumps({'duration': round(dur, 3), 'estimated': True, 'lines': lines}, indent=1), encoding='utf-8')
(P / 'data/words.json').write_text(json.dumps(words, indent=1), encoding='utf-8')
print(f'estimated timing: {len(lines)} lines, {len(words)} words, {dur:.2f} s -> data/lines.json, data/words.json')
