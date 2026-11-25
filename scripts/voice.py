"""Narration for $0 on this computer: Kokoro-82M text-to-speech (Apache-2.0) via kokoro-onnx. No account, no API.

  node scripts/py.mjs scripts/voice.py <project>      script.json -> data/narration.wav + data/lines.json
  node scripts/py.mjs scripts/voice.py --list         voices that narrate product launches well
  node scripts/py.mjs scripts/voice.py --download     only fetch the model files (~340 MB, once)

Shares cached models with ~/.faceless-shorts/kokoro if already downloaded.
"""
import argparse, json, os, re, shutil, urllib.request
from pathlib import Path
import numpy as np
from scipy.io import wavfile

HOME = Path(os.environ.get('LAUNCH_VIDEO_HOME', Path.home() / '.launch-video'))
KDIR = HOME / 'kokoro'
ALT_KDIR = Path(os.environ.get('FACELESS_HOME', Path.home() / '.faceless-shorts')) / 'kokoro'
FILES = {
    'kokoro-v1.0.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
}
GOOD = {
    'am_michael': 'US male, sharp, authoritative founder/explainer (default)',
    'am_puck': 'US male, energetic, fast indie builder',
    'am_fenrir': 'US male, deeper, bold product reveal',
    'am_onyx': 'US male, calm, low contrast',
    'af_heart': 'US female, warm, trustworthy product lead',
    'af_bella': 'US female, bright, modern startup tone',
    'af_nicole': 'US female, crisp, close-mic',
    'bm_george': 'UK male, documentary / technical precision',
    'bm_fable': 'UK male, witty storyteller',
    'bf_emma': 'UK female, calm editorial',
}
SR = 24000


def ensure_models():
    KDIR.mkdir(parents=True, exist_ok=True)
    for name, url in FILES.items():
        p = KDIR / name
        if p.exists() and p.stat().st_size > 1_000_000:
            continue
        alt = ALT_KDIR / name
        if alt.exists() and alt.stat().st_size > 1_000_000:
            print(f'reusing cached {name} from {ALT_KDIR}...', flush=True)
            shutil.copy2(alt, p)
            continue
        print(f'downloading {name} (once)...', flush=True)
        tmp = p.with_suffix('.part')
        urllib.request.urlretrieve(url, tmp)
        tmp.rename(p)


def trim(x, thr=0.008):
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx):
        return x
    a = max(0, idx[0] - int(0.01 * SR))
    b = min(len(x), idx[-1] + int(0.03 * SR))
    return x[a:b]


def silences(x, thr=0.012, min_len=0.06):
    hop = int(0.01 * SR)
    n = len(x) // hop
    if n == 0:
        return []
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1))
    quiet = rms < thr * (np.abs(x).max() + 1e-9)
    out, st = [], None
    for f, q in enumerate(quiet):
        if q and st is None:
            st = f
        if (not q or f == n - 1) and st is not None:
            if (f - st) * 0.01 >= min_len:
                out.append((st * 0.01, f * 0.01))
            st = None
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project', nargs='?')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--download', action='store_true')
    ap.add_argument('--voice')
    ap.add_argument('--speed', type=float)
    a = ap.parse_args()
    if a.list:
        for k, v in GOOD.items():
            print(f'{k:12s} {v}')
        return
    ensure_models()
    if a.download:
        return
    if not a.project:
        ap.error('project folder missing')
    from kokoro_onnx import Kokoro
    P = Path(a.project)
    S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
    voice = a.voice or S.get('voice', 'am_michael')
    speed = a.speed or S.get('speed', 1.05)
    k = Kokoro(str(KDIR / 'kokoro-v1.0.onnx'), str(KDIR / 'voices-v1.0.bin'))
    lang = 'en-gb' if voice.startswith('b') else 'en-us'
    say = lambda text: trim(np.asarray(k.create(text, voice=voice, speed=speed, lang=lang)[0], dtype=np.float64))

    groups, cur = [], []
    for i, ln in enumerate(S['lines']):
        cur.append(i)
        if re.search(r'[.?!]["\')]*$', ln['text'].strip()) or ln.get('break') or i == len(S['lines']) - 1:
            groups.append(cur)
            cur = []

    out = [np.zeros(int(S.get('lead', 0.35) * SR))]
    t = len(out[0]) / SR
    lines = [None] * len(S['lines'])
    for g in groups:
        x = say(' '.join(S['lines'][i]['text'] for i in g))
        cuts = [0.0]
        if len(g) > 1:
            lens = np.array([len(say(S['lines'][i]['text'])) for i in g], dtype=float)
            pauses = silences(x)
            for c in np.cumsum(lens)[:-1] / (lens.sum() + 1e-9) * len(x) / SR:
                near = [p for p in pauses if abs((p[0] + p[1]) / 2 - c) < 0.4]
                if near:
                    p = min(near, key=lambda p: abs((p[0] + p[1]) / 2 - c))
                    cuts.append((p[0], p[1]))
                else:
                    cuts.append((c, c))
        n = len(x) / SR
        for j, i in enumerate(g):
            a_t = 0.0 if j == 0 else cuts[j][1]
            b_t = n if j == len(g) - 1 else cuts[j + 1][0]
            lines[i] = {'i': i, 'text': S['lines'][i]['text'], 'start': round(t + a_t, 3), 'end': round(t + b_t, 3)}
            print(f'{i:2d} {lines[i]["start"]:6.2f}-{lines[i]["end"]:6.2f}  {S["lines"][i]["text"]}', flush=True)
        gap = np.zeros(int(float(S['lines'][g[-1]].get('gap', S.get('gap', 0.25))) * SR))
        out += [x, gap]
        t += (len(x) + len(gap)) / SR
    outro = np.zeros(int(float(S.get('outro', 1.0)) * SR))
    out.append(outro)
    y = np.concatenate(out)
    y = y / (np.abs(y).max() + 1e-9) * 0.9
    (P / 'data').mkdir(exist_ok=True)
    wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
    dur = len(y) / SR
    (P / 'data/lines.json').write_text(
        json.dumps({'duration': round(dur, 3), 'mode': 'narrated', 'voice': voice, 'speed': speed, 'lines': lines}, indent=1),
        encoding='utf-8',
    )
    print(f'data/narration.wav ({dur:.2f} s, {voice} x{speed}) + data/lines.json. Next: words.py')


if __name__ == '__main__':
    main()
