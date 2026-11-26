---
name: 3d-educational-shorts-production
description: Plan and produce original 3D-animated educational YouTube Shorts in Blender for any topic. Picks a visual archetype, fact-checks, builds scenes, renders, syncs Foley and captions, runs QC.
---

# 3D Educational Shorts Production

A tested production workflow for vertical (9:16, 1440×2560, 30 fps) 3D explainer Shorts: curiosity-driven, factually checked, cinematic, with sound and captions on one timeline. **The topic decides the visual approach.** Never copy the padlock pilot's structure, camera, materials or palette onto unrelated subjects.

## 0. Check what this environment can actually do (always first)
```bash
python3 scripts/check_env.py --render-test     # Blender? GPU? ffmpeg+libass? numpy/scipy/opencv? network to asset hosts?
python3 scripts/tests/run_tests.py             # self-test of every shipped script (Blender test runs if found)
```
- No Blender → you can still do stages 1–7 (brief, facts, story, archetype, shot list, asset plan, sound plan). Tell the user exactly what must run on a machine with Blender 5.x (`BLENDER_PY=<blender or a python with bpy>`).
- No GPU → **Cycles CPU** (EEVEE falls back to software GL and is unusable). Read `references/render-benchmarks.md` before promising times.
- This Skill does not supply Blender, a GPU, assets or file access. Say so when relevant.

## 1. Workflow (⛔ = stop for the user's approval)
1. **Intake.** Fill `templates/content-brief.md`. List missing information and ask. Never invent facts.
2. **Facts.** Fill `templates/fact-check-sheet.md`: every on-screen claim sourced, or flagged as inference or reconstruction. Research mechanisms and processes before animating them.
3. **Story.** Write the curiosity hook, the cause→effect chain, the payoff and the takeaway. ⛔
4. **Archetypes.** Read `references/content-archetypes.md`. Choose per beat (A mechanism, B biology, C animal, D history, E events, F science, G inventions, H abstract, I geography, J characters). Combine them, and explain why each fits.
5. **Shot list.** `templates/shot-list.md` puts narration, action, camera, caption, sound and light in **one timeline**. Every beat gets a distinct framing. Without a VO, mark beats "retime after VO". Read `references/story-and-script-pipeline.md`, `references/visual-language.md` and `references/camera-and-composition.md`.
6. **Assets.** CC0 first (`scripts/asset_manager.py`), procedural otherwise. Log every external asset in `templates/asset-manifest.csv`. Read `references/asset-library-and-licensing.md`.
7. **Build** (one `.py` per shot, real scale). Read `references/blender-scene-building.md`, `references/animation-and-rigging.md` and `references/lighting-materials-and-rendering.md`. Start from the closest example in `examples/` (mechanism, character, animal, biology, environment), **adapt it, don't clone it**. Export sound events from the same functions that drive the motion.
8. **Preview.** Stills at every beat (`render_manager.py --profile preview --frames …`), then full motion at `--step 2`. Check phone-size readability. ⛔
9. **Final render.** Benchmark about 5 frames first (`render_benchmark.py`), then `--profile final`. Rendering resumes after a crash, skips finished frames, and `--changed-only` re-renders only frames whose scene state changed. ⛔ before multi-hour renders.
10. **Sound, captions, assembly.** `foley.py` recipes (or the user's own recordings), `caption_placer.py --write`, then `video_assembler.py`. Read `references/sound-and-editing.md`.
11. **QC.** `quality_control.py`, `audio_analysis.py`, a compression check, then **watch the whole export** and fill `templates/final-qc-checklist.md`. Fix every FIX item. Read `references/quality-control.md`. Never claim you listened to audio unless you did.
12. **Learn.** Append tested findings (what, evidence, when it applies) to `references/lessons-learned.md`.

## 2. Non-negotiables
- Context before macro. One new picture per beat. Explained parts stay sharp. Captions never cover the action and appear after the thing they name.
- Every sound has a visible source. No generic whooshes or booms on small objects. Silence carries the insight beat.
- Measure, don't guess: render cost (ablation), image quality (`image_compare.py`), motion (`analyze_reference.py`), audio (`audio_analysis.py`).
- Non-graphic, respectful treatment of anatomy, accidents and history. Separate fact from reconstruction.
- Original characters and designs. Never copy logos, characters, assets or specific scenes from reference channels.

## 3. Scripts (usage: `scripts/README.md`)
Blender-side: `blender_setup`, `scene_builder`, `materials`, `lighting_tools`, `camera_tools`, `animation_tools`, `render_manager`, `render_ablation`. Run them as `$BLENDER_PY script.py …`, or `blender -b -P script.py -- …`.
Python-side (numpy, scipy, opencv, ffmpeg): `check_env`, `analyze_reference`, `foley`, `audio_analysis`, `caption_placer`, `video_assembler`, `quality_control`, `image_compare`, `render_benchmark`, `asset_manager`.
