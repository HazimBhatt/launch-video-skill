// Frame-exact 60fps capture through headless Chrome. Zero npm packages (Node 22+).
//   node tools/capture.mjs check                                       boot, list shots, verify zero JS errors
//   node tools/capture.mjs cues                                        write data/cues.json (for tools/mix.py)
//   node tools/capture.mjs sheet review/all.jpg [step=0.5] [cols]      time-stamped contact sheet
//   node tools/capture.mjs frames review/full "0.8,4.9,14.2"           lossless full-res PNG keyframes
//   node tools/capture.mjs video renders/out.mp4 [s e] [--draft] [--jpg] [--aspect=16:9|9:16] [--fps=60]
//   node tools/capture.mjs preview [--aspect=16:9|9:16]                local browser preview
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs.filter((a) => a.startsWith('--')));
const getFlagVal = (prefix, def = null) => {
  const f = rawArgs.find((a) => a.startsWith(`${prefix}=`));
  return f ? f.slice(prefix.length + 1) : def;
};

const FPS = Number(getFlagVal('--fps', process.env.FPS || 60));
const aspectVal = getFlagVal('--aspect', null);
const ASPECT_QS = `${aspectVal ? `&aspect=${encodeURIComponent(aspectVal)}` : ''}&fps=${FPS}`;
const positional = rawArgs.filter((a) => !a.startsWith('--'));
const [mode, ...rest] = positional;

// Shared environment resolution (zero hardcoded personal paths)
function findChrome() {
  return [
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
  ].find((p) => p && fs.existsSync(p)) || null;
}

function findBin(envVar, name) {
  if (process.env[envVar] && fs.existsSync(process.env[envVar])) return process.env[envVar];
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) {
    const p = which.stdout.trim().split(/\r?\n/)[0].trim();
    if (p && fs.existsSync(p)) return p;
  }
  const home = os.homedir();
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  return [
    path.join(process.env.LAUNCH_VIDEO_HOME || path.join(home, '.launch-video'), 'bin', exe),
    path.join(home, '.local', 'bin', exe),
    `C:/ffmpeg/bin/${exe}`,
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`,
  ].find((p) => fs.existsSync(p)) || name;
}

const CHROME = findChrome();
const FFMPEG = findBin('FFMPEG', 'ffmpeg');
const FFPROBE = findBin('FFPROBE', 'ffprobe');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.otf': 'font/otf', '.ttf': 'font/ttf',
  '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

function serve(port = 0) {
  return new Promise((res) => {
    const srv = http.createServer((req, r) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        r.writeHead(404); r.end(); return;
      }
      r.writeHead(200, {
        'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(f).pipe(r);
    });
    srv.listen(port, '127.0.0.1', () => res(srv));
  });
}

async function openPage(port, pageFile = 'index.html') {
  if (!CHROME) throw new Error('Chrome/Edge not found: install Google Chrome or set CHROME=/path/to/chrome');
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--window-size=1920,1080', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader',
    ...(process.env.SOFTWARE_GL ? ['--use-angle=swiftshader'] : []),
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank',
  ], { stdio: 'ignore' });

  let dbg;
  for (let i = 0; i < 200 && !dbg; i++) {
    try { dbg = fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch { await sleep(100); }
  }
  if (!dbg) throw new Error('Chrome did not start');

  const url = `http://127.0.0.1:${port}/${pageFile}?capture=1${ASPECT_QS}${process.env.QS || ''}`;
  const r = await fetch(`http://127.0.0.1:${dbg}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await r.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0; const pend = new Map(); const logs = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) {
      const p = pend.get(m.id); pend.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    } else if (m.method === 'Runtime.exceptionThrown') {
      logs.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      logs.push('ERROR ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => {
    const x = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.exception?.description || x.exceptionDetails.text);
    return x.result.value;
  };
  await send('Runtime.enable');
  for (let i = 0; ; i++) {
    const st = await ev('window.OP ? (OP.bootError ? "ERR:" + OP.bootError : OP.ready) : false').catch(() => false);
    if (st === true) break;
    if (typeof st === 'string') throw new Error('boot failed: ' + st + '\n' + logs.join('\n'));
    if (i > 25 && !st && logs.some((l) => l.startsWith('EXCEPTION') || l.startsWith('ERROR'))) {
      throw new Error('module boot failed:\n' + logs.join('\n'));
    }
    if (i > 1200) throw new Error('boot timeout\n' + logs.join('\n'));
    await sleep(100);
  }
  const close = () => {
    try { ws.close(); } catch {}
    try { chrome.kill('SIGKILL'); } catch {}
    setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }, 300);
  };
  return { ev, logs, close };
}

const b64Buf = (d) => Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');
const FRAME = (t, q, fmt = 'jpeg', label = false) => `(() => {
  const d = OP.frame(${t}, ${q}, '${fmt}');
  ${label ? `
    const cv = document.getElementById('cv'), c = cv.getContext('2d');
    c.setTransform(1,0,0,1,0,0);
    c.fillStyle = 'rgba(14,14,13,0.86)';
    c.fillRect(0, 0, 210, 66);
    c.fillStyle = '#FAF9F7';
    c.font = '700 42px Inter, sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText('${(+t).toFixed(2)}s', 14, 47);
    return cv.toDataURL('image/jpeg', ${q});
  ` : 'return d;'}
})()`;

const srv = await serve(mode === 'preview' ? 8765 : 0);
const port = srv.address().port;

if (mode === 'preview') {
  console.log(`open http://127.0.0.1:${port}/?${ASPECT_QS.slice(1)}  (Ctrl+C to stop)`);
} else {
  const P = await openPage(port, 'index.html');
  try {
    const dur = await P.ev('OP.duration()');
    const sz = await P.ev('OP.size ? OP.size() : { w: 1920, h: 1080, aspect: "16:9", fps: 60 }');

    if (mode === 'check') {
      console.log(`size ${sz.w}x${sz.h} (${sz.aspect}) @ ${FPS}fps | duration ${dur.toFixed(2)} s`);
      for (const s of await P.ev('OP.shots()')) {
        console.log(`${s.id.padEnd(6)} ${s.at.toFixed(2).padStart(6)} -> ${s.end.toFixed(2).padStart(6)}  (${(s.end - s.at).toFixed(2)} s)  ${s.note}`);
      }
      let bad = 0;
      for (let t = 0; t < dur; t += 0.25) {
        try { await P.ev(`OP.draw(${t})`); } catch (e) { bad++; console.log(`ERROR at ${t.toFixed(2)}: ${e.message.split('\n')[0]}`); }
      }
      if (P.logs.length) console.log(P.logs.join('\n'));
      console.log(bad || P.logs.length ? 'CHECK FAILED' : 'CHECK OK');
      if (bad || P.logs.length) process.exitCode = 1;
    } else if (mode === 'cues') {
      const cues = await P.ev('OP.cues()');
      fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'data/cues.json'), JSON.stringify({ duration: dur, cues }, null, 1));
      console.log(`data/cues.json: ${cues.length} cues, ${dur.toFixed(2)} s`);
    } else if (mode === 'frames') {
      const dir = path.resolve(ROOT, rest[0] || 'review/frames');
      fs.mkdirSync(dir, { recursive: true });
      for (const t of (rest[1] || '0').split(',').map(Number)) {
        const buf = b64Buf(await P.ev(FRAME(t, 1.0, 'png', false)));
        fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.png`), buf);
      }
      console.log(`Saved lossless PNG keyframes -> ${dir}`);
    } else if (mode === 'sheet') {
      const portrait = sz.h > sz.w;
      const out = path.resolve(ROOT, rest[0] || 'review/all.jpg');
      const step = +(rest[1] || 0.5);
      const cols = +(rest[2] || (portrait ? 8 : 6));
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-sheet-'));
      let n = 0;
      for (let t = step / 2; t < dur; t += step) {
        fs.writeFileSync(path.join(tmp, `f${String(n++).padStart(4, '0')}.jpg`), b64Buf(await P.ev(FRAME(t, 0.88, 'jpeg', true))));
      }
      const rows = Math.ceil(n / cols);
      const tileScale = portrait ? '216:384' : '384:216';
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const r = spawnSync(FFMPEG, [
        '-v', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, 'f%04d.jpg'),
        '-vf', `scale=${tileScale},tile=${cols}x${rows}:padding=4:color=black`,
        '-frames:v', '1', '-update', '1', '-q:v', '2', out,
      ], { encoding: 'utf8' });
      fs.rmSync(tmp, { recursive: true, force: true });
      if (r.status) throw new Error('ffmpeg: ' + r.stderr);
      console.log(`${out} (${n} frames, every ${step} s, ${sz.aspect})`);
    } else if (mode === 'video') {
      const out = path.resolve(ROOT, rest[0] || 'renders/video.mp4');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const mix = path.join(ROOT, 'data/mix.wav');
      const hasMix = fs.existsSync(mix);
      const a0 = rest[1] ? +rest[1] : 0;
      const a1 = rest[2] ? Math.min(+rest[2], dur) : dur;
      const isDraft = flags.has('--draft');
      const usePng = !isDraft && flags.has('--png');
      const renderFps = isDraft ? Math.min(FPS, 30) : FPS;
      const n = Math.round((a1 - a0) * renderFps);

      const ff = spawn(FFMPEG, [
        '-v', 'error', '-y',
        '-f', 'image2pipe',
        '-vcodec', usePng ? 'png' : 'mjpeg',
        '-framerate', String(renderFps),
        '-i', '-',
        ...(hasMix
          ? ['-ss', String(a0), '-t', String(a1 - a0), '-i', mix]
          : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']),
        '-map', '0:v', '-map', '1:a',
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-preset', isDraft ? 'ultrafast' : 'medium',
        '-crf', isDraft ? '26' : '15',
        '-pix_fmt', 'yuv420p',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
        '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
        '-shortest', '-movflags', '+faststart', out,
      ], { stdio: ['pipe', 'inherit', 'inherit'] });

      const t0 = Date.now();
      for (let i = 0; i < n; i++) {
        const b = b64Buf(await P.ev(FRAME(
          a0 + i / renderFps,
          isDraft ? 0.82 : 0.99,
          usePng ? 'png' : 'jpeg',
          false,
        )));
        if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r));
        if (i % 120 === 0) process.stdout.write(`\r${i}/${n} frames (${renderFps}fps ${usePng ? 'PNG' : 'JPG'})`);
      }
      ff.stdin.end();
      await new Promise((r) => ff.on('close', r));
      console.log(`\r${out} (${n} frames @ ${renderFps}fps, ${sz.aspect}, ${usePng ? 'lossless PNG pipe' : 'high-q JPG'}, ${hasMix ? 'with data/mix.wav' : 'SILENT'}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);

      // Automated ffprobe + volumedetect QA telemetry
      const probe = spawnSync(FFPROBE, [
        '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,channels,sample_rate:format=duration,bit_rate',
        '-of', 'default=noprint_wrappers=1', out,
      ], { encoding: 'utf8' });
      const vol = spawnSync(FFMPEG, ['-i', out, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
      const vtxt = (vol.stdout || '') + (vol.stderr || '');
      const mean = vtxt.match(/mean_volume:\s*([-\d.]+)\s*dB/)?.[1];
      const maxv = vtxt.match(/max_volume:\s*([-\d.]+)\s*dB/)?.[1];
      console.log(`QA: mean_volume=${mean ?? 'n/a'} dB | max_volume=${maxv ?? 'n/a'} dB`);
      if (probe.status === 0 && probe.stdout.trim()) {
        const lines = probe.stdout.trim().split(/\r?\n/).filter((l) => /width=|height=|r_frame_rate=|channels=|duration=|bit_rate=/.test(l));
        console.log('QA stream:', lines.join(' | '));
      }
    } else {
      console.log('modes: check · cues · sheet · frames · video · preview');
    }
  } finally {
    P.close();
    srv.close();
  }
}
