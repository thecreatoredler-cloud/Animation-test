# Blender scene building

**Requires** Blender 5.x: either the `blender` binary or the `bpy` module (`pip install bpy==5.3.0` on Python 3.13, which is how the source project rendered headless). Tested with bpy 5.3.0 on Linux x86_64.

## Project layout (one folder per video)
```
projects/<slug>/
  project.json          # fps, resolution, shot order, captions, foley recipes, finish
  shots/s01_<name>.py   # SECONDS, ENGINE, PERSISTENT_DATA, build(scene, ctx)
  blend/  renders/<profile>/<shot>/  build/  output/  qc/
```
Shots are **independent .blend files**: a fix rebuilds and re-renders one shot only.
Build: `$BLENDER_PY scripts/scene_builder.py projects/<slug> <shot>` (or `blender -b -P scene_builder.py -- …`).

## Library (scripts/, see `scripts/README.md` for signatures)
| Module | Use |
|---|---|
| `blender_setup` | Scene reset, 9:16, AgX colour, render profiles (preview, review, final, final_hq, final_fast) |
| `scene_builder` | rounded_box, cylinder, sphere, lathe, tube (+exact), helix, extrude_profile, arc_points, boolean, **split_by_box** (static cutaway piece), curve_to_mesh, **mannequin** (blockout rigged body), **chain_armature** + **bind_auto**, **scatter_instances** |
| `materials` | metal, plastic, painted, glass, wood, skin, tissue, emission, image_pbr (PBR sets, ARM maps, tint), **add_distance_haze** |
| `lighting_tools` | sky_backdrop (camera-ray split), hdri_world, sun/area lights, daylight_studio, low_key_practical |
| `camera_tools` | Seg/animate (baked), push_in, orbit_arc, rack focus |
| `animation_tools` | spring, slide, hinge, turn, drop_settle, pop, wobble, sway, shape and value ramps, **spring_follower**, **pendulum**, **wave_chain**, **pose_keys** |

## Rules that came from failures
1. **Build at real scale (metres).** Light power, DOF and texture scale then behave.
2. **Apply bevels before booleans** ("modifier not first" otherwise).
3. **Make cutaways once at build time** (`split_by_box`) and animate the removed piece. Animated booleans cost every frame and break persistent data (stale geometry: black frames).
4. **Flat-shade boolean cut faces.** Smooth fans make radial streaks.
5. **Baked locations replace an object's base offset.** Add the base back (`base + offset`).
6. **Children of a parent created at identity keep world-space coordinates.** Build hierarchies at identity, then move the root.
7. Bezier interpolation on baked per-frame keys isn't needed. Bake LINEAR keys; the curve shape lives in the maths.
8. **Operators that need selection** (e.g. `skin_armature_create`) fail silently under `temp_override`. Set active and select for real.
9. Name lights distinctly (KeyLight, …). A name clash ("Key") renames other objects.
10. Check mechanism clearances numerically before rendering (shackle travel vs. leg depth).

## Per-archetype construction notes
- **Mechanism (A):** parametric geometry from one function; static split; pins as lathe profiles. Tested.
- **Character (J):** `mannequin()` for blocking, timing and coverage only. Hero characters need a rigged human with a **face rig** (MPFB 2 / Rigify or a licensed asset). Blockout tested; no hero character available in the source project.
- **Animal (C):** lathe or sculpted body → join → `chain_armature` + `bind_auto` → `wave_chain` (fish). Quadrupeds need a rig per species. Fish blockout tested.
- **Biology (B):** instanced cells (`scatter_instances`, shared mesh) moved along a shared spline function (deterministic flow, parabolic speed profile). Tested.
- **Landscape (I):** displaced grid + height-ramp material + `add_distance_haze` + instanced scatter from real terrain vertices. Tested.
