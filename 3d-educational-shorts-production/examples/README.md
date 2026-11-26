# Example shot scripts (adapt, don't clone)

Each is a complete `build(scene, ctx)` shot file that was actually built and rendered in the source project. Copy one into `projects/<slug>/shots/`, rename it, and change it for your subject. **Never reuse the padlock's structure, camera, palette or materials for an unrelated topic.**

| File | Archetype | Status | What it demonstrates | Known limits (from the test) |
|---|---|---|---|---|
| `mechanism_padlock_shot.py` | A mechanism | ✅ produced (8 s final, 1440×2560) | Geometry and motion from one function, static cutaway piece, contact physics, event export for Foley, beat-distinct camera | Specific to one lock: a reference, not a template |
| `character_blockout_shot.py` | J character | 🟡 blockout (2 s) | `mannequin()` rig, `pose_keys` acting, wide → medium → close coverage, motivated window light | No face (close-up shows a blank head), mitten hands, props incomplete |
| `animal_blockout_shot.py` | C animal | 🟡 blockout (2 s) | Procedural fish, `chain_armature` + `wave_chain` (tail sweep measured 0.21 body lengths), follow camera from the subject's own function, warped fake caustics, marine snow, distance haze | Simple fins, generic species; quadrupeds and birds untested |
| `biology_blockout_shot.py` | B/F biology | 🟡 blockout (2 s) | About 140 instanced cells on a shared spline, parabolic flow, a rolling white cell, a camera inside the vessel | Cells near the lens become large blobs (needs a design-time vessel/cell scale) |
| `environment_blockout_shot.py` | I landscape | 🟡 blockout (2 s) | Displaced terrain (noise scale in metres), height-ramp material, river at the valley floor, instanced forest, scale house, distance haze, low sun | Stylised low-poly look; no water material detail |
