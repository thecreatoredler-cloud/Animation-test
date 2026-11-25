#!/usr/bin/env python3
"""Inspect the execution environment: can this machine build, render and assemble?

    python3 check_env.py [--render-test]

Reports Blender availability (blender binary or bpy module via $BLENDER_PY), version, CPU, RAM,
disk, GPU, ffmpeg (+libass/drawtext), Python libs, and network reach to asset hosts.
--render-test renders one 360x640 Cycles frame of a test scene and reports the time.
Writes benchmarks/environment_report.json. Run at the start of every new session/machine.
"""
import json
import os
import platform
import shutil
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def sh(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=120, shell=isinstance(cmd, str)).stdout.strip()
    except Exception as e:
        return f"ERR {e}"


def find_blender():
    cands = [os.environ.get("BLENDER_PY"), "/opt/bvenv/bin/python", shutil.which("blender")]
    for c in cands:
        if not c or not os.path.exists(c):
            continue
        if os.path.basename(c).startswith("blender"):
            v = sh([c, "-b", "--version"]).splitlines()
            return dict(kind="binary", path=c, version=v[0] if v else "?")
        v = sh([c, "-c", "import bpy; print(bpy.app.version_string)"])
        if v and not v.startswith("ERR") and "Error" not in v:
            return dict(kind="bpy-module", path=c, version=v.splitlines()[-1])
    return None


def net(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "check-env"})
        return urllib.request.urlopen(req, timeout=10).status
    except Exception as e:
        return str(e)[:60]


def main():
    rep = dict(date=time.strftime("%Y-%m-%d %H:%M"), host=platform.node(), os=platform.platform(),
               python=sys.version.split()[0], cpus=os.cpu_count())
    rep["cpu_model"] = sh("lscpu | grep 'Model name' | cut -d: -f2").strip() or platform.processor()
    rep["ram_gb"] = round(os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 1e9, 1) if hasattr(os, "sysconf") else None
    du = shutil.disk_usage(ROOT)
    rep["disk_free_gb"] = round(du.free / 1e9, 1)
    rep["nvidia_gpu"] = sh("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader") if shutil.which("nvidia-smi") else "none"
    rep["blender"] = find_blender()
    rep["ffmpeg"] = sh("ffmpeg -version | head -1") if shutil.which("ffmpeg") else None
    rep["ffmpeg_libass"] = "subtitles" in sh("ffmpeg -hide_banner -filters 2>/dev/null | grep subtitles")
    libs = {}
    for m in ("numpy", "cv2", "scipy"):
        try:
            libs[m] = __import__(m).__version__
        except Exception:
            libs[m] = None
    rep["python_libs"] = libs
    rep["network"] = {h: net(u) for h, u in {
        "polyhaven": "https://api.polyhaven.com/types", "ambientcg": "https://ambientcg.com/",
        "pypi": "https://pypi.org/simple/bpy/"}.items()}
    if "--render-test" in sys.argv and rep["blender"]:
        test = os.path.join(ROOT, "benchmarks", "render_tests", "_envtest.png")
        os.makedirs(os.path.dirname(test), exist_ok=True)
        code = ("import bpy,time;bpy.ops.wm.read_factory_settings();s=bpy.context.scene;s.render.engine='CYCLES';"
                "s.cycles.samples=16;s.render.resolution_x=360;s.render.resolution_y=640;"
                f"s.render.filepath=r'{test}';t=time.time();bpy.ops.render.render(write_still=True);print('T',time.time()-t)")
        b = rep["blender"]
        cmd = [b["path"], "-c", code] if b["kind"] == "bpy-module" else [b["path"], "-b", "--python-expr", code]
        out = sh(cmd)
        t = [l for l in out.splitlines() if l.startswith("T ")]
        rep["cycles_test_360x640_s16_seconds"] = round(float(t[-1].split()[1]), 2) if t else out[-300:]
    ok = bool(rep["blender"] and rep["ffmpeg"] and rep["ffmpeg_libass"] and all(libs.values()))
    rep["ready"] = ok
    rep["advice"] = []
    if rep["blender"]:
        b = rep["blender"]
        rep["advice"].append(f"export BLENDER_PY={b['path']}   # {b['kind']} {b['version']}; run Blender-side scripts as "
                             + ("$BLENDER_PY script.py args" if b["kind"] == "bpy-module" else "$BLENDER_PY -b -P script.py -- args"))
    if not rep["blender"]:
        rep["advice"].append("Install Blender or: uv venv -p 3.13 /opt/bvenv && uv pip install -p /opt/bvenv/bin/python bpy==5.3.0")
    if rep["nvidia_gpu"] == "none":
        rep["advice"].append("No GPU: use Cycles CPU profiles; EEVEE falls back to software GL (very slow)")
    os.makedirs(os.path.join(ROOT, "benchmarks"), exist_ok=True)
    json.dump(rep, open(os.path.join(ROOT, "benchmarks", "environment_report.json"), "w"), indent=1)
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
