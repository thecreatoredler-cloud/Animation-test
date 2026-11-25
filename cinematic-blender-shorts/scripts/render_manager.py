"""Render a shot's frames: resumable, skips finished frames, logs time + memory per frame.

Run with Blender's Python (bpy module) or Blender itself:
    python render_manager.py PROJECT/blend/s01.blend --profile review [--frames 1-240] [--step 1]
    blender -b -P render_manager.py -- PROJECT/blend/s01.blend --profile final --frames 1,60,120

Output:  PROJECT/renders/<profile>/<shot>/<frame:04d>.<ext>
Log:     PROJECT/renders/<profile>/<shot>/render_log.csv  (frame, seconds, rss_mb, engine, WxH, status)
A frame counts as done only if its file exists and is non-empty, so a killed render
resumes where it stopped. --force re-renders. Failed frames are logged as 'error' and skipped
so one bad frame never blocks the rest.
"""
import csv
import os
import sys
import time
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def parse_frames(spec, start, end, step=1):
    if not spec:
        return list(range(start, end + 1, step))
    out = []
    for part in spec.split(","):
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a), int(b) + 1, step))
        else:
            out.append(int(part))
    return sorted(set(f for f in out if start <= f <= end))


def rss_mb():
    try:
        with open("/proc/self/status") as fh:
            for line in fh:
                if line.startswith("VmHWM"):  # peak resident memory
                    return int(line.split()[1]) / 1024
    except OSError:
        pass
    return -1


def apply_sets(scene, sets):
    """--set 'cycles.samples=8' 'render.use_motion_blur=False' : experiment knobs (paths from scene)."""
    import ast
    for s in sets or []:
        path, val = s.split("=", 1)
        try:
            val = ast.literal_eval(val)
        except Exception:
            pass
        obj = scene
        parts = path.split(".")
        for p in parts[:-1]:
            obj = getattr(obj, p)
        setattr(obj, parts[-1], val)
        print(f"[render_manager] set {path} = {val!r}")


def render(blend, profile="preview", frames=None, step=1, engine=None, force=False, out_root=None,
           samples=None, res=None, sets=None):
    import bpy
    import blender_setup as bs
    bpy.ops.wm.open_mainfile(filepath=blend)
    scene = bpy.context.scene
    p = bs.apply_profile(scene, profile, engine=engine)
    if samples:
        if scene.render.engine == "CYCLES":
            scene.cycles.samples = samples
        else:
            scene.eevee.taa_render_samples = samples
    if res:
        scene.render.resolution_x, scene.render.resolution_y = res
    apply_sets(scene, sets)
    shot = os.path.splitext(os.path.basename(blend))[0]
    project = os.path.dirname(os.path.dirname(os.path.abspath(blend)))
    out_dir = out_root or os.path.join(project, "renders", profile, shot)
    os.makedirs(out_dir, exist_ok=True)
    ext = "jpg" if p["file_format"] == "JPEG" else "png"
    todo = parse_frames(frames, scene.frame_start, scene.frame_end, step)
    log_path = os.path.join(out_dir, "render_log.csv")
    new_log = not os.path.exists(log_path)
    eng = scene.render.engine
    wh = f"{scene.render.resolution_x}x{scene.render.resolution_y}"
    done = skipped = failed = 0
    t_all = time.time()
    with open(log_path, "a", newline="") as fh:
        w = csv.writer(fh)
        if new_log:
            w.writerow(["frame", "seconds", "peak_rss_mb", "engine", "resolution", "samples", "status", "timestamp"])
        for f in todo:
            path = os.path.join(out_dir, f"{f:04d}.{ext}")
            if not force and os.path.exists(path) and os.path.getsize(path) > 0:
                skipped += 1
                continue
            scene.frame_set(f)
            scene.render.filepath = path
            t = time.time()
            status = "ok"
            try:
                bpy.ops.render.render(write_still=True)
                if not os.path.exists(path):
                    status = "missing_output"
            except Exception:
                status = "error"
                traceback.print_exc()
            dt = time.time() - t
            smp = scene.cycles.samples if eng == "CYCLES" else scene.eevee.taa_render_samples
            w.writerow([f, round(dt, 2), round(rss_mb()), eng, wh, smp, status, int(time.time())])
            fh.flush()
            if status == "ok":
                done += 1
            else:
                failed += 1
            print(f"[render_manager] {shot} frame {f} {status} {dt:.1f}s", flush=True)
    summary = dict(shot=shot, profile=profile, engine=eng, resolution=wh, rendered=done, skipped=skipped,
                   failed=failed, wall_s=round(time.time() - t_all, 1), out_dir=out_dir)
    print("[render_manager] SUMMARY", summary, flush=True)
    return summary


def _argv():
    a = sys.argv
    return a[a.index("--") + 1:] if "--" in a else a[1:]


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("blend")
    ap.add_argument("--profile", default="preview", choices=["preview", "review", "final", "final_fast"])
    ap.add_argument("--frames", default=None, help="e.g. 1-240 or 1,60,120")
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--engine", default=None, choices=[None, "BLENDER_EEVEE", "CYCLES"])
    ap.add_argument("--samples", type=int, default=None)
    ap.add_argument("--res", default=None, help="WxH override, e.g. 1080x1920")
    ap.add_argument("--out", default=None, help="output dir override (benchmarks)")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--set", nargs="*", default=None, help="scene property overrides, e.g. cycles.use_denoising=False")
    a = ap.parse_args(_argv())
    res = tuple(int(x) for x in a.res.split("x")) if a.res else None
    render(os.path.abspath(a.blend), a.profile, a.frames, a.step, a.engine, a.force, a.out, a.samples, res, a.set)
