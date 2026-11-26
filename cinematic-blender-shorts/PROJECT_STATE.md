# Project state (read first in every new session)

_Last updated: 2026-11-26._

## Works (tested, with evidence in the repo)
| Capability | Evidence |
|---|---|
| Reference measurement | `references/measurements/*.json`; tutorial number reproduced |
| Headless Blender 5.3 (bpy) build + Cycles render | `benchmarks/environment_report.json`, pilot renders |
| Scene/material/light/camera/animation libraries | used end-to-end by `projects/pilot-01-padlock/shots/s01_padlock.py` |
| Resumable rendering with per-frame logs | `projects/pilot-01-padlock/renders/*/render_log.csv` (git-ignored images) |
| Benchmarks plus ablation and feasibility | `references/render_optimization.md`, `benchmarks/performance_logs/benchmarks.csv` |
| Synthesised layered sound, captions, assembly | `projects/pilot-01-padlock/output/` |
| Automatic QC plus contact sheet | `projects/pilot-01-padlock/qc/` |
| Skill usable without this conversation | `projects/skilltest-dice/` (built by a fresh agent from SKILL.md) |
| CC0 asset download with licence registry | `assets/registry.json` (Poly Haven HDRI, ambientCG wood) |

## Current technical configuration
- Engine: **Cycles CPU** (no GPU here). Profiles: preview 360×640/8 samples, review 720×1280/8, final 1440×2560/8 + OIDN, final_fast 1080×1920/8 then upscale.
- Colour: AgX + Medium High Contrast. Backdrop: screen-space gradient `#2B8ED8` → `#9FD3F3`.
- Run Blender-side scripts with `BLENDER_PY=/opt/bvenv/bin/python` (bpy module) or `blender -b -P script -- args`.

## Pilot-02 (v2 padlock), 2026-11-26
Delivered: `projects/pilot-02-padlock/output/pilot-02-padlock_final.mp4` (1440×2560, 30 fps, 8 s). Diagnosis, plan, sound breakdown, render report, scored QC (`qc/QC_SCORED.md`) and v1/v2 comparison are all in that folder. Render: 61.0 min full (15.25 s/frame) on 4 vCPU, 3 % over the 60 min target.

### Unresolved (next iteration)
1. The Foley is synthesised and nobody has listened to it yet. **The owner must listen.** Swap the key slide and shackle pop for licensed recordings if they sound artificial.
2. The section faces read paler than the exterior under direct sun (2–5 s).
3. 2.8 s of frontal framing during the pin ride; add a slow orbit.
4. The key is a flat extrusion (no bevels), and no hand holds it (characters not built).
5. Render is 61 min against a 60 min target. Next levers: shorter fast-rotation segment, or 120° shutter on the turn only, 3 samples on wide shots (untested), or a GPU host (unmeasured).
6. Loudness −23.3 LUFS: quiet for Shorts until narration exists.
7. `--changed-only` is conservative (off-screen transform changes re-render). A visibility-aware version would need shadow and reflection reasoning. Not worth it yet.

## Pilot-03 (v3 = v2 + production audit), 2026-11-26
`projects/pilot-03-padlock/AUDIT.md` (forensic audit, scorecard, top-5, narration design). Implemented: fill-light fix (measured root cause of the cream sections), bevelled key, open springs, flat rivets, shear-line glow, 30° orbit, keyring secondary motion and jingle, Foley ducking under narration (`foley.duck_gain`, verified), captions in the Shorts safe area.
**Result:** `projects/pilot-03-padlock/output/pilot-03-padlock_final.mp4`. Render 57.6 min (14.4 s/frame), **under the 60 min target**; survived a container restart via resume. Still open: no human hand, synthetic Foley not yet heard by anyone (recording recipe in AUDIT §9), bright key bow in the opening, limiter now 5.2 dB GR (jingle coincides with the drop), voice-over-dependent items (AUDIT §15).

## Not done / limits (be honest with the owner)
1. **Characters (mode M4) are not built.** No rigged human imported or tested. Needs MPFB 2 hosts allowed (`references/character_guide.md`).
2. **No narration voice.** The text-to-speech and Whisper model hosts are blocked. The owner records narration, or the video is captions-only.
3. Only mode M3 (object/mechanism) is proven by a pilot. M1 (skin macro), M2 (cross-section) and M5 (vista) are supported by the tools but untested in a real shot.
4. The 30–45 s pilot has not been made yet (only the 8 s test).
5. Benchmarks are for this container. The owner's PC and the Cowork environment are unmeasured. Run `check_env.py --render-test` there.
6. Skill independence test: a **fresh agent with no conversation context** (smaller model) followed SKILL.md and built and rendered `projects/skilltest-dice` (a die drops, bounces and settles, with a push-in) in 7 tool calls, with no errors. Its friction notes were fixed: api_quickref.md, template rename steps, gotchas, BLENDER_PY advice, sphere builder. **Not yet tested inside Cowork itself.** Cowork must provide Blender (or pip bpy), ffmpeg and Python libraries. Run `check_env.py` there first.

## Failed / don't retry
- EEVEE on CPU-only hosts: 248 s for the first frame, over 300 s for the second.
- download.blender.org, Hugging Face, OpenAI model host, github.com web, freesound, fonts.google.com, blenderkit: blocked here.
- Applying a boolean to a mesh that still has a Bevel modifier: "modifier not first" warning. Apply the bevel first (`apply_modifiers`).
- `use_persistent_data=True` with animated booleans: stale geometry in sequential renders (black interiors from frame 162 on). Keep it off.
- Naming a light "Key" in a scene that also has a key object: Blender renames one to "Key.001". Lights are now KeyLight/FillLight/RimLight.
- Smooth-shaded boolean cut faces: radial streaks. Flat-shade the cutter.
- Brushed noise on large flat faces: radial streak pattern.

## Final learning cycle, 2026-11-26
- Pilot-04 (padlock v4): establishing wide shot, beat-distinct middle, f/16 turn (sharpness 18.5 → 23.4), auto-placed captions. QC all PASS after frames 18–73 were re-rendered (persistent-data black body). See `projects/pilot-04-padlock/AUDIT_V4.md`.
- Cross-category blockouts (character, fish, cells, valley): `benchmarks/cross_category/CROSS_CATEGORY_TESTS.md`.
- Skill `3d-educational-shorts-production/` (repo root) plus ZIP: validated and self-tested, with 3 fresh-agent prompts. See `../SKILL_TEST_REPORT.md`. **The Skill's references are now the canonical docs** (`PROJECT_OVERVIEW.md` maps them).
- Persistent data is **off** for finals (black geometry twice).

## Next development task
Phase 4b, characters: allow the MPFB 2 hosts, install it, generate two CC0 humans with Rigify and face expressions, build `character_setup.py`, test 6 expressions and 6 poses, and benchmark. Then make the 30–45 s pilot (mixing M4 + M1/M2) after the owner approves its PLAN.md.
