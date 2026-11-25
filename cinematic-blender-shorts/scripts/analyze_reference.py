#!/usr/bin/env python3
"""Measure a reference video: shot cuts, shot lengths, camera motion per shot.

Usage:
  python3 analyze_reference.py VIDEO [--start S] [--end S] [--fps 10] [--out DIR] [--thumbs]

Writes DIR/shots.csv (one row per shot) and DIR/summary.json.
Per shot it reports zoom (scale change per second), pan (px/s in a 1000-px-tall
frame, so numbers compare across resolutions), rotation, "still" fraction and
residual motion (things moving that the camera move does not explain:
character/object animation).  Works on any video; needs opencv-python + numpy.
Method: frame-diff of HSV histograms for cuts; Lucas-Kanade tracks + RANSAC
similarity transform for camera motion; median flow residual for object motion.
"""
import argparse, csv, json, os, sys
import cv2, numpy as np

def hist(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([hsv], [0, 1], None, [32, 32], [0, 180, 0, 256])
    return cv2.normalize(h, h).flatten()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--fps", type=float, default=10, help="analysis sample rate")
    ap.add_argument("--cut", type=float, default=0.45, help="histogram distance for a cut")
    ap.add_argument("--out", default="analysis"); ap.add_argument("--thumbs", action="store_true")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    cap = cv2.VideoCapture(a.video)
    src_fps = cap.get(cv2.CAP_PROP_FPS); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    end = a.end if a.end else n / src_fps
    step = max(1, round(src_fps / a.fps)); dt = step / src_fps
    scale = 360.0 / max(W, H)  # analyse small for speed
    norm = 1000.0 / (H * scale)  # pan in px per 1000-px frame height
    cap.set(cv2.CAP_PROP_POS_MSEC, a.start * 1000)
    prev = prevh = None; t = a.start; idx = 0
    shots = []; cur = None
    def new_shot(t0, frame):
        s = dict(start=t0, end=t0, zoom=[], pan=[], rot=[], resid=[], frames=0)
        if a.thumbs:
            cv2.imwrite(os.path.join(a.out, f"shot_{len(shots)+1:03d}_{t0:07.2f}.jpg"), frame)
        return s
    while t < end:
        ok, f = cap.read()
        if not ok: break
        if idx % step: idx += 1; continue
        idx += 1; t = a.start + (idx - 1) / src_fps
        sm = cv2.resize(f, None, fx=scale, fy=scale); g = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY)
        h = hist(sm)
        if prevh is None or cv2.compareHist(prevh, h, cv2.HISTCMP_BHATTACHARYYA) > a.cut:
            if cur: shots.append(cur)
            cur = new_shot(t, f)
        else:
            p0 = cv2.goodFeaturesToTrack(prev, 200, 0.01, 8)
            if p0 is not None and len(p0) >= 12:
                p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, p0, None)
                good0, good1 = p0[st == 1], p1[st == 1]
                if len(good0) >= 8:
                    M, inl = cv2.estimateAffinePartial2D(good0, good1, method=cv2.RANSAC)
                    if M is not None:
                        sc = float(np.hypot(M[0, 0], M[1, 0])); rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
                        cur["zoom"].append((sc - 1) / dt); cur["pan"].append(float(np.hypot(M[0, 2], M[1, 2])) * norm / dt)
                        cur["rot"].append(rot / dt)
                        pred = cv2.transform(good0.reshape(-1, 1, 2), M).reshape(-1, 2)
                        cur["resid"].append(float(np.median(np.linalg.norm(good1 - pred, axis=1))) * norm / dt)
        cur["end"] = t + dt; cur["frames"] += 1
        prev, prevh = g, h
    if cur: shots.append(cur)
    rows = []
    for i, s in enumerate(shots, 1):
        m = lambda k: float(np.median(np.abs(s[k]))) if s[k] else 0.0
        zs = np.array(s["zoom"]) if s["zoom"] else np.zeros(1)
        pans = np.array(s["pan"]) if s["pan"] else np.zeros(1)
        still = float(np.mean((np.abs(zs) < 0.01) & (pans < 8)))
        move = "still" if still > 0.8 else ("push-in" if np.median(zs) > 0.01 else "pull-out" if np.median(zs) < -0.01 else "pan/track")
        rows.append(dict(shot=i, start=round(s["start"], 2), dur=round(s["end"] - s["start"], 2),
                         zoom_per_s=round(float(np.median(zs)), 4), pan_px_s=round(m("pan"), 1),
                         rot_deg_s=round(m("rot"), 2), resid_px_s=round(m("resid"), 1),
                         still_frac=round(still, 2), camera=move))
    with open(os.path.join(a.out, "shots.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    durs = np.array([r["dur"] for r in rows])
    moves = {}
    for r in rows: moves[r["camera"]] = moves.get(r["camera"], 0) + 1
    summ = dict(video=os.path.basename(a.video), width=W, height=H, fps=round(src_fps, 3), frames=n,
                analysed_seconds=round(end - a.start, 1), shots=len(rows),
                shot_len_median=round(float(np.median(durs)), 2), shot_len_mean=round(float(durs.mean()), 2),
                shot_len_p10=round(float(np.percentile(durs, 10)), 2), shot_len_p90=round(float(np.percentile(durs, 90)), 2),
                camera_moves=moves,
                zoom_abs_median=round(float(np.median([abs(r["zoom_per_s"]) for r in rows])), 4),
                pan_median=round(float(np.median([r["pan_px_s"] for r in rows])), 1),
                resid_median=round(float(np.median([r["resid_px_s"] for r in rows])), 1))
    json.dump(summ, open(os.path.join(a.out, "summary.json"), "w"), indent=2)
    print(json.dumps(summ, indent=2))

if __name__ == "__main__":
    main()
