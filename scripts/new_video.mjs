#!/usr/bin/env node
// Scaffold a new launch video project into ~/launch-videos/<slug>/ (or --dir <parent>).
//   node scripts/new_video.mjs <style> <slug> [--dir <parent>] [--from <probe-dir>] [--aspect 16:9|9:16] [--mode beats|narrated]
//   node scripts/new_video.mjs --list
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STYLES_DIR = path.join(SKILL, 'styles');
const args = process.argv.slice(2);

if (args.includes('--list')) {
  for (const d of fs.readdirSync(STYLES_DIR, { withFileTypes: true })) {
    if (d.isDirectory()) console.log(d.name);
  }
  process.exit(0);
}

function getOpt(flag, def = null) {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
}
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) { i++; continue; }
  positional.push(args[i]);
}

const style = positional[0];
const slug = positional[1];
const avail = fs.readdirSync(STYLES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).join(' ');

if (!style || !slug) {
  console.error(`usage: new_video.mjs <style> <slug> [--dir <parent>] [--from <probe-dir>] [--aspect 16:9|9:16] [--mode beats|narrated]\nstyles: ${avail}`);
  process.exit(2);
}

const src = path.join(STYLES_DIR, style, 'example');
if (!fs.existsSync(src)) {
  console.error(`no style '${style}' (available: ${avail})`);
  process.exit(2);
}

const parent = path.resolve(getOpt('--dir', path.join(os.homedir(), 'launch-videos')));
const dst = path.join(parent, slug);
const fromDir = getOpt('--from', null) ? path.resolve(getOpt('--from')) : null;
const aspect = getOpt('--aspect', null);
const mode = getOpt('--mode', null);
const force = args.includes('--force');

if (fs.existsSync(dst) && !force && (!fromDir || path.resolve(fromDir) !== dst)) {
  // If dst only contains probe output (data/brand.json + assets/), merge cleanly into it
  const items = fs.readdirSync(dst);
  const probeOnly = items.every((x) => x === 'data' || x === 'assets');
  if (!probeOnly) {
    console.error(`${dst} already exists: pick another slug or pass --force`);
    process.exit(2);
  }
}

// Preserve probed brand.json + assets if scaffolding directly over a probed directory
let savedBrand = null;
const tmpAssets = path.join(os.tmpdir(), `lv-merge-${Date.now()}`);
if (fs.existsSync(dst)) {
  const bPath = path.join(dst, 'data', 'brand.json');
  if (fs.existsSync(bPath)) savedBrand = fs.readFileSync(bPath, 'utf8');
  if (fs.existsSync(path.join(dst, 'assets'))) {
    fs.cpSync(path.join(dst, 'assets'), tmpAssets, { recursive: true });
  }
}

fs.mkdirSync(parent, { recursive: true });
fs.cpSync(src, dst, { recursive: true });
fs.mkdirSync(path.join(dst, 'renders'), { recursive: true });
fs.mkdirSync(path.join(dst, 'review'), { recursive: true });
for (const stale of ['data/narration.wav', 'data/mix.wav', 'data/beats.json', 'data/voiceover-script.md', 'renders/voiceover-script.txt']) {
  const p = path.join(dst, stale);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

if (savedBrand) {
  fs.mkdirSync(path.join(dst, 'data'), { recursive: true });
  fs.writeFileSync(path.join(dst, 'data', 'brand.json'), savedBrand, 'utf8');
}
if (fs.existsSync(tmpAssets)) {
  fs.cpSync(tmpAssets, path.join(dst, 'assets'), { recursive: true });
  fs.rmSync(tmpAssets, { recursive: true, force: true });
}
if (fromDir && fromDir !== dst) {
  const fb = path.join(fromDir, 'data', 'brand.json');
  if (fs.existsSync(fb)) fs.copyFileSync(fb, path.join(dst, 'data', 'brand.json'));
  const fa = path.join(fromDir, 'assets');
  if (fs.existsSync(fa)) fs.cpSync(fa, path.join(dst, 'assets'), { recursive: true });
}

const scriptPath = path.join(dst, 'script.json');
if (fs.existsSync(scriptPath) && (aspect || mode)) {
  const S = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
  if (aspect) S.aspect = aspect;
  if (mode) S.mode = mode;
  fs.writeFileSync(scriptPath, JSON.stringify(S, null, 2), 'utf8');
}

console.log(dst);
console.log(`style: ${style}. Read ${path.join(STYLES_DIR, style, 'STYLE.md')}, inspect assets/captures/ & data/brand.json, then write script.json + src/shots.js`);
