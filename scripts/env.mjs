import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function launchHome() {
  return process.env.LAUNCH_VIDEO_HOME || path.join(os.homedir(), '.launch-video');
}

export function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

function findBinary(envVar, name) {
  if (process.env[envVar] && fs.existsSync(process.env[envVar])) return process.env[envVar];
  const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
  if (probe.status === 0 && probe.stdout.trim()) {
    const first = probe.stdout.trim().split(/\r?\n/)[0].trim();
    if (first && fs.existsSync(first)) return first;
  }
  const home = os.homedir();
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  const candidates = [
    path.join(launchHome(), 'bin', exe),
    path.join(home, '.local', 'bin', exe),
    `C:/ffmpeg/bin/${exe}`,
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`,
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

export function findFfmpeg() {
  return findBinary('FFMPEG', 'ffmpeg');
}

export function findFfprobe() {
  const explicit = findBinary('FFPROBE', 'ffprobe');
  if (explicit) return explicit;
  const ff = findFfmpeg();
  if (ff) {
    const sibling = path.join(path.dirname(ff), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
    if (fs.existsSync(sibling)) return sibling;
  }
  return null;
}

function isRunnablePython(cmd, pre = []) {
  try {
    const r = spawnSync(cmd, [...pre, '-c', 'import sys; assert sys.version_info >= (3, 10)'], {
      stdio: 'ignore',
      timeout: 5000,
    });
    return r.status === 0;
  } catch {
    return false;
  }
}

export function findVenvPython() {
  const venv = path.join(launchHome(), 'venv');
  const candidates = [
    path.join(venv, 'Scripts', 'python.exe'),
    path.join(venv, 'bin', 'python'),
    path.join(venv, 'bin', 'python3'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p) && isRunnablePython(p)) return p;
  }
  return null;
}

export function findSystemPython() {
  const candidates = process.platform === 'win32'
    ? [['py', ['-3.12']], ['py', ['-3.11']], ['py', ['-3']], ['python', []], ['python3', []]]
    : [['python3.12', []], ['python3.11', []], ['python3.10', []], ['python3', []], ['python', []]];
  for (const [cmd, pre] of candidates) {
    if (isRunnablePython(cmd, pre)) return { cmd, pre };
  }
  return null;
}

export function findUv() {
  const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['uv'], { encoding: 'utf8' });
  if (probe.status === 0 && probe.stdout.trim()) return probe.stdout.trim().split(/\r?\n/)[0].trim();
  const localUv = path.join(os.homedir(), '.local', 'bin', process.platform === 'win32' ? 'uv.exe' : 'uv');
  return fs.existsSync(localUv) ? localUv : null;
}
