#!/usr/bin/env python3
"""Benchmark representative frames across engines/settings and project full-video render time.

Runs render_manager.py in a fresh process per configuration (clean memory numbers).
    python3 render_benchmark.py BLEND --frames 1,110,240 --configs eevee_final cycles_final \
        --blender-python /opt/bvenv/bin/python --video-seconds 40
Configs: name -> (profile, engine, samples override or None, res override or None). Add new ones
below; keep names stable so logs stay comparable. Results append to
benchmarks/performance_logs/benchmarks.csv and print a feasibility table against the
9-hour budget with 20 % reserved for overhead.
"""
import argparse, csv, os, subprocess, sys, time, statistics, socket

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONFIGS = {
    "eevee_preview": ("preview", "BLENDER_EEVEE", None, None),
    "eevee_review": ("review", "BLENDER_EEVEE", None, None),
    "eevee_final": ("final", "BLENDER_EEVEE", None, None),
    "eevee_final_s24": ("final", "BLENDER_EEVEE", 24, None),
    "eevee_final_s16": ("final", "BLENDER_EEVEE", 16, None),
    "cycles_review": ("review", "CYCLES", None, None),
    "cycles_final": ("final", "CYCLES", None, None),
    "cycles_final_s32": ("final", "CYCLES", 32, None),
    "cycles_final_s16": ("final", "CYCLES", 16, None),
    "eevee_1080": ("final", "BLENDER_EEVEE", None, "1080x1920"),
}


def run(blender_cmd, blend, frames, name, cfg):
    profile, engine, samples, res = cfg
    shot = os.path.splitext(os.path.basename(blend))[0]
    out = os.path.join(ROOT, "benchmarks", "render_tests", shot, name)
    cmd = blender_cmd + [os.path.join(HERE, "render_manager.py")]
    if "blender" in os.path.basename(blender_cmd[0]):
        cmd = blender_cmd + ["-b", "-P", os.path.join(HERE, "render_manager.py"), "--"]
    cmd += [blend, "--profile", profile, "--engine", engine, "--frames", frames, "--out", out, "--force"]
    if samples:
        cmd += ["--samples", str(samples)]
    if res:
        cmd += ["--res", res]
    t = time.time()
    p = subprocess.run(cmd, capture_output=True, text=True)
    wall = time.time() - t
    rows = []
    log = os.path.join(out, "render_log.csv")
    if os.path.exists(log):
        with open(log) as fh:
            rows = [r for r in csv.DictReader(fh)][-len(frames.split(",")):]
    if p.returncode != 0 or not rows:
        print(p.stdout[-2000:], p.stderr[-2000:])
    return rows, wall, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("blend")
    ap.add_argument("--frames", default="1,120,240")
    ap.add_argument("--configs", nargs="+", default=["eevee_final", "cycles_final"])
    ap.add_argument("--blender-python", default=os.environ.get("BLENDER_PY", sys.executable),
                    help="python with bpy, or path to the blender binary")
    ap.add_argument("--video-seconds", type=float, default=40)
    ap.add_argument("--budget-hours", type=float, default=9.0)
    ap.add_argument("--note", default="")
    a = ap.parse_args()
    blend = os.path.abspath(a.blend)
    logdir = os.path.join(ROOT, "benchmarks", "performance_logs")
    os.makedirs(logdir, exist_ok=True)
    master = os.path.join(logdir, "benchmarks.csv")
    new = not os.path.exists(master)
    frames_total = int(a.video_seconds * 30)
    usable = a.budget_hours * 3600 * 0.8
    print(f"Budget: {a.budget_hours} h, 20% reserve -> {usable/3600:.1f} h usable; {frames_total} frames "
          f"-> ceiling {usable/frames_total:.1f} s/frame")
    with open(master, "a", newline="") as fh:
        w = csv.writer(fh)
        if new:
            w.writerow(["date", "host", "cpus", "blend", "config", "frame", "seconds", "peak_rss_mb",
                        "resolution", "samples", "status", "note"])
        for name in a.configs:
            rows, wall, out = run([a.blender_python], blend, a.frames, name, CONFIGS[name])
            secs = [float(r["seconds"]) for r in rows if r["status"] == "ok"]
            for r in rows:
                w.writerow([time.strftime("%Y-%m-%d"), socket.gethostname(), os.cpu_count(),
                            os.path.basename(blend), name, r["frame"], r["seconds"], r["peak_rss_mb"],
                            r["resolution"], r["samples"], r["status"], a.note])
            if not secs:
                print(f"{name}: FAILED"); continue
            # first frame includes shader compilation / scene load; report steady-state mean too
            steady = secs[1:] if len(secs) > 1 else secs
            mean = statistics.mean(steady)
            proj = mean * frames_total / 3600
            ok = "FITS" if mean * frames_total <= usable else "OVER"
            print(f"{name:18} frames {[r['frame'] for r in rows]} times {secs} -> steady mean {mean:.1f}s/frame; "
                  f"{a.video_seconds:.0f}s video = {proj:.2f} h [{ok}] peak RSS {max(float(r['peak_rss_mb']) for r in rows):.0f} MB; out {out}")


if __name__ == "__main__":
    main()
