#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { findVenvPython, findSystemPython } from './env.mjs';

const args = process.argv.slice(2);
const venvPy = findVenvPython();
if (venvPy) {
  const r = spawnSync(venvPy, args, { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
const sysPy = findSystemPython();
if (sysPy) {
  const r = spawnSync(sysPy.cmd, [...sysPy.pre, ...args], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
console.error('No Python 3.10+ interpreter found. Run setup.mjs first.');
process.exit(1);
