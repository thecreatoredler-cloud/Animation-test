#!/usr/bin/env python3
"""Physically informed Foley: modal synthesis driven by animation contact events.

    python3 foley.py PROJECT_DIR SHOT [--out build/foley.wav] [--stems]

Why: v1 used filtered white noise + sine pings + sub-bass "cinematic" hits; it measured as
noise beds masking the clicks (DIAGNOSIS_v1.md). Real small-metal sounds are short, dense,
inharmonic resonances excited by contacts. So:
  * every sounding OBJECT has modes (freq Hz, T60 s, gain) estimated from material + size
    (e.g. a 5.8 mm steel rod 0.1 m long: first free-free bending mode ~ 2.6 kHz);
  * every CONTACT is an excitation: impact (contact duration sets brightness),
    or friction (Poisson micro-impulse train whose rate/level follow the sliding speed);
  * events come from the shot (build/events_<shot>.json, written by the shot's build()):
    the sound happens exactly when the animation makes contact;
  * the project maps event types -> recipes (project.json "foley"), so recipes are reusable.

No noise beds, no whooshes, no sub-bass unless an object really has low modes (a wooden door).
Levels are set per recipe relative to each other; ONE master gain sets loudness (-18 LUFS
default) and a true-peak ceiling of -1 dBTP. Deterministic (seeded per event).

Limitation: this models the physics roughly. It is not a recording. A person must listen;
real CC0 Foley can replace any recipe via {"file": ...}.
"""
import argparse
import json
import math
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, butter, sosfilt, resample_poly

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# ---------------------------------------------------------------- objects: modes
# (freq Hz, T60 s, relative gain). Small solids ring high and short; values are estimates
# from beam/plate formulas + typical damping when held / hanging / pressed by springs.
OBJECTS = {
    # brass padlock body ~40x22x36 mm, hollow-drilled, hanging: dense high modes, well damped
    "brass_body": [(2150, 0.035, 0.5), (3420, 0.05, 0.9), (4730, 0.04, 0.8), (6310, 0.035, 0.7),
                   (8240, 0.03, 0.55), (11050, 0.022, 0.4), (14100, 0.015, 0.25)],
    # nickel-silver key (thin plate + blade): brighter, rings longer when free
    "key": [(2870, 0.11, 0.5), (5120, 0.09, 0.8), (7790, 0.07, 0.7), (10600, 0.05, 0.5), (13400, 0.035, 0.3)],
    # steel shackle U, rod d=5.8 mm, developed length ~0.1 m (free-free bending 2.6k, 7.2k, 14k)
    "shackle": [(1940, 0.22, 0.6), (2610, 0.28, 1.0), (5380, 0.18, 0.7), (7180, 0.16, 0.6), (11300, 0.09, 0.35),
                (14100, 0.06, 0.2)],
    # galvanised staple + hasp plate screwed to a door: short metallic clank
    "staple": [(1480, 0.06, 0.6), (3120, 0.08, 0.9), (5600, 0.05, 0.6), (8900, 0.03, 0.35)],
    # wooden shed door plank (the only legitimately low object): heavily damped knock
    "door": [(185, 0.07, 0.7), (310, 0.06, 1.0), (520, 0.045, 0.6), (870, 0.03, 0.35)],
    # tiny hardened parts (pins, balls, cam) - mostly a sharp transient plus body coupling
    "tiny_steel": [(9800, 0.012, 0.8), (12900, 0.01, 0.6), (16500, 0.008, 0.4)],
    "spring": [(4400, 0.04, 0.4), (6900, 0.05, 0.6), (9300, 0.04, 0.4)],
}


def modal_ir(modes, dur=None, rng=None, detune=0.0, hardness_ms=0.08):
    """Impulse response of an object: sum of damped sinusoids, low-passed by contact duration
    (a softer/longer contact excites fewer high modes: |H(f)| of a raised-cosine pulse)."""
    rng = rng or np.random.default_rng(0)
    if dur is None:
        dur = max(t60 for _, t60, _ in modes) * 1.2
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    tau = hardness_ms / 1000.0
    for f, t60, g in modes:
        f2 = f * (1 + detune * rng.uniform(-1, 1))
        # raised-cosine pulse spectrum magnitude ~ |sinc(f tau)| / |1 - (f tau)^2|
        x = f2 * tau
        h = abs(np.sinc(x) / (1 - x * x)) if abs(1 - x * x) > 1e-3 else 0.5
        out += g * h * np.exp(-6.91 * t / t60) * np.sin(2 * np.pi * f2 * t + rng.uniform(0, 2 * np.pi))
    return out


def transient(rng, ms=0.6, hp=2500):
    """The contact itself: a sub-millisecond broadband tick (what makes clicks sound 'real')."""
    n = max(8, int(ms / 1000 * SR))
    x = rng.standard_normal(n) * np.hanning(n)
    sos = butter(2, hp / (SR / 2), "highpass", output="sos")
    return sosfilt(sos, x)


def norm(x):
    p = np.abs(x).max()
    return x / p if p > 0 else x


# ---------------------------------------------------------------- recipes
def impact(rng, objects, strength=1.0, hardness_ms=0.08, transient_amt=0.35, detune=0.015, mix=None):
    """One contact exciting one or more coupled objects (e.g. pin tick + lock body)."""
    mix = mix or [1.0] * len(objects)
    parts = [m * norm(modal_ir(OBJECTS[o], rng=rng, detune=detune, hardness_ms=hardness_ms))
             for o, m in zip(objects, mix)]
    n = max(len(p) for p in parts)
    y = np.zeros(n)
    for p in parts:
        y[:len(p)] += p
    tr = transient(rng, ms=max(0.2, hardness_ms * 4))
    y[:len(tr)] += transient_amt * norm(tr) * np.abs(y).max()
    return norm(y) * strength


def friction(rng, objects, dur, rate=(200, 600), level=1.0, speed=None, hardness_ms=0.25, mix=None,
             damp=0.25, variants=6, detune=0.08):
    """Sliding contact: Poisson micro-impacts (rate follows speed 0..1) through the objects'
    modes. Contact damps the parts (T60 x `damp`) and each micro-impact excites a slightly
    different resonance set (`variants` detuned IRs): without both, the overlapping ringing
    fuses into a steady pitched hum (measured in v2 iteration 1)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sp = np.ones(n) if speed is None else np.interp(t, np.linspace(0, dur, len(speed)), speed)
    lam = (rate[0] + (rate[1] - rate[0]) * sp) / SR
    hits = np.flatnonzero(rng.random(n) < lam)
    amps = rng.uniform(0.15, 1.0, len(hits)) ** 2 * (0.3 + 0.7 * sp[hits])
    which = rng.integers(0, variants, len(hits))
    mix = mix or [1.0] * len(objects)
    y = np.zeros(n)
    for v in range(variants):
        train = np.zeros(n)
        sel = which == v
        train[hits[sel]] = amps[sel]
        ir = sum(m * norm(modal_ir([(f, t60 * damp, g) for f, t60, g in OBJECTS[o]], dur=0.03, rng=rng,
                                   detune=detune, hardness_ms=hardness_ms))
                 for o, m in zip(objects, mix))
        y += fftconvolve(train, ir)[:n]
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.015 * SR))
    return norm(y * fade) * level


def air(rng, dur, level=1.0):
    """Outdoor air tone: very low, below 700 Hz, slowly breathing - presence, not a bed."""
    n = int(dur * SR)
    x = rng.standard_normal(n)
    x = sosfilt(butter(2, [60 / (SR / 2), 700 / (SR / 2)], "bandpass", output="sos"), x)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.13 * np.arange(n) / SR + 1.3)
    return norm(x * lfo) * level


# ---------------------------------------------------------------- space (shot size)
def early_reflections(x, space):
    """'close': dry. 'medium': a faint door slap (the lock hangs 1 cm from a wooden door).
    'wide': + short diffuse tail. Kept subtle - the reference is close-miked and dry."""
    if space == "close":
        return x
    taps = [(0.0016, 0.18), (0.0041, 0.08)] if space == "medium" else [(0.0016, 0.22), (0.0041, 0.12), (0.011, 0.06)]
    y = x.copy()
    for d, g in taps:
        k = int(d * SR)
        y[k:] += g * x[:-k]
    if space == "wide":
        rng = np.random.default_rng(3)
        m = int(0.25 * SR)
        ir = rng.standard_normal(m) * np.exp(-np.arange(m) / (0.05 * SR))
        ir = sosfilt(butter(2, 6000 / (SR / 2), output="sos"), ir)
        y = y + 0.05 * fftconvolve(x, ir / np.sqrt((ir ** 2).sum()))[:len(y)]
    return y


# ---------------------------------------------------------------- loudness (BS.1770)
def lufs(x):
    import audio_analysis as aa
    xk = aa.k_weight(x if x.ndim == 2 else x[:, None], SR)
    return aa.integrated(aa.block_loudness(xk, SR))


def true_peak_db(x):
    return 20 * np.log10(np.abs(resample_poly(x, 4, 1, axis=0)).max() + 1e-12)


# ---------------------------------------------------------------- render
def render(events, recipes, duration, space_timeline=None, ambience=None, target_lufs=-18.0,
           tp_ceiling=-1.0, seed=11, stems_dir=None):
    """events: [{t, type, ...}] ; recipes: {type: {...}} (see project.json "foley")."""
    N = int(duration * SR) + SR
    mix = np.zeros(N)
    stems = {}
    log = []
    for i, e in enumerate(events):
        r = recipes.get(e["type"])
        if not r or r.get("mute"):
            continue
        rng = np.random.default_rng(seed + i * 7919)
        s = float(e.get("strength", 1.0))
        s = r.get("min_strength", 0.0) + (1 - r.get("min_strength", 0.0)) * s
        kind = r["kind"]
        if kind == "impact":
            y = impact(rng, r["objects"], strength=s, hardness_ms=r.get("hardness_ms", 0.08),
                       transient_amt=r.get("transient", 0.35), mix=r.get("mix"))
        elif kind == "friction":
            dur = max(0.05, float(e.get("until", e["t"] + r.get("dur", 0.4))) - e["t"])
            y = friction(rng, r["objects"], dur, rate=tuple(r.get("rate", (200, 600))),
                         speed=e.get("speed", r.get("speed")), hardness_ms=r.get("hardness_ms", 0.25), mix=r.get("mix"))
        elif kind == "file":
            sr, y = wavfile.read(r["file"])
            y = y.astype(float)
            y = norm(y.mean(1) if y.ndim > 1 else y)
        else:
            continue
        space = r.get("space") or (_space_at(space_timeline, e["t"]) if space_timeline else "close")
        y = early_reflections(y, space) * 10 ** (r.get("gain_db", -12) / 20)
        k = int((e["t"] + r.get("offset_ms", 0) / 1000) * SR)
        if k < 0:
            y, k = y[-k:], 0
        j = min(N, k + len(y))
        mix[k:j] += y[:j - k]
        stems.setdefault(e["type"], np.zeros(N))[k:j] += y[:j - k]
        log.append(dict(t=e["t"], type=e["type"], recipe=kind, objects=r.get("objects"), space=space,
                        gain_db=r.get("gain_db", -12), strength=round(s, 2)))
    if ambience:
        a = air(np.random.default_rng(seed), N / SR) * 10 ** (ambience.get("gain_db", -50) / 20)
        mix += a
        stems["ambience"] = a
    mix = mix[:int(duration * SR)]
    st = np.stack([mix, np.roll(mix, 24) * 0.98], 1)        # 0.5 ms decorrelation, near-mono
    g = 10 ** ((target_lufs - lufs(st)) / 20)                # ONE master gain for loudness
    st *= g
    tp = true_peak_db(st)
    limited = False
    max_gr = 0.0
    if tp > tp_ceiling:                                      # transparent peak control
        pre = st.copy()
        st = _soft_limit(st, 10 ** ((tp_ceiling - 0.8) / 20))   # 0.8 dB margin: inter-sample peaks
        limited = True
        ratio = np.abs(st).max(1) / np.maximum(np.abs(pre).max(1), 1e-9)
        max_gr = float(-20 * np.log10(max(ratio[np.abs(pre).max(1) > 1e-4].min(), 1e-6)))
    info = dict(master_gain_db=round(20 * np.log10(g), 2), integrated_lufs=round(lufs(st), 1),
                true_peak_dbtp=round(true_peak_db(st), 2), limited=limited, limiter_max_gr_db=round(max_gr, 1),
                events_rendered=len(log))
    if stems_dir:
        os.makedirs(stems_dir, exist_ok=True)
        for k_, v in stems.items():
            v = v[:int(duration * SR)] * g
            wavfile.write(os.path.join(stems_dir, f"stem_{k_}.wav"), SR, (np.clip(v, -1, 1) * 32767).astype(np.int16))
    return st, info, log


def _space_at(tl, t):
    cur = tl[0][1]
    for t0, sp in tl:
        if t >= t0:
            cur = sp
    return cur


def _soft_limit(x, ceil):
    """Gain-riding limiter (5 ms attack, 80 ms release) - only touches the loudest peaks."""
    a = np.abs(x).max(1)
    need = np.minimum(1.0, ceil / np.maximum(a, 1e-9))
    g = np.ones_like(need)
    att, rel = math.exp(-1 / (0.0005 * SR)), math.exp(-1 / (0.08 * SR))
    lookahead = int(0.002 * SR)
    need = np.concatenate([need[lookahead:], np.ones(lookahead)])
    cur = 1.0
    for i in range(len(need)):
        tgt = need[i]
        cur = att * cur + (1 - att) * tgt if tgt < cur else rel * cur + (1 - rel) * tgt
        g[i] = cur
    g = np.concatenate([np.ones(lookahead), g[:-lookahead]])
    return np.clip(x * g[:, None], -ceil, ceil)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("shot")
    ap.add_argument("--out", default=None)
    ap.add_argument("--stems", action="store_true")
    a = ap.parse_args()
    pj = json.load(open(os.path.join(a.project_dir, "project.json")))
    evs = json.load(open(os.path.join(a.project_dir, "build", f"events_{a.shot}.json")))["events"]
    fcfg = pj["foley"]
    out = a.out or os.path.join(a.project_dir, "build", "foley.wav")
    st, info, log = render(evs, fcfg["recipes"], pj.get("duration", 8.0), fcfg.get("space_timeline"),
                           fcfg.get("ambience"), fcfg.get("target_lufs", -18.0), fcfg.get("tp_ceiling", -1.0),
                           stems_dir=os.path.join(a.project_dir, "build", "stems") if a.stems else None)
    wavfile.write(out, SR, (st * 32767).astype(np.int16))
    json.dump(dict(info=info, events=log), open(os.path.splitext(out)[0] + "_log.json", "w"), indent=1)
    print(json.dumps(info))
    print(out)


if __name__ == "__main__":
    main()
