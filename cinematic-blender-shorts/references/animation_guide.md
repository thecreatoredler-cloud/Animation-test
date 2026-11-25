# Animation guide

Tools: `scripts/animation_tools.py` (objects, secondary motion, shape keys, properties) and `scripts/camera_tools.py` (camera). Every curve is a function of the frame, baked with LINEAR keys, so a re-render or a single-frame render always matches playback.

## The rule from the tutorial (T2)
Camera motion alone looks dead. Every shot needs three layers:
1. **Camera move** (camera_guide.md).
2. **Primary subject action**: the thing the narration talks about changes (the key slides, pins rise, the wound closes).
3. **Secondary motion**: something reacts (springs compress, a lid wobbles after landing, dust, light shifts).

QC measures layer 2 as "residual motion": the median reference value is 31 px/s, and our target is at least 4.

## Library
| Function | Principle | Typical parameters |
|---|---|---|
| `slide(obj, f0, f1, p0, p1, ease_name, anticipate, settle)` | Ease, anticipation, spring settle | anticipate 0.03–0.08 of the distance; settle `dict(freq=3–5, zeta=0.25–0.45)` |
| `hinge(obj, f0, f1, axis, angle, overshoot, anticipate_deg)` | Doors, lids, the plug turning | overshoot 0.05 (firm) to 0.2 (loose); anticipate 2–5° |
| `turn(obj, f0, f1, axis, angle)` | Plain eased rotation | |
| `drop_settle(obj, f0, height, restitution, squash)` | Physically timed fall with bounces and squash on contact | restitution 0.3 (wood), 0.5 (plastic die), 0.15 (soft) |
| `pop(obj, f0)` | Appear with overshoot | zeta 0.4 |
| `wobble(obj, f0, axis, amp_deg, freq, decay)` | Follow-through after an impact, added on top | 3–6°, 4–8 Hz, decay 4–6 |
| `sway(obj, f0, f1, axis, amp_deg, period_s)` | Ambient motion (plants, hanging objects, wind) | 1–3°, period 2–4 s |
| `shape_key_ramp`, `value_ramp` | Morphs, swelling, healing, any property (material, modifier, light) | |
| `spring(t, freq, zeta)` | The damped-spring maths behind everything above | |
| `bake(obj, f0, f1, fn)` | Your own per-frame function → keys | Use it for mechanisms (see the pilot's pins) |

## Mechanisms: drive everything from one function
The pilot computes pin heights from the **same `blade_profile()` that generates the key mesh**. Contact is exact by construction: no sliding through the key and no gaps. Apply the same pattern to gears (angle ratios), pistons, zips and stitches. Model the rule once and derive both the geometry and the motion from it.

## Attachments (tutorial lesson T3)
Anything on a moving or deforming surface must follow that surface:
- Rigid parts: parent to the moving object, or to its pivot empty (the pilot's key and pins are children of `PlugPivot`).
- Deforming skin (stitches, bandages, tattoos): use a `SURFACE_DEFORM` or `SHRINKWRAP` modifier, or a Geometry Nodes "sample nearest surface", applied after the armature. Never use a screen-space overlay.
- Check by scrubbing to the frames with the biggest deformation, and render those frames in the review pass.

## Characters
Character rigs (body plus face) need a rig source. See `character_guide.md` for status: not yet built, because no rigged CC0 human is available offline in this environment.
