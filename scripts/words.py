"""Word timings with local Whisper (faster-whisper small.en, MIT) -> data/words.json [{w, line, s, e}].

  node scripts/py.mjs scripts/words.py <project>                  after voice.py (uses data/narration.wav + data/lines.json)
  node scripts/py.mjs scripts/words.py <project> --audio vo.m4a   YOUR OWN recording: becomes data/narration.wav + rebuilds lines.json

Uses Python's built-in wave module (no ffprobe required) and auto-locates ffmpeg when converting --audio.
"""
import argparse, json, os, re, shutil, struct, subprocess, wave
from difflib import SequenceMatcher
from pathlib import Path

norm = lambda w: re.sub(r'[^a-z0-9]+', '', w.lower())


def find_ffmpeg():
    env_ff = os.environ.get('FFMPEG')
    if env_ff and Path(env_ff).exists():
        return env_ff
    w = shutil.which('ffmpeg')
    if w:
        return w
    home = Path.home()
    launch_home = Path(os.environ.get('LAUNCH_VIDEO_HOME', home / '.launch-video'))
    exe = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
    for cand in [
        launch_home / 'bin' / exe,
        home / '.gemini/antigravity/scratch' / exe,
        home / '.local/bin' / exe,
        Path('C:/ffmpeg/bin/ffmpeg.exe'),
    ]:
        if cand.exists():
            return str(cand)
    return None


def wav_duration(wav_path):
    with wave.open(str(wav_path), 'rb') as wf:
        return wf.getnframes() / float(wf.getframerate())


def decode_wav_16k_f32(wav_path):
    """Read PCM WAV with stdlib + numpy (resamples 24k/48k/44.1k -> 16k mono float32 without external tools)."""
    import numpy as np
    with wave.open(str(wav_path), 'rb') as wf:
        sr = wf.getframerate()
        ch = wf.getnchannels()
        sw = wf.getsampwidth()
        raw = wf.readframes(wf.getnframes())
    if sw == 2:
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sw == 4:
        x = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise ValueError(f'Unsupported WAV sample width: {sw}')
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != 16000:
        from scipy import signal
        n_out = int(round(len(x) * 16000 / sr))
        x = signal.resample(x, n_out).astype(np.float32)
    return x


def align(script_words, heard, t0, t1):
    a = [norm(w) for w in script_words]
    b = [norm(h[0]) for h in heard]
    times = [None] * len(a)
    for blk in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (heard[blk.b + k][1], heard[blk.b + k][2])
    i = 0
    while i < len(a):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(a) and times[j] is None:
            j += 1
        lo = times[i - 1][1] if i > 0 else t0
        hi = times[j][0] if j < len(a) else t1
        if hi <= lo:
            hi = lo + 0.05 * (j - i)
        L = [max(1, len(a[k])) for k in range(i, j)]
        tot = sum(L)
        c = lo
        for k, l in zip(range(i, j), L):
            d = (hi - lo) * l / tot
            times[k] = (c, c + d * 0.9)
            c += d
        i = j
    return times


def inline_fallback(P, S):
    L = json.loads((P / 'data/lines.json').read_text(encoding='utf-8'))['lines']
    words = []
    for i, ln in enumerate(S['lines']):
        toks = [w for w in ln['text'].split() if norm(w)]
        if not toks:
            continue
        wts = [
            len(norm(w)) + 2.5 + (2.5 if w.endswith(',') else 4.5 if re.search(r'[.?!]$', w) and k < len(toks) - 1 else 0)
            for k, w in enumerate(toks)
        ]
        lo, hi = L[i]['start'], L[i]['end']
        c = lo
        tot = sum(wts)
        for w, wt in zip(toks, wts):
            d = (hi - lo) * wt / tot
            speak = d - (hi - lo) * (wt - len(norm(w)) - 2.5) / tot
            words.append({'w': w, 'line': i, 's': round(c, 3), 'e': round(c + speak * 0.92, 3)})
            c += d
    (P / 'data/words.json').write_text(json.dumps(words, indent=1), encoding='utf-8')
    (P / 'data/words.txt').write_text('\n'.join(f"{w['s']:7.2f} {w['e']:7.2f}  L{w['line']:<2d} {w['w']}" for w in words), encoding='utf-8')
    print(f'data/words.json: {len(words)} words (spread inside the voice line times)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project')
    ap.add_argument('--audio')
    a = ap.parse_args()
    P = Path(a.project)
    S = json.loads((P / 'script.json').read_text(encoding='utf-8'))
    ff = find_ffmpeg()

    if a.audio:
        if not ff:
            raise SystemExit('ffmpeg is required to convert --audio into data/narration.wav')
        (P / 'data').mkdir(exist_ok=True)
        subprocess.run([ff, '-v', 'error', '-y', '-i', a.audio, '-ac', '1', '-ar', '24000', str(P / 'data/narration.wav')], check=True)

    try:
        from faster_whisper import WhisperModel
        model = WhisperModel('small.en', device='cpu', compute_type='int8')
    except Exception as e:
        if a.audio or not (P / 'data/lines.json').exists():
            raise SystemExit(f'Whisper is needed for your own recording and could not load: {e}')
        print(f'Whisper unavailable ({type(e).__name__}); spreading words inside exact line times instead')
        return inline_fallback(P, S)

    try:
        audio_16k = decode_wav_16k_f32(P / 'data/narration.wav')
        segs, _ = model.transcribe(audio_16k, word_timestamps=True, vad_filter=False)
        heard = [(w.word.strip(), w.start + 0.04, w.end) for s in segs for w in s.words]
    except Exception as e:
        if a.audio or not (P / 'data/lines.json').exists():
            raise SystemExit(f'Whisper could not transcribe the recording: {e}')
        print(f'Whisper failed ({type(e).__name__}: {e}); spreading words inside exact line times instead')
        return inline_fallback(P, S)

    toks = [(w, i) for i, ln in enumerate(S['lines']) for w in ln['text'].split() if norm(w)]
    dur_audio = wav_duration(P / 'data/narration.wav')
    times = align([w for w, _ in toks], heard, 0.0, dur_audio)
    words = [{'w': w, 'line': i, 's': round(s, 3), 'e': round(e, 3)} for (w, i), (s, e) in zip(toks, times)]
    if a.audio or not (P / 'data/lines.json').exists():
        lines = []
        for i, ln in enumerate(S['lines']):
            ws = [w for w in words if w['line'] == i]
            lines.append({'i': i, 'text': ln['text'], 'start': ws[0]['s'], 'end': ws[-1]['e']})
        (P / 'data/lines.json').write_text(json.dumps({'duration': round(dur_audio, 3), 'mode': 'narrated', 'lines': lines}, indent=1), encoding='utf-8')
    else:
        L = json.loads((P / 'data/lines.json').read_text(encoding='utf-8'))['lines']
        for w in words:
            lo, hi = L[w['line']]['start'], L[w['line']]['end']
            w['s'] = round(min(max(w['s'], lo), hi), 3)
            w['e'] = round(min(max(w['e'], w['s']), hi), 3)
    (P / 'data/words.json').write_text(json.dumps(words, indent=1), encoding='utf-8')
    (P / 'data/words.txt').write_text('\n'.join(f"{w['s']:7.2f} {w['e']:7.2f}  L{w['line']:<2d} {w['w']}" for w in words), encoding='utf-8')
    print(f'data/words.json: {len(words)} words (Whisper heard {len(heard)})')


if __name__ == '__main__':
    main()
