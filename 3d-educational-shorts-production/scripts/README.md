# Scripts: usage and test status

All scripts are tested (`tests/run_tests.py` exercises them; ✅ = covered by the self-test, 🧪 = tested in the source project's productions but not by the self-test). Signatures: `../references/api_quickref.md` (regenerate with `gen_api_ref.py`).
Paths: scripts write to the **current working directory** (or `$SHORTS_WORKSPACE`), never into the skill folder.
Blender-side scripts run as `$BLENDER_PY script.py args` (bpy module) or `blender -b -P script.py -- args`.

| Script | Side | Usage | Test |
|---|---|---|---|
| `check_env.py` | py | `python3 check_env.py [--render-test]` → environment_report.json, BLENDER_PY advice | 🧪 |
| `analyze_reference.py` | py | `python3 analyze_reference.py VIDEO --out DIR [--thumbs]`: cuts, zoom %/frame, still fraction, subject motion | ✅ |
| `audio_analysis.py` | py | `python3 audio_analysis.py FILE --out DIR`: LUFS, true peak, onsets, spectrogram | ✅ |
| `foley.py` | py | `python3 foley.py PROJECT SHOT [--stems]` (events from `build/events_<shot>.json`); `duck_gain()` for VO | ✅ |
| `caption_placer.py` | py | `python3 caption_placer.py PROJECT --profile final --write`: negative-space caption bands | ✅ |
| `video_assembler.py` | py | `python3 video_assembler.py PROJECT --profile final`: frames + Foley/VO + captions → MP4 | ✅ |
| `quality_control.py` | py | `python3 quality_control.py PROJECT --profile final`: frames, spikes, video, motion, contact sheet | ✅ |
| `image_compare.py` | py | `python3 image_compare.py REF_DIR CAND_DIR… --frames 100,165 --out sheet.jpg`: SSIM/PSNR | ✅ |
| `render_benchmark.py` | py | `python3 render_benchmark.py BLEND --frames 1,120,240 --configs cycles_final --blender-python "$BLENDER_PY"` | 🧪 |
| `asset_manager.py` | py | `python3 asset_manager.py get polyhaven hdri <id> --res 1k` (network to Poly Haven / ambientCG) | 🧪 |
| `blender_setup.py` | bpy | Imported: scene reset, AgX, profiles | ✅ (via build) |
| `scene_builder.py` | bpy | `$BLENDER_PY scene_builder.py PROJECT SHOT`: builds `blend/SHOT.blend` | ✅ |
| `materials.py`, `lighting_tools.py`, `camera_tools.py`, `animation_tools.py` | bpy | Imported by shot files | ✅ template · 🧪 examples |
| `render_manager.py` | bpy | `$BLENDER_PY render_manager.py BLEND --profile preview\|review\|final [--frames 1-240] [--changed-only] [--set k=v]` | ✅ (render + resume) |
| `render_ablation.py` | bpy | `$BLENDER_PY render_ablation.py BLEND --frame 165 --variants baseline no_denoise fill_moved …` | 🧪 |
| `gen_api_ref.py` | py | regenerate `references/api_quickref.md` | 🧪 |

Python packages: `numpy scipy opencv-python-headless` (pip). ffmpeg with libass (captions). Font: `assets/fonts/Montserrat-ExtraBold.ttf` (SIL OFL, bundled).
