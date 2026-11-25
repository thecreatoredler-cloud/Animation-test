#!/usr/bin/env python3
"""Layered sound design from a cue list -> stereo 48 kHz WAV. Needs numpy + scipy.

Implements the tutorial's model (tutorial_workflow_analysis.md T6):
  1. foundation: quiet room tone / ambience bed for the whole video (never dead silence)
  2. big moments are STACKED: low 'weight' + main sound + high detail
  3. sound follows the camera: space='wide' -> more reverb, duller top; 'close' -> dry, detailed

Every sound is synthesised here (original, no licence issues). A cue may instead point to
a licensed file: {"t": 1.2, "file": "assets/sound/x.wav", "gain_db": -6}.

    python3 audio_tools.py project.json out.wav
project.json["audio"] = {"duration": 8, "bed": {"type": "room", "gain_db": -42},
                         "cues": [{"t": 2.0, "type": "click", "gain_db": -8, "space": "close"}, ...]}
"""
import json
import os
import sys

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
RNG = np.random.default_rng(7)  # deterministic: same project -> same mix


def db(x):
    return 10 ** (x / 20)


def _filt(x, kind, f, order=2):
    fa = np.atleast_1d(np.asarray(f, dtype=float))
    if fa.max() >= SR / 2:
        return x
    wn = fa[0] / (SR / 2) if fa.size == 1 else fa / (SR / 2)
    sos = butter(order, wn, btype=kind, output="sos")
    return sosfilt(sos, x)


def env(n, attack=0.002, decay=0.1, curve=1.0):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-5), 0, 1)
    d = np.exp(-np.maximum(0, t - attack) / max(decay, 1e-5)) ** curve
    return a * d


def noise(dur):
    return RNG.standard_normal(int(dur * SR))


# ------------------------------------------------------------- sound atoms
def room(dur, tone=180.0):
    """Room tone: low-passed noise with a faint hum - the 'never silent' foundation."""
    x = _filt(noise(dur), "lowpass", 900) * 0.6 + _filt(noise(dur), "bandpass", [tone * 0.8, tone * 1.3]) * 0.4
    return x / (np.abs(x).max() + 1e-9)


def wind(dur, speed=0.15):
    n = noise(dur)
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * speed * np.arange(len(n)) / SR + RNG.uniform(0, 6))
    x = _filt(n, "bandpass", [200, 1200]) * lfo
    return x / (np.abs(x).max() + 1e-9)


def whoosh(dur=0.6, f0=300, f1=3000):
    n = int(dur * SR)
    x = noise(dur)
    out = np.zeros(n)
    seg = 1024
    for i in range(0, n, seg):  # swept band-pass in blocks
        k = i / n
        fc = f0 * (f1 / f0) ** (np.sin(np.pi * k))
        out[i:i + seg] = _filt(x[i:i + seg + 2048], "bandpass", [fc * 0.6, min(fc * 1.6, SR / 2 - 100)])[:len(out[i:i + seg])]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return out * e / (np.abs(out * e).max() + 1e-9)


def weight(dur=0.35, freq=55.0):
    """Low 'weight' layer: pitched-down sine thump."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + 1.5 * np.exp(-t / 0.03))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, dur / 4)
    return x / (np.abs(x).max() + 1e-9)


def click(dur=0.08, bright=1.0, pitch=3200.0):
    """Main metallic click: noise transient + 2 inharmonic partials."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    tr = _filt(noise(dur), "highpass", 1500) * env(n, 0.0005, 0.004)
    tone = (np.sin(2 * np.pi * pitch * t) + 0.6 * np.sin(2 * np.pi * pitch * 2.76 * t)) * env(n, 0.0005, 0.018)
    x = tr * 0.7 + tone * 0.5 * bright
    return x / (np.abs(x).max() + 1e-9)


def tick(dur=0.03, pitch=7000.0):
    """High detail layer: tiny bright tick."""
    return click(dur, 1.0, pitch)


def ting(dur=0.9, pitch=1900.0):
    """Ringing metal (springs, shackles, bells): inharmonic partials, long decay."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * pitch * r * t + RNG.uniform(0, 6)) * env(n, 0.001, dur * d)
            for a, r, d in [(1, 1, 0.25), (0.5, 2.32, 0.15), (0.3, 4.1, 0.08), (0.2, 5.4, 0.05)])
    return x / (np.abs(x).max() + 1e-9)


def scrape(dur=1.0, rough=25.0, lo=1500, hi=6000):
    """Sliding contact (key in lock, drawer): band noise with granular roughness."""
    n = int(dur * SR)
    x = _filt(noise(dur), "bandpass", [lo, hi])
    grains = (RNG.random(n) < rough / SR * 40).astype(float)
    grains = _filt(grains, "lowpass", 400) * 30
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5
    y = x * (0.5 + np.clip(grains, 0, 1)) * e
    return y / (np.abs(y).max() + 1e-9)


def impact(dur=0.5, pitch=2600.0):
    """Stacked 'big moment' = weight + click + tick (tutorial rule)."""
    n = int(dur * SR)
    out = np.zeros(n)
    w = weight(min(dur, 0.35)) * 0.9
    c = click(0.09, 1.0, pitch) * 0.8
    k = tick(0.03) * 0.35
    out[:len(w)] += w
    out[:len(c)] += c
    out[int(0.004 * SR):int(0.004 * SR) + len(k)] += k
    return out / (np.abs(out).max() + 1e-9)


ATOMS = dict(room=room, wind=wind, whoosh=whoosh, weight=weight, click=click, tick=tick,
             ting=ting, scrape=scrape, impact=impact)


# ------------------------------------------------------------- space / shot size
def _ir(rt60, bright):
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    ir = RNG.standard_normal(n) * np.exp(-6.9 * t / rt60)
    ir = _filt(ir, "lowpass", 2000 + 8000 * bright)
    ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2) + 1e-9)


SPACES = {  # wet, rt60, brightness, top-cut Hz
    "close": (0.06, 0.25, 0.9, 20000),
    "medium": (0.15, 0.5, 0.6, 12000),
    "wide": (0.30, 1.1, 0.4, 7000),
}


def place(x, space="medium", pan=0.0):
    wet, rt, br, top = SPACES[space]
    dry = _filt(x, "lowpass", top) if top < 20000 else x
    rev = fftconvolve(x, _ir(rt, br))[:len(x) + int(rt * SR)]
    y = np.zeros(len(rev))
    y[:len(dry)] += dry * (1 - wet)
    y += rev * wet * 0.5
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([y * l, y * r], 1)


def render_mix(audio, project_dir=".", out_path="mix.wav"):
    dur = float(audio["duration"])
    N = int(dur * SR)
    mix = np.zeros((N + SR * 2, 2))
    bed = audio.get("bed")
    if bed:
        x = ATOMS[bed.get("type", "room")](dur + 1)[:N] * db(bed.get("gain_db", -40))
        fade = np.minimum(1, np.minimum(np.arange(N), N - np.arange(N)) / (0.3 * SR))
        mix[:N] += np.stack([x * fade, np.roll(x, 2400) * fade], 1)
    for cue in audio.get("cues", []):
        if "file" in cue:
            sr, x = wavfile.read(os.path.join(project_dir, cue["file"]))
            x = x.astype(float)
            x = x.mean(1) if x.ndim > 1 else x
            x /= np.abs(x).max() + 1e-9
        else:
            kw = {k: v for k, v in cue.items() if k not in ("t", "type", "gain_db", "space", "pan")}
            x = ATOMS[cue["type"]](**kw)
        y = place(x * db(cue.get("gain_db", -12)), cue.get("space", "medium"), cue.get("pan", 0.0))
        i = int(cue["t"] * SR)
        j = min(len(mix), i + len(y))
        mix[i:j] += y[:j - i]
    mix = mix[:N]
    peak = np.abs(mix).max()
    target = db(audio.get("peak_db", -3.0))  # master: normalise loudest hit to -3 dBFS
    if peak > 0:
        mix *= target / peak
    wavfile.write(out_path, SR, (mix * 32767).astype(np.int16))
    return out_path


if __name__ == "__main__":
    proj = json.load(open(sys.argv[1]))
    print(render_mix(proj["audio"], os.path.dirname(os.path.abspath(sys.argv[1])), sys.argv[2]))
