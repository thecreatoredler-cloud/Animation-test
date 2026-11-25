#!/usr/bin/env python3
"""Objective audio analysis: loudness (EBU R128 / ITU-R BS.1770), peaks, events, spectra.

    python3 audio_analysis.py INPUT(.wav|.mp4) [--out DIR] [--events]

Reports integrated loudness (LUFS), loudness range (LRA, approximated), sample peak
and 4x-oversampled true peak, a momentary-loudness timeline (400 ms windows, 100 ms
hop), and detected events (onsets) with level, duration (-20 dB decay), and spectral
centroid. Writes DIR/spectrogram.png (time x log-frequency) and DIR/audio_report.json.

What this CAN tell you: levels, dynamics, timing, brightness, decay length, clipping.
What it CANNOT tell you: whether something sounds natural. A person must listen.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter, resample_poly, stft


def load(path):
    if not path.lower().endswith(".wav"):
        tmp = os.path.join(tempfile.mkdtemp(), "a.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vn", "-ac", "2", "-ar", "48000", tmp], check=True)
        path = tmp
    sr, x = wavfile.read(path)
    if x.dtype.kind in "iu":
        x = x.astype(np.float64) / float(np.iinfo(x.dtype).max + 1)
    else:
        x = x.astype(np.float64)
    if x.ndim == 1:
        x = x[:, None]
    return sr, x


def k_weight(x, sr):
    """BS.1770 K-weighting (pre-filter shelf + RLB high-pass), coefficients for 48 kHz."""
    assert sr == 48000, "resample to 48 kHz first"
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def block_loudness(xk, sr, win=0.4, hop=0.1):
    n, h = int(win * sr), int(hop * sr)
    out = []
    for i in range(0, max(1, len(xk) - n + 1), h):
        ms = np.mean(xk[i:i + n] ** 2, axis=0).sum()  # stereo: L+R weights 1.0
        out.append(-0.691 + 10 * np.log10(ms + 1e-12))
    return np.array(out)


def integrated(lk):
    g = lk[lk > -70]
    if not len(g):
        return -70.0
    rel = 10 * np.log10(np.mean(10 ** (g / 10))) - 10
    g2 = g[g > rel]
    return float(10 * np.log10(np.mean(10 ** (g2 / 10))))


def lra(xk, sr):
    st = block_loudness(xk, sr, 3.0, 1.0)
    g = st[st > -70]
    if len(g) < 2:
        return 0.0
    rel = 10 * np.log10(np.mean(10 ** (g / 10))) - 20
    g = g[g > rel]
    return float(np.percentile(g, 95) - np.percentile(g, 10))


def events(x, sr, rise_db=9.0, min_gap=0.04):
    """Onsets = energy rising > rise_db within 20 ms and > 10 dB above the local floor.
    Each event: peak level, decay time to -20 dB below its peak (or back to floor), centroid."""
    mono = x.mean(1)
    hop = int(0.005 * sr)
    e = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(mono) - hop, hop)])
    edb = 20 * np.log10(e)
    n = len(edb)
    floor = np.array([np.percentile(edb[max(0, i - 200):i + 1], 10) for i in range(n)])
    evs = []
    for i in range(4, n):
        if edb[i] - edb[i - 4] > rise_db and edb[i] - floor[i] > 10:
            t = i * hop / sr
            if evs and t - evs[-1]["t"] < min_gap:
                continue
            pk_i = i + int(np.argmax(edb[i:i + 8]))
            pk = edb[pk_i]
            j = pk_i
            while j < n - 1 and edb[j] > max(pk - 20, floor[i] + 3):
                j += 1
            seg = mono[max(0, (i - 2) * hop):(j + 1) * hop]
            cent = None
            if len(seg) >= 512:
                f, _, Z = stft(seg, sr, nperseg=512)
                mag = np.abs(Z).mean(1)
                cent = float((f * mag).sum() / (mag.sum() + 1e-12))
            evs.append(dict(t=round(t, 3), peak_dbfs=round(float(pk), 1),
                            above_floor_db=round(float(pk - floor[i]), 1),
                            decay_ms=round((j - pk_i) * hop / sr * 1000), centroid_hz=round(cent) if cent else None))
    return evs


def spectrogram_png(x, sr, path, w=1200, h=400):
    import cv2
    mono = x.mean(1)
    f, t, Z = stft(mono, sr, nperseg=2048, noverlap=2048 - 256)
    S = 20 * np.log10(np.abs(Z) + 1e-9)
    # log-frequency rows 40 Hz .. 20 kHz
    fr = np.geomspace(40, 20000, h)
    idx = np.clip(np.searchsorted(f, fr), 0, len(f) - 1)
    S = S[idx][::-1]
    S = np.clip((S + 100) / 80, 0, 1)
    img = cv2.resize((S * 255).astype(np.uint8), (w, h))
    img = cv2.applyColorMap(img, cv2.COLORMAP_MAGMA)
    dur = len(mono) / sr
    for s in range(int(dur) + 1):
        xpx = int(s / dur * (w - 1))
        cv2.line(img, (xpx, h - 12), (xpx, h), (255, 255, 255), 1)
        cv2.putText(img, f"{s}s", (xpx + 2, h - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
    for hz in (100, 1000, 10000):
        ypx = int((1 - np.log(hz / 40) / np.log(20000 / 40)) * (h - 1))
        cv2.putText(img, f"{hz}Hz", (2, ypx), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
    cv2.imwrite(path, img)


def analyse(path, out_dir=None):
    sr, x = load(path)
    if sr != 48000:
        x = resample_poly(x, 48000, sr, axis=0)
        sr = 48000
    xk = k_weight(x, sr)
    mom = block_loudness(xk, sr)
    rep = dict(file=os.path.basename(path), seconds=round(len(x) / sr, 2),
               integrated_lufs=round(integrated(mom), 1), lra_lu=round(lra(xk, sr), 1),
               sample_peak_dbfs=round(20 * np.log10(np.abs(x).max() + 1e-12), 1),
               true_peak_dbtp=round(20 * np.log10(np.abs(resample_poly(x, 4, 1, axis=0)).max() + 1e-12), 1),
               # max momentary loudness of 400 ms windows whose CENTRE falls in each 0.5 s bin
               momentary_lufs_per_0_5s=[round(float(np.max(mom[max(0, i - 2):max(1, i + 3)])), 1)
                                        for i in range(0, len(mom) + 2, 5)][:int(len(x) / sr / 0.5)],
               events=events(x, sr))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        spectrogram_png(x, sr, os.path.join(out_dir, "spectrogram.png"))
        json.dump(rep, open(os.path.join(out_dir, "audio_report.json"), "w"), indent=1)
    return rep


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    r = analyse(a.input, a.out)
    ev = r.pop("events")
    print(json.dumps(r, indent=1))
    print(f"{len(ev)} events:")
    for e in ev:
        print(f"  t={e['t']:6.3f}s  peak {e['peak_dbfs']:6.1f} dBFS  +{e['above_floor_db']:4.1f} dB over floor  "
              f"decay {e['decay_ms']:4d} ms  centroid {e['centroid_hz']} Hz")
