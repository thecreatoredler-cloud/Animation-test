# Cross-category validation (2 s blockouts, 360×640 review renders)

Goal: check that the system generalises beyond the padlock (mechanism) without forcing its template. Projects: `projects/xcat-*`. Overview sheet: `xcat_sheet.jpg`.

| Test | Archetype | What it exercised | Broke at first | Fix (verified by render or measurement) | Remaining | Preview time |
|---|---|---|---|---|---|---|
| Character in a room | J | `mannequin` (skin + armature), `pose_keys`, interior light | Feet hovered 2.5 cm; `skin_armature_create` failed under temp_override | Foot joint at z=0.045; real selection | **No face rig**, so close-ups are blocked | 104 s / 30 frames (uncontended) |
| Fish underwater | C | `wave_chain`, follow camera, haze, caustics, particles | Camera lost the fish; caustics tiled; side view hid the wave; tail sweep 2 % BL | Camera from `fish_pos()`; warped Voronoi; 3/4 above view; amp/wavelength set, measured 0.213 BL | Quadrupeds/birds untested | 170 s (uncontended) |
| Blood vessel / cells | B/F | ~140 instanced cells, flow along a curve, interior lighting | Cells crossing the lens became blobs | Keep-out 0.12 → 0.22 had no effect (vessel too small). **Stopped after 3 tries** and recorded as a lesson | Lens/scale design rule needed | 485 s (contended, upper bound) |
| Valley landscape | I | 220² grid terrain, 900 scattered trees, water, haze | Spikes (noise at 1.4 m); water-plane edges; flooded terrain; tiny trees | Noise at 150 m; water covers the map at −30; offset removed; trees ×2.5–4; house at terrain height | n/a for a blockout | 329 s (contended) |

## Reusable vs category-specific
- **Reusable as-is:** `blender_setup` profiles, `camera_tools` segments and focus pulls, `lighting_tools` rigs, `add_distance_haze`, `scatter_instances`, `render_manager` resume and QC, caption placer, Foley engine.
- **Needed per category:** motion model (bitting function, body wave, pose keys), subject-driven follow camera, scale-dependent parameters (in metres), and close-range lens rules.
- **Generalised from these tests:** a follow camera must derive from the motion function; deformation is measured before rendering; scale parameters are in metres; three attempts, then document.
