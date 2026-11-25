---
name: cinematic-blender-shorts
description: Produce original 9:16 3D explainer Shorts (bright high-key 3D, continuous push-in/pull-out camera, macro cutaways, layered synthesised sound, 1–3-word captions) with Blender scripted from Python. Use when asked to make a 3D animated Short, an explainer like "how X works", a Blender short or a vertical 3D video from a topic, or to continue a project in this system's projects/ folder. Covers planning, scene building, animation library, rendering with resume and benchmarks, QC and final assembly.
---

# Cinematic Blender Shorts

A tested production system: Python tools that build Blender scenes, animate them deterministically, render resumably, and assemble a captioned and scored MP4. Read only what the current step needs.

## 0. Before anything: check the machine (2 min)
```bash
python3 scripts/check_env.py          # Blender/bpy, ffmpeg, CPU/GPU, RAM, network to asset hosts
```
- No Blender? `pip install bpy==5.3.0` into a Python 3.13 venv (headless Blender as a module), plus `numpy opencv-python-headless scipy`, plus apt `libegl1 libgl1-mesa-dri libxi6 libxxf86vm1 libxfixes3 libxrender1 libxkbcommon0 libsm6`.
- Set `BLENDER_PY` to the Python that has `bpy`, or to a `blender` binary. All Blender-side scripts run as `$BLENDER_PY script.py args` or `blender -b -P script.py -- args`.
- **No GPU means render with Cycles, never EEVEE** (see `references/render_optimization.md`).

Read `PROJECT_STATE.md` for what works now and what doesn't.

## 1. Start a video (gates marked ⛔ need the owner's approval)
1. `cp -r templates/project_template projects/<slug>`. Rename `shots/s01_example.py` per shot (`s01_<name>.py`, `s02_…`), then put the same names in order in `project.json["shots"]` and set `title`.
2. Write `projects/<slug>/PLAN.md` from the template: narration script (30–45 s), scene list with **visual mode** M1–M5 (`references/visual_style_guide.md` §1), per-shot camera move, the subject animation and the secondary motion, sound cues, and assets with licences. ⛔ Owner approves the plan.
3. Compute the render budget before building: frames × measured s/frame (`benchmarks/README.md`). If it doesn't fit 9 h × 0.8, simplify **now**.

## 2. Build each shot (one file per shot, independent)
- A shot file is `projects/<slug>/shots/<shot>.py` with `SECONDS`, `ENGINE` and `build(scene, ctx)`. Copy `projects/pilot-01-padlock/shots/s01_padlock.py` as a worked example: geometry, materials, light rig, mechanism animation driven from one function, a single continuous camera move.
- **Function signatures: `references/api_quickref.md`** (generated from the code; never guess arguments).
- Gotchas the library assumes:
  - Units are metres at real scale. Profiles: preview 360×640, review 720×1280, final 1440×2560 (all Cycles, 8 samples).
  - `drop_settle` needs the object's origin at its bottom (`rounded_box(..., origin="bottom")`).
  - Multi-part objects: `sb.parent(child, parent)` **before** baking animation on the parent. Children inherit squash and wobble.
  - Children of an animated parent take *world-space* locations in `at.bake` (the parent inverse is kept).
  - `ct.push_in(f0, f1, target, start_dist, end_dist, height, azimuth)`: distances are camera-to-target in metres. At under 0.5 m, f/5.6 blurs the background strongly. Raise `fstop` in `make_camera` to keep more of the table sharp.
  - Glossy varnish on big table planes mirrors the fill light as a white patch. Lower `varnish`, or move the fill.
- Library (open the guide only when needed):
  | Need | Module | Guide |
  |---|---|---|
  | Scene, render profiles, colour | `blender_setup.py` | `references/render_optimization.md` |
  | Geometry builders, booleans, cutaways | `scene_builder.py` | `references/environment_guide.md` |
  | Materials (metal, wood, skin, tissue, PBR sets) | `materials.py` | `references/material_guide.md` |
  | Light rigs, sky backdrop, HDRI | `lighting_tools.py` | `references/lighting_guide.md` |
  | Camera moves (push, pull, orbit, drift) | `camera_tools.py` | `references/camera_guide.md` |
  | Object and secondary animation | `animation_tools.py` | `references/animation_guide.md` |
  | CC0 assets with licence registry | `asset_manager.py` | `references/asset_licenses.md` |
  | Characters | **not built yet** | `references/character_guide.md` |
- Build: `$BLENDER_PY scripts/scene_builder.py projects/<slug> <shot>` writes `blend/<shot>.blend`.

## 3. Preview → review → final
```bash
$BLENDER_PY scripts/render_manager.py projects/<slug>/blend/<shot>.blend --profile preview --frames 1,30,60,...   # stills
$BLENDER_PY scripts/render_manager.py projects/<slug>/blend/<shot>.blend --profile review --step 1              # every frame 720p
python3 scripts/video_assembler.py projects/<slug> --profile review
python3 scripts/quality_control.py projects/<slug> --profile review
```
- Look at the preview stills yourself before the review render. ⛔ Show the owner the review MP4, the contact sheet and the QC report before the final render.
- Renders resume automatically. Re-running only renders missing frames (`--force` re-renders). Change one shot, then rebuild and re-render that shot only.
- Final: `--profile final`, then `video_assembler.py --profile final`, then QC again.

## 4. QC (never call a video done without it)
`quality_control.py` checks frames (missing, black, frozen, flicker, 9:16), the video (resolution, fps, audio) and motion against the reference targets (camera never parked, zoom rate, subject motion). Then **look at** `qc/contact_<profile>.jpg` and the video, fill in the manual table in `qc/QC_<profile>.md`, fix every FIX, and repeat.

## 5. Measure the reference when the topic needs a new style
`python3 scripts/analyze_reference.py ref.mp4 --out analysis/ --thumbs` gives shots, cut rate, zoom %/frame, still fraction and subject motion. Compare with our render using the same tool.

## 6. Record what you learn (keeps the next session cheap)
- A working new technique → a function in the right module plus a line in its guide plus `CHANGELOG.md`.
- A measured render cost → `benchmarks/performance_logs/benchmarks.csv` (`render_benchmark.py` appends it).
- A failed experiment → `PROJECT_STATE.md` "Failed / don't retry".
- Never rewrite a working tool. Extend it.
