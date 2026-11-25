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


def frame_state_hash(bpy, scene, static_sig):
    """Hash of everything that changes between frames: object transforms + visibility, camera
    lens/focus/aperture, light energy/colour, plus a static signature of render settings and
    material node values. Same hash => the frame would render identically => skip it."""
    import hashlib
    h = hashlib.sha1(static_sig.encode())
    for o in sorted(scene.objects, key=lambda o: o.name):
        if o.hide_render:
            continue
        m = o.matrix_world
        h.update(o.name.encode())
        h.update(("%.6f," * 16 % tuple(v for row in m for v in row)).encode())
        if o.type == "CAMERA":
            d = o.data
            h.update(f"{d.lens:.4f}{d.dof.focus_distance:.5f}{d.dof.aperture_fstop:.3f}".encode())
        elif o.type == "LIGHT":
            h.update(f"{o.data.energy:.4f}{tuple(round(c, 4) for c in o.data.color)}".encode())
    return h.hexdigest()


def static_signature(bpy, scene):
    """Render settings + material/world node values (not animated per frame here)."""
    parts = [scene.render.engine, str(scene.render.resolution_x), str(scene.render.resolution_y),
             str(getattr(scene.cycles, "samples", "")), str(scene.render.use_motion_blur),
             str(getattr(scene.cycles, "denoising_prefilter", ""))]
    for m in list(bpy.data.materials) + list(bpy.data.worlds):
        if m.node_tree:
            for n in m.node_tree.nodes:
                for i in n.inputs:
                    v = getattr(i, "default_value", None)
                    try:
                        parts.append(f"{m.name}.{n.name}.{i.name}={tuple(v) if hasattr(v, '__len__') else v}")
                    except TypeError:
                        pass
                img = getattr(n, "image", None)
                if img:
                    parts.append(img.filepath)
    for me in bpy.data.meshes:
        parts.append(f"{me.name}:{len(me.vertices)}:{len(me.polygons)}")
    return "|".join(parts)


def render(blend, profile="preview", frames=None, step=1, engine=None, force=False, out_root=None,
           samples=None, res=None, sets=None, changed_only=False):
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
    import json
    hash_path = os.path.join(out_dir, "frame_hashes.json")
    old_hashes = json.load(open(hash_path)) if os.path.exists(hash_path) else {}
    sig = static_signature(bpy, scene)
    new_hashes = dict(old_hashes)
    unchanged = 0
    done = skipped = failed = 0
    t_all = time.time()
    with open(log_path, "a", newline="") as fh:
        w = csv.writer(fh)
        if new_log:
            w.writerow(["frame", "seconds", "peak_rss_mb", "engine", "resolution", "samples", "status", "timestamp"])
        for f in todo:
            path = os.path.join(out_dir, f"{f:04d}.{ext}")
            scene.frame_set(f)
            hsh = frame_state_hash(bpy, scene, sig)
            exists = os.path.exists(path) and os.path.getsize(path) > 0
            if changed_only and exists and old_hashes.get(str(f)) == hsh:
                unchanged += 1
                continue
            if not force and not changed_only and exists:
                skipped += 1
                new_hashes.setdefault(str(f), hsh)
                continue
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
                new_hashes[str(f)] = hsh
                json.dump(new_hashes, open(hash_path, "w"))
            else:
                failed += 1
            print(f"[render_manager] {shot} frame {f} {status} {dt:.1f}s", flush=True)
    json.dump(new_hashes, open(hash_path, "w"))
    summary = dict(shot=shot, profile=profile, engine=eng, resolution=wh, rendered=done, skipped=skipped,
                   unchanged=unchanged,
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
    ap.add_argument("--profile", default="preview", choices=["preview", "review", "final", "final_hq", "final_fast"])
    ap.add_argument("--frames", default=None, help="e.g. 1-240 or 1,60,120")
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--engine", default=None, choices=[None, "BLENDER_EEVEE", "CYCLES"])
    ap.add_argument("--samples", type=int, default=None)
    ap.add_argument("--res", default=None, help="WxH override, e.g. 1080x1920")
    ap.add_argument("--out", default=None, help="output dir override (benchmarks)")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--changed-only", action="store_true",
                    help="re-render only frames whose scene-state hash differs from the last render")
    ap.add_argument("--set", nargs="*", default=None, help="scene property overrides, e.g. cycles.use_denoising=False")
    a = ap.parse_args(_argv())
    res = tuple(int(x) for x in a.res.split("x")) if a.res else None
    render(os.path.abspath(a.blend), a.profile, a.frames, a.step, a.engine, a.force, a.out, a.samples, res, a.set, a.changed_only)
