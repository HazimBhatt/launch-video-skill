#!/usr/bin/env node
// One-time setup for launch-video (Windows / macOS / Linux). Safe to re-run.
// Checks Node 22+, Chrome, ffmpeg; builds ~/.launch-video/venv (numpy, scipy, kokoro-onnx, faster-whisper);
// downloads (or reuses from ~/.faceless-shorts) Kokoro-82M + Whisper small.en.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchHome, findChrome, findFfmpeg, findVenvPython, findSystemPython, findUv } from './env.mjs';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = launchHome();
const VENV = path.join(HOME, 'venv');
const BIN_DIR = path.join(HOME, 'bin');
const args = new Set(process.argv.slice(2));
const SKIP_MODELS = args.has('--skip-models');

const say = (k, v) => console.log(`${k.padEnd(14)} ${v}`);
let ok = true;

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= 22) say('node', `ok (v${process.versions.node})`);
else { say('node', `MISSING or too old (v${process.versions.node}): need Node.js 22+`); ok = false; }

const chrome = findChrome();
if (chrome) say('chrome', `ok (${chrome})`);
else { say('chrome', 'MISSING: install Google Chrome or set CHROME=/path/to/chrome'); ok = false; }

let ffmpeg = findFfmpeg();
if (!ffmpeg) {
  const scratchFf = path.join(os.homedir(), '.gemini', 'antigravity', 'scratch', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(scratchFf)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
    const dst = path.join(BIN_DIR, path.basename(scratchFf));
    fs.copyFileSync(scratchFf, dst);
    ffmpeg = dst;
  }
}
if (ffmpeg) {
  // Ensure ~/.launch-video/bin has a copy if ffmpeg came from scratch or non-PATH location
  const dst = path.join(BIN_DIR, path.basename(ffmpeg));
  if (!fs.existsSync(dst) && ffmpeg !== dst) {
    try { fs.mkdirSync(BIN_DIR, { recursive: true }); fs.copyFileSync(ffmpeg, dst); } catch {}
  }
  say('ffmpeg', `ok (${ffmpeg})`);
} else {
  say('ffmpeg', 'MISSING: install ffmpeg (winget install Gyan.FFmpeg.Essentials | brew install ffmpeg | apt install ffmpeg)');
  ok = false;
}

fs.mkdirSync(HOME, { recursive: true });

let py = findVenvPython();
const uv = findUv();
if (!py) {
  console.log(`building Python env in ${VENV}...`);
  if (uv) {
    let r = spawnSync(uv, ['venv', '--python', '3.11', VENV], { stdio: 'inherit' });
    if (r.status !== 0) r = spawnSync(uv, ['venv', VENV], { stdio: 'inherit' });
    py = findVenvPython();
  }
  if (!py) {
    const sysPy = findSystemPython();
    if (sysPy) {
      spawnSync(sysPy.cmd, [...sysPy.pre, '-m', 'venv', VENV], { stdio: 'inherit' });
      py = findVenvPython();
    }
  }
}

if (py) {
  const check = spawnSync(py, ['-c', 'import numpy, scipy, kokoro_onnx, faster_whisper'], { stdio: 'ignore' });
  if (check.status !== 0) {
    console.log('installing numpy, scipy, kokoro-onnx, faster-whisper...');
    if (uv) {
      const r = spawnSync(uv, ['pip', 'install', '--python', py, 'numpy', 'scipy', 'kokoro-onnx', 'faster-whisper'], { stdio: 'inherit' });
      if (r.status !== 0) {
        // Fallback: numpy + scipy always needed for beat/audio mix even if faster-whisper wheel lags on latest Python
        spawnSync(uv, ['pip', 'install', '--python', py, 'numpy', 'scipy'], { stdio: 'inherit' });
      }
    } else {
      spawnSync(py, ['-m', 'pip', 'install', '--upgrade', 'pip'], { stdio: 'inherit' });
      spawnSync(py, ['-m', 'pip', 'install', 'numpy', 'scipy', 'kokoro-onnx', 'faster-whisper'], { stdio: 'inherit' });
    }
  }
  const hasCore = spawnSync(py, ['-c', 'import numpy, scipy'], { stdio: 'ignore' }).status === 0;
  const hasVoice = spawnSync(py, ['-c', 'import kokoro_onnx, faster_whisper'], { stdio: 'ignore' }).status === 0;
  if (hasCore && hasVoice) say('python-env', `ok (${VENV})`);
  else if (hasCore) {
    say('python-env', `partial (${VENV}: numpy/scipy ok, kokoro/whisper missing)`);
    ok = false;
  } else {
    say('python-env', `BROKEN (${VENV})`);
    ok = false;
  }

  if (!SKIP_MODELS && hasVoice) {
    const v = spawnSync(py, [path.join(SKILL, 'scripts', 'voice.py'), '--download'], { stdio: 'inherit' });
    if (v.status === 0) say('voice', `ok (Kokoro, ${path.join(HOME, 'kokoro')})`);
    else { say('voice', 'model download FAILED (check internet connection and re-run)'); ok = false; }

    const w = spawnSync(py, ['-c', "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')"], { stdio: 'inherit' });
    if (w.status === 0) say('whisper', 'ok (small.en)');
    else { say('whisper', 'model download FAILED (check internet connection and re-run)'); ok = false; }
  } else if (SKIP_MODELS) {
    say('models', 'skipped (--skip-models)');
  }
} else {
  say('python-env', 'MISSING: install Python 3.10+ or uv (https://docs.astral.sh/uv/)');
  ok = false;
}

if (ok) {
  console.log('\nAll set');
  process.exit(0);
} else {
  console.log('\nFix the MISSING/FAILED items above, then re-run setup.mjs.');
  process.exit(1);
}
