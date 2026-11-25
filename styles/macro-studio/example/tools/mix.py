#!/usr/bin/env python3
"""Backwards-compatible mixer shim: delegates to zero-dependency studio DSP engine tools/mix.mjs.
Avoids Windows Smart App Control DLL blocks on numpy/scipy while producing identical 48 kHz true-stereo -14 LUFS audio.
"""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
MJS = os.path.join(HERE, 'mix.mjs')
PROJ = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE))

r = subprocess.run(['node', MJS, PROJ])
sys.exit(r.returncode)
