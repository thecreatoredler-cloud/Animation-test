#!/usr/bin/env python3
"""Automatic QC for a project: frames, motion vs reference targets, final video specs.

    python3 quality_control.py PROJECT_DIR [--profile review] [--video output/x.mp4]

Writes PROJECT_DIR/qc/QC_<profile>.md, contact_<profile>.jpg (every ~0.5 s) for the human
review pass, and qc.json. Automatic checks cannot judge beauty: the report ends with the
manual checklist that a person (or Claude looking at the contact sheet) must fill in.
"""
import argparse
import glob
import json
import os
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# Targets from references/zach_visual_analysis.md (18-short medians and ranges)
TARGETS = dict(camera_still_max=0.33, zoom_mean_abs_min=0.25, zoom_mean_abs_max=2.0, resid_min=4.0)


def check_frames(project_dir, profile, shots, fps):
    issues, stats = [], []
    for shot in shots:
        d = os.path.join(project_dir, "renders", profile, shot)
        files = sorted(glob.glob(os.path.join(d, "[0-9]" * 4 + ".*")))
        if not files:
            issues.append(f"{shot}: no frames")
            continue
        nums = [int(os.path.basename(f)[:4]) for f in files]
        gaps = sorted(set(range(nums[0], nums[-1] + 1)) - set(nums))
        if gaps:
            issues.append(f"{shot}: {len(gaps)} missing frames, first {gaps[:10]}")
        log = os.path.join(d, "render_log.csv")
        if os.path.exists(log):
            bad = [l.split(",")[0] for l in open(log).read().splitlines()[1:] if ",ok," not in l]
            if bad:
                issues.append(f"{shot}: render_log non-ok frames {bad[:10]}")
        prev = None
        size0 = None
        diffs = []
        for f in files:
            im = cv2.imread(f)
            if im is None:
                issues.append(f"{shot}: unreadable {os.path.basename(f)}")
                continue
            size0 = size0 or im.shape[:2]
            if im.shape[:2] != size0:
                issues.append(f"{shot}: size change at {os.path.basename(f)}")
            g = cv2.cvtColor(cv2.resize(im, (180, 320)), cv2.COLOR_BGR2GRAY).astype(np.float32)
            m, s = float(g.mean()), float(g.std())
            if m < 8 or s < 2:
                issues.append(f"{shot}: black/blank frame {os.path.basename(f)} (mean {m:.1f}, std {s:.1f})")
            if prev is not None:
                diff = float(np.abs(g - prev).mean())
                dmean = abs(m - float(prev.mean()))
                diffs.append((os.path.basename(f), diff))
                if diff == 0:
                    issues.append(f"{shot}: duplicate frame {os.path.basename(f)} (frozen)")
                if dmean > 12 and diff < 25:  # brightness jump without content change = flicker
                    issues.append(f"{shot}: possible flicker at {os.path.basename(f)} (luma jump {dmean:.1f})")
            stats.append((shot, os.path.basename(f), m, s))
            prev = g
        # temporal spike: a frame-to-frame change far above its neighbours' (pops, stale geometry)
        vals = np.array([d for _, d in diffs])
        for i, (name, d) in enumerate(diffs):
            nb = np.concatenate([vals[max(0, i - 8):i], vals[i + 1:i + 9]])
            if len(nb) >= 4 and d > 6 and d > 4 * float(np.median(nb)):
                issues.append(f"{shot}: temporal spike at {name} (change {d:.1f} vs typical {np.median(nb):.1f})")
        if size0 and abs(size0[1] / size0[0] - 9 / 16) > 0.01:
            issues.append(f"{shot}: aspect {size0[1]}x{size0[0]} is not 9:16")
    return issues, stats


def contact_sheet(project_dir, profile, shots, fps, out, every_s=0.5, width=200, cols=8):
    tiles = []
    for shot in shots:
        files = sorted(glob.glob(os.path.join(project_dir, "renders", profile, shot, "[0-9]" * 4 + ".*")))
        step = max(1, int(round(fps * every_s)))
        for f in files[::step]:
            im = cv2.imread(f)
            im = cv2.resize(im, (width, int(width * im.shape[0] / im.shape[1])))
            cv2.putText(im, f"{shot[:10]} {os.path.basename(f)[:4]}", (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.38,
                        (255, 255, 255), 1, cv2.LINE_AA)
            tiles.append(im)
    if not tiles:
        return None
    h, w = tiles[0].shape[:2]
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
    cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
    return out


def probe(video):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "stream=codec_type,width,height,r_frame_rate,nb_frames:format=duration",
                        "-of", "json", video], capture_output=True, text=True)
    return json.loads(r.stdout)


def motion(video, out_dir):
    r = subprocess.run([sys.executable, os.path.join(HERE, "analyze_reference.py"), video, "--fps", "15",
                        "--out", out_dir], capture_output=True, text=True)
    try:
        return json.load(open(os.path.join(out_dir, "summary.json")))
    except Exception:
        return {"error": r.stderr[-500:]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("--profile", default="review")
    ap.add_argument("--video", default=None)
    a = ap.parse_args()
    pd = os.path.abspath(a.project_dir)
    pj = json.load(open(os.path.join(pd, "project.json")))
    fps = pj.get("fps", 30)
    qc = os.path.join(pd, "qc")
    os.makedirs(qc, exist_ok=True)
    rows = []

    def row(name, ok, note):
        rows.append((name, "PASS" if ok else "FIX", note))

    issues, stats = check_frames(pd, a.profile, pj["shots"], fps)
    row("Frames: complete, readable, 9:16, no black/frozen/flicker", not issues,
        "; ".join(issues[:8]) or f"{len(stats)} frames checked")
    sheet = contact_sheet(pd, a.profile, pj["shots"], fps, os.path.join(qc, f"contact_{a.profile}.jpg"))

    video = a.video or os.path.join(pd, "output", f"{os.path.basename(pd)}_{a.profile}.mp4")
    m = {}
    if os.path.exists(video):
        info = probe(video)
        v = [s for s in info["streams"] if s["codec_type"] == "video"][0]
        au = [s for s in info["streams"] if s["codec_type"] == "audio"]
        num, den = map(int, v["r_frame_rate"].split("/"))
        exp = pj.get("resolution", [1440, 2560])
        exp = exp if a.profile in ("final", "final_fast") else [exp[0] // 2, exp[1] // 2]
        row("Video: resolution", [v["width"], v["height"]] == exp, f"{v['width']}x{v['height']} (expected {exp[0]}x{exp[1]})")
        row("Video: 30 fps", abs(num / den - fps) < 0.01, f"{num}/{den}")
        row("Video: audio track present", bool(au), f"{len(au)} audio stream(s)")
        m = motion(video, os.path.join(qc, "motion"))
        if "error" not in m:
            row("Motion: camera never parked (still fraction <= %.2f)" % TARGETS["camera_still_max"],
                m["frac_camera_still"] <= TARGETS["camera_still_max"], f"still {m['frac_camera_still']}")
            row("Motion: zoom rate in reference range %.2f-%.2f %%/frame" % (TARGETS["zoom_mean_abs_min"], TARGETS["zoom_mean_abs_max"]),
                TARGETS["zoom_mean_abs_min"] <= m["zoom_pct_per_frame_mean_abs"] <= TARGETS["zoom_mean_abs_max"],
                f"mean |zoom| {m['zoom_pct_per_frame_mean_abs']} %/frame, in {m['frac_zooming_in']} / out {m['frac_zooming_out']}")
            row("Motion: subject animates, not only the camera (residual >= %.0f px/s)" % TARGETS["resid_min"],
                m["resid_median"] >= TARGETS["resid_min"], f"residual {m['resid_median']} px/s")
    else:
        row("Video: assembled", False, f"not found: {video}")

    lines = [f"# QC report: {os.path.basename(pd)} ({a.profile})", "",
             f"Contact sheet: `{os.path.relpath(sheet, pd) if sheet else 'n/a'}`", "",
             "## Automatic checks", "", "| Check | Result | Note |", "|---|---|---|"]
    lines += [f"| {n} | {r} | {t} |" for n, r, t in rows]
    lines += ["", "## Manual checks (fill in after looking at the contact sheet and the video)", "",
              "| Check | Result | Note |", "|---|---|---|"]
    for item in ["Subject reads instantly in the first second (hook)", "Materials convincing (no plastic CG look)",
                 "Lighting: key/fill/rim, soft defined shadows, no clipped highlights",
                 "Environment has foreground/mid/background depth", "Camera moves have purpose, no jumps",
                 "Animation: eased, anticipation/follow-through, contacts correct, no intersections",
                 "Attachments follow their surfaces", "Captions readable, synced, inside safe area",
                 "Sound synced to visual events, layered, no clipping", "Matches reference visual mode"]:
        lines.append(f"| {item} | ? | |")
    open(os.path.join(qc, f"QC_{a.profile}.md"), "w").write("\n".join(lines) + "\n")
    json.dump(dict(rows=rows, motion=m, issues=issues), open(os.path.join(qc, "qc.json"), "w"), indent=1)
    print("\n".join(f"{r:4} {n}: {t}" for n, r, t in rows))
    print("report:", os.path.join(qc, f"QC_{a.profile}.md"))


if __name__ == "__main__":
    main()
