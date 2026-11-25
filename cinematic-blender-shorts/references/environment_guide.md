# Environment guide

Builders: `scripts/scene_builder.py` (rounded_box, cylinder, lathe, tube, helix, extrude_profile, boolean, curve_to_mesh). Assets: `scripts/asset_manager.py` (Poly Haven models and HDRIs, ambientCG textures).

## Build for the shot, not the world (tutorial T5)
1. Block the camera path first (`camera_tools`), then render a preview contact sheet. Everything the lens sees in any frame must be **fully** built; nothing else is built at all.
2. Three depth layers in every frame:
   - **Foreground**: something near the lens, often out of focus (a table edge, a leaf, a hand).
   - **Midground**: the subject.
   - **Background**: a context prop out of focus (mug, shelf, hills), then the sky gradient or HDRI.
3. Scale is real (metres). Props come from real dimensions: a mug is 9 cm tall and 8 cm wide; a padlock body is 45 × 24 × 38 mm.
4. Ground contact: objects rest exactly on surfaces (origin at the bottom; `rounded_box(origin="bottom")`). Contact shadows come from the key sun; check them in preview.

## Environment recipes by mode
| Mode | Recipe |
|---|---|
| M1 body macro / M3 product | Tabletop (wood or other texture) running to soft blue gradient. 1–3 context props behind (mug, book), all out of focus |
| M2 cross-section | Layered block (skin layers, soil, wood) cut with a boolean cutter that carries the "cut" material. Blue gradient behind. Diorama presentation |
| M4 character situation | Built set only where the camera looks: walls with trim, floor, 3–5 story props. HDRI or low-key rig |
| M5 scale vista | Instanced repeats (Geometry Nodes, or array plus random transforms) to the horizon, haze from world colour, a big pull-out |

## The pilot as a worked example (pilot-01)
- The table had to extend under the camera. The first build ended in front of the lens and showed a white bevel in the opening frame (fixed: 1.0 × 1.1 m slab).
- The background mug and notebook give the depth layers; at 60 mm and f/5.6 they become soft shapes, which is exactly the reference product look.
- The cutaway is an animated boolean cutter sweeping top-down, applied to the body, plug **and shackle**. The first build forgot the shackle, and its near leg blocked the pins.

## Assets to prefer (CC0, via `asset_manager.py`)
HDRIs: Poly Haven `studio_small_09` (neutral studio). Textures: ambientCG `Wood049`. Search more with `python3 scripts/asset_manager.py search polyhaven models <term>` and record every asset's intended use.
