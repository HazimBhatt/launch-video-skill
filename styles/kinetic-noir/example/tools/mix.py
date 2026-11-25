"""Launch Video soundtrack + SFX engine (100% procedural numpy/scipy, $0).

  python tools/mix.py [project=.] -> data/mix.wav (48 kHz stereo)

Reads:
  data/cues.json         (from node tools/capture.mjs cues)
  data/narration.wav     (optional, narrated mode from voice.py or words.py --audio)
  data/beats.json        (optional, beat-grid mode from beats.py)
  script.json "music":   "pulse" (dark kinetic SaaS synth) | "upbeat" (bright indie groove) |
                         "tension" (building drone + pulse) | "bed" (warm ambient pad) |
                         "none" | "audio/custom.mp3"

Cue types:
  whoosh riser drop click type pop snap chime slam swoosh tock alarm shutter slide
  keystroke morph matrix basshit confirm
"""
import json, os, shutil, subprocess, sys
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile

P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SR = 48000
rng = np.random.default_rng(42)
cj = json.loads((P / 'data/cues.json').read_text(encoding='utf-8'))
script = json.loads((P / 'script.json').read_text(encoding='utf-8'))
beats_path = P / 'data/beats.json'
beats_data = json.loads(beats_path.read_text(encoding='utf-8')) if beats_path.exists() else None
DUR = float(cj['duration'])
N = int(DUR * SR) + SR // 10


def find_ffmpeg():
    env_ff = os.environ.get('FFMPEG')
    if env_ff and Path(env_ff).exists():
        return env_ff
    w = shutil.which('ffmpeg')
    if w:
        return w
    home = Path.home()
    lh = Path(os.environ.get('LAUNCH_VIDEO_HOME', home / '.launch-video'))
    exe = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
    for cand in [lh / 'bin' / exe, home / '.gemini/antigravity/scratch' / exe, home / '.local/bin' / exe]:
        if cand.exists():
            return str(cand)
    return 'ffmpeg'


def lp(x, f, o=2):
    b, a = signal.butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, f, o=2):
    b, a = signal.butter(o, max(20, f) / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, f0, f1, o=2):
    b, a = signal.butter(o, [max(20, f0) / (SR / 2), min(SR / 2 - 100, f1) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def db(x):
    return 10 ** (x / 20)


def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def env(n, a=0.004, r=None):
    e = np.ones(n)
    na = max(1, min(n, int(a * SR)))
    e[:na] = np.linspace(0, 1, na)
    rest = n - na
    if rest > 0:
        e[na:] = np.exp(-np.linspace(0, r or 5, rest))
    return e


def sweep(f0, f1, d, shape='exp'):
    t = tt(d)
    f = f0 * (f1 / max(1e-3, f0)) ** (t / max(1e-4, d)) if shape == 'exp' else f0 + (f1 - f0) * t / max(1e-4, d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(d):
    return rng.standard_normal(max(1, int(d * SR)))


# ---------- SFX library ----------
def whoosh(d=0.34, **_):
    n = noise(d)
    lo, hi = lp(n, 480), lp(n, 2400)
    k = np.sin(np.pi * np.linspace(0, 1, len(n)))
    x = (lo * (1 - k) + hi * k) * k ** 1.4
    return x / (np.abs(x).max() + 1e-9) * 0.55


def swoosh(d=0.22, **_):
    n = bp(noise(d), 450, 3200)
    k = np.sin(np.pi * np.linspace(0, 1, len(n))) ** 1.2
    return (n / (np.abs(n).max() + 1e-9) * 0.4 + sweep(350, 1200, d) * 0.1) * k


def riser(d=0.9, **_):
    n = bp(noise(d), 220, 3600)
    k = np.linspace(0, 1, len(n))
    swell = (k ** 2.1) * np.sin(np.pi * np.minimum(1, k * 0.96))
    tone = sweep(110, 440, d, 'exp') * (k ** 2.4) * 0.25
    return lp((n / (np.abs(n).max() + 1e-9) * 0.5 + tone) * swell, 4400)


def drop(d=0.55, **_):
    t = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 85 * np.exp(-t * 28)) / SR) * env(len(t), 0.002, 4.5)
    air = lp(noise(d), 380) * env(len(t), 0.002, 12) * 0.35
    return np.tanh(1.35 * (sub * 0.9 + air)) * 0.9


def click(**_):
    d = 0.06
    t = tt(d)
    body = sweep(1400, 320, d) * env(len(t), 0.001, 14)
    tick = bp(noise(d), 1200, 4200) * env(len(t), 0.0005, 22) * 0.45
    return lp(body * 0.65 + tick, 4400) * 0.85


def type_sfx(d=0.8, **_):
    x = np.zeros(max(1, int(d * SR)))
    step = 0.055
    pos = 0.0
    while pos < d - 0.04:
        st = int(pos * SR)
        kd = 0.035
        t = tt(kd)
        f = rng.uniform(750, 1250)
        k = (np.sin(2 * np.pi * f * t) * 0.5 + bp(noise(kd), 900, 3400) * 0.35) * env(len(t), 0.0005, 18)
        n = min(len(k), len(x) - st)
        if n > 0:
            x[st:st + n] += k[:n] * rng.uniform(0.55, 1.0)
        pos += step * rng.uniform(0.7, 1.35)
    return lp(x, 4200) * 0.75


def pop(**_):
    d = 0.11
    x = sweep(620, 260, d) * env(int(d * SR), 0.002, 6)
    return lp(x, 3000) * 0.75


def snap(**_):
    d = 0.09
    t = tt(d)
    x = sweep(900, 220, d) * env(len(t), 0.001, 10) + bp(noise(d), 1400, 3800) * env(len(t), 0.001, 16) * 0.3
    return lp(x, 4200) * 0.8


def chime(d=0.95, **_):
    freqs = [523.25, 659.25, 783.99, 1046.5]
    x = np.zeros(int(d * SR))
    for i, f in enumerate(freqs):
        st = int(i * 0.045 * SR)
        rem = len(x) - st
        if rem <= 10:
            continue
        t = np.arange(rem) / SR
        tone = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * env(rem, 0.004, 5.2)
        x[st:] += tone * 0.28
    return lp(x, 4600)


def slam(**_):
    d = 0.45
    t = tt(d)
    x = np.sin(2 * np.pi * np.cumsum(48 + 75 * np.exp(-t * 24)) / SR) * env(len(t), 0.002, 6)
    return np.tanh(1.5 * (x + lp(noise(d), 900) * env(len(t), 0.001, 10) * 0.55)) * 0.9


def tock(**_):
    d = 0.08
    t = tt(d)
    return (np.sin(2 * np.pi * 520 * t) + 0.25 * np.sin(2 * np.pi * 1040 * t)) * env(len(t), 0.001, 10) * 0.45


def alarm(d=1.6, **_):
    x = np.zeros(int(d * SR))
    one = np.sin(2 * np.pi * 170 * tt(0.2)) * env(int(0.2 * SR), 0.015, 5)
    for st in np.arange(0, max(0.2, d - 0.2), 0.45):
        i = int(st * SR)
        n = min(len(one), len(x) - i)
        if n > 0:
            x[i:i + n] += one[:n]
    return lp(x, 950) * 0.55


def shutter(**_):
    d = 0.12
    a = bp(noise(0.03), 1200, 4200) * env(int(0.03 * SR), 0.001, 18)
    b = bp(noise(0.04), 900, 3400) * env(int(0.04 * SR), 0.001, 16)
    x = np.concatenate([a, np.zeros(int(0.035 * SR)), b * 0.75])
    return lp(x, 4400) * 0.75


def slide(d=0.9, **_):
    n = lp(noise(d), 720)
    e = np.sin(np.pi * np.linspace(0, 1, len(n))) ** 2
    return n / (np.abs(n).max() + 1e-9) * e * 0.35 + sweep(240, 110, d) * e * 0.08


def keystroke(**_):
    d = 0.028
    t = tt(d)
    f = float(rng.uniform(920, 1340))
    body = np.sin(2 * np.pi * f * t) * env(len(t), 0.0005, 19) * 0.55
    transient = bp(noise(d), 1400, 4400) * env(len(t), 0.0004, 24) * 0.45
    return lp(body + transient, 4500) * 0.8


def morph(d=0.38, **_):
    t = tt(d)
    k = np.sin(np.pi * np.linspace(0, 1, len(t))) ** 1.3
    tonal = sweep(340, 680, d, 'exp') * 0.32 * k
    air = bp(noise(d), 650, 3400) * k * 0.28
    return lp(tonal + air, 4200)


def matrix(d=1.2, **_):
    x = np.zeros(max(1, int(d * SR)))
    step = 0.085
    pos = 0.0
    idx = 0
    while pos < d - 0.04:
        st = int(pos * SR)
        bd = 0.055
        bt = tt(bd)
        f = 580 + (idx % 5) * 95
        blip = (np.sin(2 * np.pi * f * bt) + 0.25 * np.sin(4 * np.pi * f * bt)) * env(len(bt), 0.001, 14)
        n = min(len(blip), len(x) - st)
        if n > 0:
            x[st:st + n] += blip[:n] * 0.35
        pos += step
        idx += 1
    return lp(x, 3800)


def basshit(d=0.42, **_):
    t = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(40 + 62 * np.exp(-t * 24)) / SR) * env(len(t), 0.002, 5.2)
    return np.tanh(1.25 * sub) * 0.82


def confirm(**_):
    d = 0.24
    x = np.zeros(int(d * SR))
    for i, f in enumerate((740.0, 1108.73)):
        st = int(i * 0.055 * SR)
        rem = len(x) - st
        if rem > 8:
            t = np.arange(rem) / SR
            x[st:] += np.sin(2 * np.pi * f * t) * env(rem, 0.002, 9.5) * 0.36
    return lp(x, 4200)


FX = dict(
    whoosh=whoosh, swoosh=swoosh, riser=riser, drop=drop, click=click,
    type=type_sfx, pop=pop, snap=snap, chime=chime, slam=slam,
    tock=tock, alarm=alarm, shutter=shutter, slide=slide,
    keystroke=keystroke, morph=morph, matrix=matrix, basshit=basshit, confirm=confirm,
)
LEVEL = dict(
    whoosh=-15, swoosh=-14, riser=-14, drop=-8, click=-11,
    type=-16, pop=-13, snap=-12, chime=-13, slam=-9,
    tock=-16, alarm=-15, shutter=-13, slide=-16,
    keystroke=-15, morph=-14, matrix=-14, basshit=-9, confirm=-12,
)


# ---------- Procedural music beds ----------
def get_bpm_grid():
    if beats_data:
        return float(beats_data['bpm']), float(beats_data.get('lead', 0.25))
    return float(script.get('bpm', 124)), float(script.get('lead', 0.3))


def music_pulse():
    """Modern driving indie SaaS synth groove: warm sub bass + muted analog pluck + clean percussive pulse."""
    bpm, lead = get_bpm_grid()
    spb = 60.0 / bpm
    x = np.zeros(N)
    roots = [65.41, 55.00, 43.65, 49.00]  # C2, A1, F1, G1 (clean minor/cinematic lift)
    chords = [
        [261.63, 311.13, 392.00],  # Cm
        [220.00, 261.63, 329.63],  # Am
        [174.61, 220.00, 261.63],  # F
        [196.00, 246.94, 293.66],  # G
    ]
    n_beats = int(np.ceil((DUR - lead) / spb)) + 2
    for b in range(n_beats):
        st = int((lead + b * spb) * SR)
        if st >= N or st < 0:
            continue
        bar = (b // 4) % 4
        bib = b % 4
        # Soft punchy kick on 0 and 2
        if bib in (0, 2):
            kd = min(0.24, spb * 0.7)
            kt = tt(kd)
            kick = np.sin(2 * np.pi * np.cumsum(42 + 95 * np.exp(-kt * 32)) / SR) * env(len(kt), 0.002, 7.5)
            n = min(len(kick), N - st)
            x[st:st + n] += kick[:n] * 0.55
        # Soft rim/clap on 1 and 3
        if bib in (1, 3):
            sd = 0.09
            sn = bp(noise(sd), 900, 3200) * env(int(sd * SR), 0.001, 14)
            n = min(len(sn), N - st)
            x[st:st + n] += sn[:n] * 0.18
        # Subtle offbeat hi-hat pulse
        off = st + int(0.5 * spb * SR)
        if 0 <= off < N:
            hd = 0.035
            hh = bp(noise(hd), 2600, 4800) * env(int(hd * SR), 0.001, 18)
            n = min(len(hh), N - off)
            x[off:off + n] += hh[:n] * 0.09
        # Warm sub bass pulse on each eighth note
        for sub_idx in (0, 1):
            ps = st + int(sub_idx * 0.5 * spb * SR)
            if 0 <= ps < N:
                bd = spb * 0.45
                bt = tt(bd)
                f = roots[bar]
                bass = (np.sin(2 * np.pi * f * bt) + 0.35 * np.sin(4 * np.pi * f * bt)) * env(len(bt), 0.008, 4.5)
                n = min(len(bass), N - ps)
                x[ps:ps + n] += bass[:n] * (0.34 if sub_idx == 0 else 0.22)
        # Warm synth pad stab at bar start
        if bib == 0:
            pd = min(spb * 3.9, DUR - (lead + b * spb))
            if pd > 0.2:
                pt = tt(pd)
                pe = np.minimum(1, pt / 0.15) * np.minimum(1, (pd - pt) / 0.35)
                pad = sum(np.sin(2 * np.pi * f * pt) + 0.2 * np.sin(4 * np.pi * f * pt) for f in chords[bar]) * pe * 0.085
                n = min(len(pad), N - st)
                x[st:st + n] += pad[:n]
        # Clean arp pluck on 16th/8th steps
        for step in (0, 1):
            ps = st + int(step * 0.5 * spb * SR)
            if 0 <= ps < N:
                ch = chords[bar]
                pf = ch[(b * 2 + step) % 3] * (2 if (b + step) % 4 == 2 else 1)
                pd2 = min(0.32, spb * 0.7)
                pt2 = tt(pd2)
                pl = (np.sin(2 * np.pi * pf * pt2) + 0.22 * np.sin(4 * np.pi * pf * pt2)) * env(len(pt2), 0.003, 7.5)
                n = min(len(pl), N - ps)
                x[ps:ps + n] += pl[:n] * 0.12

    x = lp(x, 4200)
    fade = np.ones(N)
    fi = min(N, int(0.15 * SR))
    fo = min(N, int(0.9 * SR))
    fade[:fi] *= np.linspace(0, 1, fi)
    fade[-fo:] *= np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade


def music_upbeat():
    """Bright indie marimba/kalimba chord groove for problem-story and bento-proof."""
    bpm, lead = get_bpm_grid()
    spb = 60.0 / bpm
    x = np.zeros(N)
    chords = [
        [261.63, 329.63, 392.00],  # C
        [220.00, 261.63, 329.63],  # Am
        [174.61, 220.00, 261.63],  # F
        [196.00, 246.94, 293.66],  # G
    ]
    roots = [130.81, 110.00, 87.31, 98.00]
    n_beats = int(np.ceil((DUR - lead) / spb)) + 2
    for b in range(n_beats):
        st = int((lead + b * spb) * SR)
        if st >= N or st < 0:
            continue
        bar = (b // 4) % 4
        bib = b % 4
        if bib in (0, 2):
            kt = tt(0.18)
            kick = np.sin(2 * np.pi * np.cumsum(48 + 80 * np.exp(-kt * 30)) / SR) * env(len(kt), 0.002, 8)
            n = min(len(kick), N - st)
            x[st:st + n] += kick[:n] * 0.42
        for k in (0, 1):
            ps = st + int(k * 0.5 * spb * SR)
            if 0 <= ps < N:
                f = chords[bar][(b * 2 + k) % 3] * (2 if (b + k) % 3 == 0 else 1)
                pt = tt(0.35)
                pl = (np.sin(2 * np.pi * f * pt) + 0.3 * np.sin(4 * np.pi * f * pt)) * env(len(pt), 0.002, 8)
                n = min(len(pl), N - ps)
                x[ps:ps + n] += pl[:n] * 0.16
                if k == 0:
                    bt = tt(spb * 0.85)
                    bass = np.sin(2 * np.pi * roots[bar] * bt) * env(len(bt), 0.01, 4)
                    nb = min(len(bass), N - ps)
                    x[ps:ps + nb] += bass[:nb] * 0.26
    x = lp(x, 3800)
    fade = np.ones(N)
    fo = min(N, int(0.9 * SR))
    fade[-fo:] *= np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade


def music_bed():
    bpm = 100
    beat = 60 / bpm
    bar = beat * 4
    chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    x = np.zeros(N)
    nb = int(np.ceil(DUR / bar)) + 1
    for b in range(nb):
        ch = chords[b % 4]
        st = int(b * bar * SR)
        n = int(bar * SR)
        if st >= N:
            break
        t = tt(bar)
        e = np.minimum(1, t / 0.4) * np.minimum(1, (bar - t) / 0.4)
        pad = sum(np.sin(2 * np.pi * f / 2 * t) + 0.25 * np.sin(2 * np.pi * f * t) for f in ch) * e * 0.10
        x[st:st + min(n, N - st)] += pad[:max(0, min(n, N - st))]
        for k in range(8):
            f = ch[[0, 1, 2, 1, 2, 0, 1, 2][k]] * (2 if k % 4 == 2 else 1)
            ps = st + int(k * beat / 2 * SR)
            pn = int(0.5 * SR)
            if ps + pn >= N:
                continue
            pt = tt(0.5)
            pl = (np.sin(2 * np.pi * f * pt) + 0.35 * np.sin(4 * np.pi * f * pt)) * env(pn, 0.003, 7) * 0.12
            x[ps:ps + pn] += pl
    x = lp(x, 3200)
    fade = np.ones(N)
    fo = min(N, int(1.0 * SR))
    fade[-fo:] = np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade


def music_tension():
    t = np.arange(N) / SR
    x = np.zeros(N)
    for f, g in [(55, 0.5), (82.4, 0.3), (110, 0.2), (130.8, 0.12)]:
        x += np.sin(2 * np.pi * f * t + np.sin(t * 0.3) * 0.5) * g
    x *= 0.55 + 0.45 * np.sin(2 * np.pi * t / 8) ** 2
    x = lp(x, 2200)
    fade = np.ones(N)
    fo = min(N, int(1.2 * SR))
    fi = min(N, int(0.5 * SR))
    fade[-fo:] *= np.linspace(1, 0, fo)
    fade[:fi] *= np.linspace(0, 1, fi)
    return x / (np.abs(x).max() + 1e-9) * fade


def load_audio(f):
    ff = find_ffmpeg()
    out = subprocess.run([ff, '-v', 'error', '-i', str(f), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).reshape(-1, 2).astype(np.float64)


mix = np.zeros((N, 2))
vf = P / 'data/narration.wav'
voice = None
if vf.exists():
    v = load_audio(vf)[:N]
    voice = np.zeros((N, 2))
    voice[:len(v)] = v
    rms = np.sqrt(np.mean(voice ** 2) + 1e-12)
    voice *= db(-19) / rms
    mix += voice

mus = script.get('music', 'pulse')
if mus and mus != 'none':
    m = (
        music_pulse() if mus == 'pulse'
        else music_upbeat() if mus == 'upbeat'
        else music_tension() if mus == 'tension'
        else music_bed() if mus == 'bed'
        else None
    )
    if m is None:
        a = load_audio(P / mus)[:N]
        m = np.zeros(N)
        m[:len(a)] = a.mean(1)
        m /= np.abs(m).max() + 1e-9
    # Voice-free beat mode sits punchier (-15 dB) than narrated background (-24 dB)
    m = np.stack([m, m], 1) * db(-24 if voice is not None else -15)
    if voice is not None:
        lev = np.abs(voice.mean(1))
        lev = signal.lfilter([1 - 0.9995], [1, -0.9995], lev)
        lev /= lev.max() + 1e-9
        m *= (1 - 0.55 * np.clip(lev * 3, 0, 1))[:, None]
    mix += m

for c in cj['cues']:
    fn = FX.get(c['type'])
    if not fn:
        print('unknown cue type, skipped:', c['type'])
        continue
    x = fn(**({'d': c['dur']} if c.get('dur') else {}))
    x = lp(x, 4800) * db(LEVEL[c['type']]) * c.get('gain', 1.0) / (np.abs(x).max() + 1e-9) * 0.9
    i = int(c['t'] * SR)
    n = min(len(x), N - i)
    if n > 0 and i >= 0:
        pan = c.get('pan', 0.0)
        mix[i:i + n, 0] += x[:n] * (1 - max(0, pan))
        mix[i:i + n, 1] += x[:n] * (1 + min(0, pan))

mix = np.tanh(mix * 1.18) / 1.18
sfx_only = (voice is None) and (not mus or mus == 'none')
peak = float(np.abs(mix).max())
if sfx_only:
    if peak > db(-3):
        mix *= db(-3) / (peak + 1e-9)
else:
    mix *= db(-1) / (peak + 1e-9)
wavfile.write(P / 'data/mix.wav', SR, (mix * 32767).astype(np.int16))
mode_lbl = 'yes' if voice is not None else ('NO (SFX-only, ready for external VO)' if sfx_only else 'NO (beats/music)')
print(f"data/mix.wav: {DUR:.2f} s · voice: {mode_lbl} · music: {mus} · {len(cj['cues'])} cues")
