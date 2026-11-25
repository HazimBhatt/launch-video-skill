#!/usr/bin/env node
// Launch Video End-to-End Self-Test:
//   node scripts/selftest.mjs [--keep]
// Tests: env discovery -> URL probe (local deterministic server) -> scaffold (new_video.mjs) ->
//        beats timing -> narrated timing (Kokoro + Whisper) -> mix.py -> 16:9 + 9:16 check -> draft MP4 + audio level check.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome, findFfmpeg, findVenvPython } from './env.mjs';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = path.join(SKILL, 'scripts');
const KEEP = process.argv.includes('--keep');

function run(cmd, args, cwd = SKILL, label = `${cmd} ${args.join(' ')}`) {
  console.log(`\n▶ ${label}`);
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${label}`));
    });
  });
}

function assertExists(p, minBytes = 100) {
  if (!fs.existsSync(p)) throw new Error(`Missing expected file: ${p}`);
  const sz = fs.statSync(p).size;
  if (sz < minBytes) throw new Error(`File unexpectedly tiny (${sz} B): ${p}`);
}

const chrome = findChrome();
const ffmpeg = findFfmpeg();
const py = findVenvPython();
if (!chrome) throw new Error('Chrome not found. Run: node scripts/setup.mjs');
if (!ffmpeg) throw new Error('ffmpeg not found. Run: node scripts/setup.mjs');
if (!py) throw new Error('Python venv not found. Run: node scripts/setup.mjs');
console.log('✓ Environment ready:', { chrome, ffmpeg, py });

const tmpRoot = path.join(os.tmpdir(), `launch-video-selftest-${Date.now()}`);
fs.mkdirSync(tmpRoot, { recursive: true });
const probeDir = path.join(tmpRoot, 'probed');

// Deterministic test SaaS page to verify probe.mjs end-to-end
const MOCK_HTML = `<!doctype html>
<html>
<head>
  <title>PulseDock — Zero-Downtime Preview Clusters</title>
  <meta name="description" content="Spin up full Kubernetes preview clusters per pull request in 9 seconds." />
  <style>
    body { margin:0; background:#090B12; color:#F8FAFC; font-family: -apple-system, sans-serif; padding:40px 64px; }
    header { display:flex; justify-content:space-between; align-items:center; margin-bottom:48px; }
    .btn { background:#0EA5E9; color:#FFFFFF; padding:14px 26px; border-radius:10px; text-decoration:none; font-weight:700; display:inline-block; }
    .demo { margin-top:32px; background:#111827; border:1px solid rgba(255,255,255,0.12); border-radius:18px; padding:28px; min-height:280px; }
    #pricing { margin-top:700px; padding:40px; background:#111827; border-radius:18px; min-height:240px; }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:center;gap:10px">
      <svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><circle cx="16" cy="16" r="7" fill="#fff"/></svg>
      <b>PulseDock</b>
    </div>
    <a class="btn" href="#start">Deploy Preview Free</a>
  </header>
  <h1>Preview clusters per PR in 9 seconds.</h1>
  <p>Ephemeral Kubernetes environments with seeded Postgres and SSL in one CLI flag. Trusted by 1,240 teams at 99.98% uptime.</p>
  <pre>npx pulsedock init --cluster</pre>
  <div class="demo">
    <h2>Live Cluster Dashboard · pr-842</h2>
    <p>Provisioned in 9s · Auto-expires on merge · $0 idle billing</p>
  </div>
  <section id="pricing">
    <h2>Simple Indie Pricing</h2>
    <p>Starter $19/mo · Pro $49/mo · Free forever hobby tier</p>
  </section>
</body>
</html>`;

const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(MOCK_HTML);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const mockUrl = `http://127.0.0.1:${srv.address().port}/`;

try {
  // 1. Probe URL
  await run('node', [path.join(SCRIPTS, 'probe.mjs'), mockUrl, probeDir, '--wait', '400'], SKILL, 'probe.mjs on mock SaaS URL');
  const brand = JSON.parse(fs.readFileSync(path.join(probeDir, 'data/brand.json'), 'utf8'));
  if (brand.palette.accent !== '#0EA5E9') throw new Error(`Expected accent #0EA5E9, got ${brand.palette.accent}`);
  assertExists(path.join(probeDir, 'assets/brand/logo.svg'), 40);
  assertExists(path.join(probeDir, 'assets/captures/desktop-hero.png'), 4000);
  assertExists(path.join(probeDir, 'assets/captures/ui-showcase.png'), 2000);
  assertExists(path.join(probeDir, 'assets/captures/pricing.png'), 2000);
  assertExists(path.join(probeDir, 'assets/captures/mobile-hero.png'), 2000);
  console.log(`✓ probe.mjs extracted brand "${brand.name}" (accent ${brand.palette.accent}, theme ${brand.theme})`);

  // 2. Scaffold beats project (kinetic-noir) & test 16:9 + 9:16 + MP4 render + audio volume
  await run('node', [
    path.join(SCRIPTS, 'new_video.mjs'), 'kinetic-noir', 'test-beats',
    '--dir', tmpRoot, '--from', probeDir, '--aspect', '16:9', '--mode', 'beats',
  ], SKILL, 'new_video.mjs (kinetic-noir, beats)');
  const beatsProj = path.join(tmpRoot, 'test-beats');
  await run('node', [path.join(SCRIPTS, 'py.mjs'), path.join(SCRIPTS, 'beats.py'), beatsProj], SKILL, 'beats.py');
  await run('node', ['tools/capture.mjs', 'check'], beatsProj, 'capture.mjs check (16:9)');
  await run('node', ['tools/capture.mjs', 'check', '--aspect=9:16'], beatsProj, 'capture.mjs check (9:16)');
  await run('node', ['tools/capture.mjs', 'cues'], beatsProj, 'capture.mjs cues');
  await run('node', [path.join(SCRIPTS, 'py.mjs'), 'tools/mix.py', beatsProj], beatsProj, 'mix.py (beats)');
  assertExists(path.join(beatsProj, 'data/mix.wav'), 40000);
  await run('node', ['tools/capture.mjs', 'video', 'renders/draft.mp4', '0', '3', '--draft'], beatsProj, 'draft MP4 render (3s)');
  assertExists(path.join(beatsProj, 'renders/draft.mp4'), 30000);

  const volOut = spawnSync(ffmpeg, ['-i', path.join(beatsProj, 'renders/draft.mp4'), '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const volText = (volOut.stdout || '') + (volOut.stderr || '');
  const mVol = volText.match(/mean_volume:\s*([-\d.]+)\s*dB/);
  if (!mVol || parseFloat(mVol[1]) < -55) throw new Error(`Audio silent or missing in MP4! ${volText}`);
  console.log(`✓ MP4 audio verified non-silent (mean_volume: ${mVol[1]} dB)`);

  // 3. Flagship Macro Studio SFX-only + External Voiceover Script export check
  await run('node', [
    path.join(SCRIPTS, 'new_video.mjs'), 'macro-studio', 'test-macro',
    '--dir', tmpRoot, '--from', probeDir, '--aspect', '16:9', '--mode', 'beats',
  ], SKILL, 'new_video.mjs (macro-studio, SFX-only VO-ready)');
  const macroProj = path.join(tmpRoot, 'test-macro');
  await run('node', [path.join(SCRIPTS, 'py.mjs'), path.join(SCRIPTS, 'beats.py'), macroProj], SKILL, 'beats.py + vo_script (macro-studio)');
  assertExists(path.join(macroProj, 'data/voiceover-script.md'), 300);
  assertExists(path.join(macroProj, 'renders/voiceover-script.txt'), 40);
  await run('node', ['tools/capture.mjs', 'check'], macroProj, 'macro-studio check (16:9)');
  await run('node', ['tools/capture.mjs', 'check', '--aspect=9:16'], macroProj, 'macro-studio check (9:16)');
  await run('node', ['tools/capture.mjs', 'cues'], macroProj, 'macro-studio cues');
  await run('node', [path.join(SCRIPTS, 'py.mjs'), 'tools/mix.py', macroProj], macroProj, 'mix.py (SFX-only headroom)');
  assertExists(path.join(macroProj, 'data/mix.wav'), 40000);

  // 4. Narrated mode smoke check on terminal-launch
  await run('node', [
    path.join(SCRIPTS, 'new_video.mjs'), 'terminal-launch', 'test-narr',
    '--dir', tmpRoot, '--from', probeDir, '--aspect', '16:9', '--mode', 'narrated',
  ], SKILL, 'new_video.mjs (terminal-launch, narrated)');
  const narrProj = path.join(tmpRoot, 'test-narr');
  await run('node', [path.join(SCRIPTS, 'py.mjs'), path.join(SCRIPTS, 'voice.py'), narrProj], SKILL, 'voice.py (Kokoro)');
  await run('node', [path.join(SCRIPTS, 'py.mjs'), path.join(SCRIPTS, 'words.py'), narrProj], SKILL, 'words.py (Whisper)');
  await run('node', ['tools/capture.mjs', 'check'], narrProj, 'terminal-launch check (16:9)');
  await run('node', ['tools/capture.mjs', 'check', '--aspect=9:16'], narrProj, 'terminal-launch check (9:16)');
  await run('node', ['tools/capture.mjs', 'cues'], narrProj, 'terminal-launch cues');
  await run('node', [path.join(SCRIPTS, 'py.mjs'), 'tools/mix.py', narrProj], narrProj, 'mix.py (narrated + ducking)');
  assertExists(path.join(narrProj, 'data/narration.wav'), 30000);
  assertExists(path.join(narrProj, 'data/mix.wav'), 40000);

  console.log('\nALL LAUNCH-VIDEO SELFTESTS PASSED ✓');
} finally {
  srv.close();
  if (!KEEP) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    console.log('Cleaned up temp selftest files.');
  } else {
    console.log('Kept temp selftest folder at:', tmpRoot);
  }
}
