# Project overview

**Purpose.** A reusable, content-adaptive production system for original 3D educational YouTube Shorts (9:16, 1440×2560, 30 fps), developed and validated in Claude Code and packaged as the Skill `3d-educational-shorts-production/` (repo root) for Cowork.

**Constraints.** Limited Claude usage, no paid services, no local GPU (owner's PC is weak; production rendering happened in a 4-vCPU cloud container), and only CC0 or own assets.

**Status (2026-11-26).**
- Mechanism archetype produced end to end: 4 padlock iterations; v4 is the latest (`projects/pilot-04-padlock/`).
- Four cross-category blockouts (character, animal, biology, landscape): `projects/xcat-*`, results in `benchmarks/cross_category/`.
- Skill packaged, validated and tested with 3 fresh-agent prompts: `../3d-educational-shorts-production.zip`, report `../SKILL_TEST_REPORT.md`.

## Where the knowledge lives (no duplicates)
The **Skill's `references/` are the canonical documentation**. The names the brief asked for map to:
| Requested | File |
|---|---|
| VISUAL_LANGUAGE | `../3d-educational-shorts-production/references/visual-language.md` |
| CONTENT_ARCHETYPES | `…/references/content-archetypes.md` |
| STORY_AND_SCRIPT_PIPELINE | `…/references/story-and-script-pipeline.md` |
| BLENDER_SCENE_BUILDING | `…/references/blender-scene-building.md` |
| MODEL_ASSET_LIBRARY | `…/references/asset-library-and-licensing.md` (+ `assets/registry.json` here) |
| CAMERA_AND_COMPOSITION | `…/references/camera-and-composition.md` |
| ANIMATION_AND_RIGGING | `…/references/animation-and-rigging.md` |
| LIGHTING_MATERIALS_AND_RENDERING | `…/references/lighting-materials-and-rendering.md` |
| SOUND_AND_EDITING | `…/references/sound-and-editing.md` |
| RENDER_BENCHMARKS | `…/references/render-benchmarks.md` (raw logs: `benchmarks/`) |
| QUALITY_CONTROL | `…/references/quality-control.md` |
| LESSONS_LEARNED | `…/references/lessons-learned.md` (project history: `LESSONS_LEARNED.md` here) |
| COWORK_SETUP | `…/README.md` (install, requirements, limits) |

The older project guides in `references/` here (pilot-01/02 era) are kept for history. Where they disagree, the Skill's references win; for example persistent data is now **off** for final renders.
