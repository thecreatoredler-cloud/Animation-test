#!/usr/bin/env python3
"""Compare render variants against a reference at the SAME resolution (quality evidence).

    python3 image_compare.py REF_DIR CAND_DIR [CAND_DIR ...] --frames 100,165 [--crop x,y,w,h] [--out sheet.jpg]

Per frame and candidate: PSNR (dB) and SSIM (luma, 11x11 Gaussian) vs the reference, plus a
side-by-side sheet of 100 % crops (no scaling, so denoiser smearing / noise is visible).
Rules of thumb (our scenes, 1440x2560): SSIM >= 0.97 and PSNR >= 36 dB were visually
indistinguishable at 100 % in pilot tests; look at the crops anyway - numbers miss blotches.
"""
import argparse
import glob
import os

import cv2
import numpy as np


def ssim(a, b):
    a = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float64)
    b = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY).astype(np.float64)
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    mu_a, mu_b = g(a), g(b)
    sa, sb, sab = g(a * a) - mu_a ** 2, g(b * b) - mu_b ** 2, g(a * b) - mu_a * mu_b
    m = ((2 * mu_a * mu_b + c1) * (2 * sab + c2)) / ((mu_a ** 2 + mu_b ** 2 + c1) * (sa + sb + c2))
    return float(m.mean())


def psnr(a, b):
    mse = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return float(10 * np.log10(255 ** 2 / mse)) if mse > 0 else 99.0


def find(d, f):
    hits = glob.glob(os.path.join(d, f"{f:04d}.*")) + glob.glob(os.path.join(d, f"*_f{f}_*.png"))
    return hits[0] if hits else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ref")
    ap.add_argument("cands", nargs="+")
    ap.add_argument("--frames", required=True)
    ap.add_argument("--crop", default=None, help="x,y,w,h in full-res pixels")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    frames = [int(x) for x in a.frames.split(",")]
    rows = []
    sheet_rows = []
    for f in frames:
        r = cv2.imread(find(a.ref, f))
        tiles = []
        if a.crop:
            x, y, w, h = map(int, a.crop.split(","))
        else:
            h, w = r.shape[0] // 4, r.shape[1] // 2
            x, y = r.shape[1] // 4, r.shape[0] // 2 - h // 2
        tiles.append(("reference", r[y:y + h, x:x + w]))
        for c in a.cands:
            p = find(c, f)
            if not p:
                continue
            im = cv2.imread(p)
            if im.shape != r.shape:
                im = cv2.resize(im, (r.shape[1], r.shape[0]), interpolation=cv2.INTER_LANCZOS4)
            s, ps = ssim(r, im), psnr(r, im)
            rows.append((f, os.path.basename(c.rstrip("/")), s, ps))
            tiles.append((f"{os.path.basename(c.rstrip('/'))} SSIM {s:.3f} PSNR {ps:.1f}", im[y:y + h, x:x + w]))
        row = []
        for label, t in tiles:
            t = t.copy()
            cv2.putText(t, label, (8, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            row.append(t)
        sheet_rows.append(np.hstack(row))
    for f, c, s, ps in rows:
        print(f"frame {f:4d}  {c:28} SSIM {s:.4f}  PSNR {ps:5.1f} dB")
    if a.out:
        wmax = max(r.shape[1] for r in sheet_rows)
        sheet_rows = [np.pad(r, ((0, 0), (0, wmax - r.shape[1]), (0, 0))) for r in sheet_rows]
        cv2.imwrite(a.out, np.vstack(sheet_rows), [cv2.IMWRITE_JPEG_QUALITY, 90])
        print("sheet:", a.out)


if __name__ == "__main__":
    main()
