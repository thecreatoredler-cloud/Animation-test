# 3d-educational-shorts-production

A Claude Skill for producing original, curiosity-driven 3D educational YouTube Shorts with Blender across subject types: mechanisms, biology, animals, history, science, landscapes, characters and more. `SKILL.md` is the workflow; `references/` holds the tested knowledge; `templates/` holds the planning sheets; `scripts/` holds tested helpers; `examples/` holds reference shot scripts per archetype.

## Contents
```
SKILL.md                      core workflow (read first)
references/                   content-archetypes, story-and-script-pipeline, visual-language,
                              camera-and-composition, blender-scene-building, animation-and-rigging,
                              lighting-materials-and-rendering, sound-and-editing,
                              asset-library-and-licensing, render-benchmarks, quality-control,
                              lessons-learned, api_quickref
templates/                    content-brief, fact-check-sheet, shot-list, asset-manifest.csv,
                              final-qc-checklist, project_template/ (project.json + shot skeleton)
scripts/                      tested helpers + tests/run_tests.py (see scripts/README.md)
examples/                     shot scripts: mechanism (padlock v4), character, animal, biology, environment
assets/fonts/                 Montserrat ExtraBold (SIL OFL)
```

## Requirements (the Skill does NOT provide these)
| Need | For | Without it |
|---|---|---|
| Blender 5.x (`blender` binary or Python 3.13 + `pip install bpy==5.3.0`), path in `BLENDER_PY` | Building and rendering scenes | Planning stages only (brief, facts, story, shot list, asset and sound plans) |
| Python 3.10+ with `numpy scipy opencv-python-headless` | Analysis, Foley, captions, QC | Install with pip |
| ffmpeg with libass | Assembly and captions | No MP4 output |
| CPU (works) / GPU (faster, unmeasured here) | Rendering | Cycles CPU: about 14–16 s per 1440×2560 frame on 4 vCPU for the padlock scene |
| Network to api.polyhaven.com, dl.polyhaven.org, ambientcg.com, acg-download.struffelproductions.com | CC0 asset downloads | Procedural materials only |
| A writable working folder | Projects, renders, assets | Required |

## Install in Claude (Cowork / claude.ai)
1. Download `3d-educational-shorts-production.zip`. Its root holds the folder `3d-educational-shorts-production/` with `SKILL.md` inside.
2. In Claude: **Customize → Skills → "+" → "+ Create skill" → "Upload a skill"**, then choose the ZIP.
3. Make sure the Skill is **toggled on** in the Skills list. Skills need the **code execution** capability enabled.
4. Test with a prompt, for example "Plan a 35-second Short explaining how geckos stick to walls".
5. In the first session, ask Claude to run `python3 scripts/check_env.py --render-test` and `python3 scripts/tests/run_tests.py`. They show which stages that environment can execute.

## Using it in Cowork: what to expect
- The Skill is **knowledge plus helpers**. It doesn't install Blender or provide a GPU, assets or folder access.
- If Cowork's sandbox has no Blender, Claude can still do intake, fact-checking, story, archetype choice, the shot list, the asset manifest and the sound/caption plan. Then run the Blender stages on a machine that has Blender: the shot scripts are plain Python, run with `$BLENDER_PY scripts/scene_builder.py <project> <shot>`.
- Give Cowork access to a working folder (for `projects/`, renders and assets) and, for the first real production, provide: the topic or script, any VO recording, your own Foley recordings if you want real sound, and any licensed assets you want used.

## Self-test
```bash
python3 scripts/tests/run_tests.py                       # 4 pure-Python tests
BLENDER_PY=/path/to/blender python3 scripts/tests/run_tests.py   # + Blender build/render/resume test
```
