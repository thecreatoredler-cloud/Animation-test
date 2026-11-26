#!/usr/bin/env python3
"""Place each caption in the negative space of its own frames (never over the action).

    python3 caption_placer.py PROJECT_DIR [--profile final] [--write] [--report out.md]

For every caption interval it samples the rendered frames and scores candidate vertical
positions inside the YouTube Shorts safe area (x 14-86 %, y 15-75 %) by:
  importance = edges (detail the viewer must see) + motion (what is happening now)
               + brightness under the box (white text needs a darker backdrop)
The lowest-scoring band wins; a small penalty for moving between consecutive captions keeps
the eye from jumping. --write stores "y" (centre, fraction of height) per caption in
project.json; video_assembler.py then positions them with \\pos.
Measured result is printed: importance under the caption box before (fixed position) and after.
"""
import argparse
import glob
import json
import os

import cv2
import numpy as np

BANDS = [0.20, 0.30, 0.42, 0.62, 0.72]     # caption centre candidates (fraction of height)
X0, X1 = 0.14, 0.86                         # safe-area width (right ~12 % = player buttons)
SIZE = 0.052                                # caption cap size (fraction of height), as assembler


def lines_for(text, w_frac=X1 - X0, size=SIZE, aspect=9 / 16):
    # rough width of extra-bold sans: ~0.50 em per char (measured on Montserrat ExtraBold renders)
    width = len(text.replace("*", "")) * 0.50 * size / aspect
    return 1 if width <= w_frac else 2


def importance_maps(frames):
    """Per-frame importance (180x320): normalised edges + motion + brightness."""
    out, prev = [], None
    for f in frames:
        im = cv2.imread(f)
        sm = cv2.resize(im, (180, 320), interpolation=cv2.INTER_AREA)
        g = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY).astype(np.float32)
        e = cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))
        e = cv2.GaussianBlur(e, (9, 9), 0)
        e /= (np.percentile(e, 99) + 1e-6)
        m = np.zeros_like(g) if prev is None else cv2.GaussianBlur(np.abs(g - prev), (9, 9), 0) / 40.0
        bright = np.clip((g - 150) / 105, 0, 1)            # very bright = poor white-text contrast
        out.append(np.clip(e, 0, 1.5) + np.clip(m, 0, 1.5) + 0.5 * bright)
        prev = g
    return out


CENTRE_PROTECT = 0.9   # the camera aims at the subject, so the frame centre holds the explained action


def band_score(imaps, yc, n_lines, protect=CENTRE_PROTECT):
    """Importance under the caption box (worst moment weighted) + a penalty for covering the
    frame centre, where camera_tools always places the look target (= the subject)."""
    h = SIZE * 1.3 * n_lines
    y0, y1 = int((yc - h / 2) * 320), int((yc + h / 2) * 320)
    x0, x1 = int(X0 * 180), int(X1 * 180)
    vals = [float(np.percentile(m[max(0, y0):y1, x0:x1], 75)) for m in imaps]
    centre = protect * float(np.exp(-((yc - 0.5) / 0.12) ** 2))
    return max(vals) * 0.6 + float(np.mean(vals)) * 0.4 + centre      # worst moment matters most


def place(project_dir, profile="final", write=False, stability=0.08):
    pj = json.load(open(os.path.join(project_dir, "project.json")))
    fps = pj.get("fps", 30)
    files = []
    for shot in pj["shots"]:
        files += sorted(glob.glob(os.path.join(project_dir, "renders", profile, shot, "[0-9]" * 4 + ".*")))
    rows, prev_y = [], None
    for c in pj["captions"]:
        f0, f1 = int(c["t0"] * fps), min(len(files) - 1, int(c["t1"] * fps))
        sample = files[f0:f1 + 1:max(1, (f1 - f0) // 6 or 1)] or files[f0:f0 + 1]
        imaps = importance_maps(sample)
        nl = lines_for(c["text"])
        scores = {y: band_score(imaps, y, nl) + (stability if prev_y is not None and y != prev_y else 0)
                  for y in BANDS}
        best = min(scores, key=scores.get)
        fixed = band_score(imaps, 0.72, nl)
        rows.append(dict(text=c["text"], t0=c["t0"], y=best, score=round(scores[best], 3),
                         fixed_072=round(fixed, 3), lines=nl))
        if write:
            c["y"] = best
            c.pop("pos", None)
        prev_y = best
    if write:
        json.dump(pj, open(os.path.join(project_dir, "project.json"), "w"), indent=1)
    return rows


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("--profile", default="final")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--report", default=None)
    a = ap.parse_args()
    rows = place(os.path.abspath(a.project_dir), a.profile, a.write)
    lines = ["| t0 | caption | lines | importance at fixed 72 % | chosen y | importance there |", "|---|---|---|---|---|---|"]
    for r in rows:
        lines.append(f"| {r['t0']} | {r['text']} | {r['lines']} | {r['fixed_072']} | {r['y']:.2f} | {r['score']} |")
    print("\n".join(lines))
    if a.report:
        open(a.report, "w").write("\n".join(lines) + "\n")
