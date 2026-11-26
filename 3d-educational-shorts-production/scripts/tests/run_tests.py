#!/usr/bin/env python3
"""Self-test for the skill's scripts. Run from anywhere:

    python3 scripts/tests/run_tests.py            # pure-Python tests (+ Blender tests if found)
    BLENDER_PY=/path/to/blender-or-bpy-python python3 scripts/tests/run_tests.py

Needs: python3 with numpy, scipy, opencv-python-headless; ffmpeg with libass. Blender tests
run only if Blender (binary or bpy module) is detected - otherwise they are reported SKIPPED.
Everything happens in a temporary workspace; nothing is written into the skill folder.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import traceback

SCRIPTS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL = os.path.dirname(SCRIPTS)
sys.path.insert(0, SCRIPTS)
RESULTS = []


def test(name):
    def deco(fn):
        def run(ws):
            try:
                note = fn(ws) or ""
                RESULTS.append((name, "PASS", note))
            except SkipTest as e:
                RESULTS.append((name, "SKIPPED", str(e)))
            except Exception as e:
                RESULTS.append((name, "FAIL", f"{e.__class__.__name__}: {e}"))
                traceback.print_exc()
        run.__name__ = fn.__name__
        return run
    return deco


class SkipTest(Exception):
    pass


def sh(cmd, cwd=None, env=None, timeout=900):
    r = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(f"{cmd[:3]} failed: {r.stderr[-600:]}")
    return r.stdout


def make_frames_project(ws, n=36):
    """Synthetic 9:16 project: moving bright square over a gradient (no Blender needed)."""
    import cv2
    import numpy as np
    pd = os.path.join(ws, "proj")
    d = os.path.join(pd, "renders", "review", "s01_test")
    os.makedirs(d, exist_ok=True)
    for f in range(1, n + 1):
        im = np.zeros((1280, 720, 3), np.uint8)
        im[:] = np.linspace(40, 160, 1280, dtype=np.uint8)[:, None, None]
        x = 100 + f * 10
        cv2.rectangle(im, (x, 560), (x + 160, 720), (60, 160, 230), -1)
        cv2.imwrite(os.path.join(d, f"{f:04d}.jpg"), im)
    os.makedirs(os.path.join(pd, "build"), exist_ok=True)
    json.dump(dict(events=[dict(t=0.3, type="tap", strength=0.8), dict(t=0.6, type="slide", until=0.9)]),
              open(os.path.join(pd, "build", "events_s01_test.json"), "w"))
    pj = dict(fps=30, resolution=[1440, 2560], duration=n / 30, shots=["s01_test"],
              captions=[dict(t0=0.1, t1=0.6, text="Test *caption*"), dict(t0=0.65, t1=1.1, text="second line here")],
              foley=dict(target_lufs=-22, recipes={
                  "tap": dict(kind="impact", objects=["key", "brass_body"], gain_db=-14),
                  "slide": dict(kind="friction", objects=["key"], gain_db=-30)}),
              finish=dict(grain=2, vignette=0.2, sharpen=0.2))
    json.dump(pj, open(os.path.join(pd, "project.json"), "w"))
    return pd


@test("analyze_reference: measures a synthetic 2 %/frame zoom")
def t_analyze(ws):
    v = os.path.join(ws, "zoom.mp4")
    sh(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=720x1280:rate=30:duration=3",
        "-vf", "zoompan=z='1+0.02*on':d=1:s=720x1280:fps=30", "-pix_fmt", "yuv420p", v])
    import json as _j
    out = os.path.join(ws, "an")
    sh([sys.executable, os.path.join(SCRIPTS, "analyze_reference.py"), v, "--fps", "30", "--out", out])
    s = _j.load(open(os.path.join(out, "summary.json")))
    assert s["frac_zooming_in"] > 0.5, s
    return f"zoom {s['zoom_pct_per_frame_mean_abs']} %/frame, in {s['frac_zooming_in']}"


@test("foley + audio_analysis: events render, loudness/peaks measured, ducking works")
def t_foley(ws):
    import numpy as np
    import foley
    import audio_analysis as aa
    from scipy.io import wavfile
    evs = [dict(t=0.2, type="tap", strength=1.0), dict(t=0.5, type="slide", until=1.0)]
    rec = {"tap": dict(kind="impact", objects=["key", "brass_body"], gain_db=-12),
           "slide": dict(kind="friction", objects=["key"], gain_db=-28)}
    st, info, log = foley.render(evs, rec, 1.5, target_lufs=-22)
    p = os.path.join(ws, "f.wav")
    wavfile.write(p, foley.SR, (st * 32767).astype(np.int16))
    r = aa.analyse(p)
    assert r["true_peak_dbtp"] <= -0.5 and len(r["events"]) >= 1, r
    voice = np.zeros(int(1.5 * foley.SR)); voice[int(0.6 * foley.SR):int(1.2 * foley.SR)] = 0.2 * np.random.default_rng(0).standard_normal(int(0.6 * foley.SR))
    g = foley.duck_gain(voice, -8.0)
    assert 20 * np.log10(g[int(0.9 * foley.SR)]) < -7.0 and g[int(0.3 * foley.SR)] > 0.99
    return f"{r['integrated_lufs']} LUFS, TP {r['true_peak_dbtp']} dBTP, {len(r['events'])} onsets; duck -8 dB ok"


@test("image_compare: SSIM/PSNR identical vs degraded")
def t_compare(ws):
    import cv2
    import numpy as np
    import image_compare as ic
    a = (np.random.default_rng(1).random((256, 144, 3)) * 255).astype(np.uint8)
    a = cv2.GaussianBlur(a, (9, 9), 0)
    b = cv2.GaussianBlur(a, (7, 7), 0)
    assert ic.ssim(a, a) > 0.999 and ic.ssim(a, b) < ic.ssim(a, a)
    return f"SSIM self {ic.ssim(a, a):.3f}, blurred {ic.ssim(a, b):.3f}"


@test("caption_placer + video_assembler + quality_control on a synthetic project")
def t_pipeline(ws):
    pd = make_frames_project(ws)
    sh([sys.executable, os.path.join(SCRIPTS, "caption_placer.py"), pd, "--profile", "review", "--write"])
    pj = json.load(open(os.path.join(pd, "project.json")))
    assert all("y" in c for c in pj["captions"])
    sh([sys.executable, os.path.join(SCRIPTS, "video_assembler.py"), pd, "--profile", "review"])
    out = os.path.join(pd, "output", "proj_review.mp4")
    assert os.path.getsize(out) > 10000
    q = sh([sys.executable, os.path.join(SCRIPTS, "quality_control.py"), pd, "--profile", "review"])
    assert "Video: resolution" in q and "FIX Frames" not in q, q
    return f"captions at y={[c['y'] for c in pj['captions']]}; mp4 + QC ok"


def blender_cmd():
    b = os.environ.get("BLENDER_PY") or shutil.which("blender")
    if not b:
        try:
            import bpy  # noqa
            return [sys.executable]
        except ImportError:
            return None
    return [b]


@test("Blender: build template shot, preview-render 2 frames, resume skips them")
def t_blender(ws):
    b = blender_cmd()
    if not b:
        raise SkipTest("no Blender found (set BLENDER_PY)")
    pd = os.path.join(ws, "bproj")
    shutil.copytree(os.path.join(SKILL, "templates", "project_template"), pd)
    is_bin = os.path.basename(b[0]).lower().startswith("blender")
    build = b + (["-b", "-P"] if is_bin else []) + [os.path.join(SCRIPTS, "scene_builder.py")] + (["--"] if is_bin else []) + [pd, "s01_example"]
    sh(build, timeout=900)
    blend = os.path.join(pd, "blend", "s01_example.blend")
    rm = b + (["-b", "-P"] if is_bin else []) + [os.path.join(SCRIPTS, "render_manager.py")] + (["--"] if is_bin else []) + [blend, "--profile", "preview", "--frames", "1,60"]
    sh(rm, timeout=900)
    out = sh(rm, timeout=900)
    assert "'skipped': 2" in out, out[-400:]
    return "built, rendered 2 frames, re-run skipped 2"


if __name__ == "__main__":
    ws = tempfile.mkdtemp(prefix="shorts_selftest_")
    for t in (t_analyze, t_foley, t_compare, t_pipeline, t_blender):
        t(ws)
    print("\n" + "\n".join(f"{s:7} {n}  {note}" for n, s, note in RESULTS))
    shutil.rmtree(ws, ignore_errors=True)
    sys.exit(1 if any(s == "FAIL" for _, s, _ in RESULTS) else 0)
