# Character guide

**Status: not built yet.** No rigged human has been imported or tested. This environment can't reach any human-model source without network changes (see "Next step"). The 8 s pilot is deliberately object-only (reference mode M3).

## What the reference needs (mode M4, `zach_visual_analysis.md` §3)
Realistic adult proportions (about 7.5 heads), clean "game cinematic" faces, matte skin with SSS and pores, simple solid clothing, readable held expressions (shock, wince, strain), hands that touch things. **A face rig is required.** The tutorial's first character couldn't make expressions and had to be replaced (lesson T4).

## Selection checklist (score before choosing; don't take the first model)
| Check | Minimum |
|---|---|
| Licence | CC0 or a licence that allows commercial use in videos; recorded in `asset_licenses.md` |
| Body rig | Humanoid armature with hands (fingers), compatible with Rigify or retargeting |
| Facial control | At least: jaw open, mouth corners, blink, brows up/down, eye look. ARKit-style shape keys or face bones |
| Mouth interior | Teeth and tongue present (open-mouth shots show them) |
| Eyes | Separate eyeballs with a cornea/spec, so catchlights work |
| Topology | Clean deformation at shoulders, elbows and knees when posed to 120° |
| Clothing | Separate meshes, fitted, deform with the rig |
| Cost | Renders a medium shot in budget (test with `render_benchmark.py`) |

## Candidates (free; to verify in a session that allows their hosts)
| Option | Licence | Face | Notes |
|---|---|---|---|
| **MPFB 2** (MakeHuman for Blender) | Add-on GPL; generated humans and assets CC0 | Face rig plus expression poses (to verify: shape-key/viseme support in the current version) | **First choice.** Parametric bodies (age, weight, proportions) give endless original characters with consistent topology. Needs hosts: extensions.blender.org or github.com release files, plus the MakeHuman asset packs host |
| Rigify (bundled with Blender) | GPL tool | Face bones in the human metarig | Present in our bpy (`addons_core/rigify`). Needs a mesh: use with MPFB or a custom-built mesh |
| Quaternius / Kenney characters | CC0 | Usually none | Stylised and low-poly. Fine for background crowds, not hero faces |
| Mixamo | Free with an Adobe account; use in renders allowed, raw redistribution not | No face rig | Useful for mocap-like body clips only. Needs an account, so ask the owner first |
| Cascadeur | Free tier (non-commercial limits; check current terms) | n/a | Physics-assisted body animation, as used by the Zack D. Films contributor. A desktop app, not scriptable here |

## Attachment rules (T3)
Clothing: a separate mesh weighted to the same armature, plus a `SURFACE_DEFORM` fallback. Accessories (watch, glasses, held objects): `CHILD_OF` constraint to the hand or head bone, keyed on and off at grab and release. Effects on skin: shrinkwrap or surface deform, never world-space.

## Next step (Phase 4b)
1. Allow the MPFB hosts in the environment and install MPFB 2 into the Blender used for rendering.
2. Generate one adult male and one adult female, each with a Rigify rig and face expressions. Save them to `assets/characters/` with registry entries.
3. Test 6 expressions (neutral, shock, wince, smile, strain, talk visemes A/O/E) and 6 body poses at a medium and close shot. Benchmark them.
4. Add `character_setup.py`: spawn, pose library, expression keys, blink and breathing idle, look-at target.
