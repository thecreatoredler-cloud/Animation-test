# cinematic-blender-shorts

A reusable, tested system for producing original vertical (9:16) 3D explainer Shorts with Blender driven from Python. It covers reference analysis, scene building, animation, resumable rendering, QC, sound and captions, and assembly. `SKILL.md` is the operating manual for Claude (Cowork or Claude Code).

## Layout
| Path | What |
|---|---|
| `SKILL.md` | How to run a production (start here) |
| `PROJECT_STATE.md` | What works, what doesn't, the next task (persistent memory) |
| `CHANGELOG.md` | History of capabilities |
| `scripts/` | The tools (see below) |
| `references/` | Measured reference analysis plus guides; open only what the step needs |
| `templates/project_template/` | PLAN.md, project.json and a shot skeleton for a new video |
| `projects/<slug>/` | One folder per video: `shots/*.py` → `blend/` → `renders/<profile>/<shot>/` → `output/*.mp4`, `qc/` |
| `assets/` | CC0 downloads plus `registry.json`, and the caption font (OFL) |
| `benchmarks/` | Environment report, render tests, `performance_logs/benchmarks.csv` |

## Scripts
| Script | Runs in | Purpose |
|---|---|---|
| `check_env.py` | python3 | Can this machine build, render and assemble? (writes `benchmarks/environment_report.json`) |
| `analyze_reference.py` | python3 | Shot cuts, zoom %/frame, pan, stillness and subject motion of any video |
| `blender_setup.py` | bpy | Scene reset, 9:16, AgX colour, render profiles preview/review/final |
| `scene_builder.py` | bpy | Geometry builders and the per-shot build runner (CLI) |
| `materials.py` | bpy | Procedural PBR (metal, wood, skin, tissue, plastic, glass) plus CC0 texture sets |
| `lighting_tools.py` | bpy | Key/fill/rim rigs, sky-gradient backdrop, HDRI world |
| `camera_tools.py` | bpy | Eased, baked camera moves (push, pull, orbit, drift) |
| `animation_tools.py` | bpy | Springs, slides, hinges, drops with squash, wobble, sway, shape and property ramps |
| `render_manager.py` | bpy | Resumable frame rendering with per-frame time and memory log; `--set` experiments |
| `render_benchmark.py` | python3 | Benchmark configs on chosen frames, plus feasibility against the 9 h budget |
| `audio_tools.py` | python3 | Synthesised layered SFX and the mix (room tone, weight/main/detail, reverb by shot size) |
| `video_assembler.py` | python3 | Concatenate shots, captions (libass), finish, audio, H.264 MP4 |
| `quality_control.py` | python3 | Automatic checks plus contact sheet plus a QC report with a manual checklist |
| `asset_manager.py` | python3 | Poly Haven and ambientCG downloads with a licence registry |

"bpy" means it runs with Blender's Python: `$BLENDER_PY script.py …` (bpy module) or `blender -b -P script.py -- …`.

## Requirements
- Blender 5.x, or `pip install bpy==5.3.0` (Python 3.13) for headless use.
- python3 with `numpy`, `opencv-python-headless` and `scipy`; `ffmpeg` built with libass.
- Network (optional, for assets): api.polyhaven.com, dl.polyhaven.org, ambientcg.com, acg-download.struffelproductions.com.

## Quick start
```bash
export BLENDER_PY=/opt/bvenv/bin/python
python3 scripts/check_env.py
$BLENDER_PY scripts/scene_builder.py projects/pilot-01-padlock s01_padlock
$BLENDER_PY scripts/render_manager.py projects/pilot-01-padlock/blend/s01_padlock.blend --profile review
python3 scripts/video_assembler.py projects/pilot-01-padlock --profile review
python3 scripts/quality_control.py projects/pilot-01-padlock --profile review
```
