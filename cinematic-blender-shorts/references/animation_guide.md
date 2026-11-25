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

## Added in pilot-02 (tested)
| Function | Use | Notes |
|---|---|---|
| `spring_follower(profile, f0, f1, rest, preload, stiffness, damping, restitution)` | Lock pins, cam followers, valves: a part pushed by a spring onto a moving surface | Returns positions and landing events. Real pins (preload about 250 m/s²) stay in contact; the clicks come from **ridge crossings** (local maxima of the follower path) |
| `pendulum(t, amp_deg, period_s, decay)` | Anything hanging after a jolt | T ≈ 2π√(L/g): about 0.5 s for a 6 cm hang |
| `split_by_box` (scene_builder) | Cutaways that keep continuity | Animate the removed piece; don't animate a boolean |

**Different weights, different motion** (pilot-02): the key moves on a hand curve with 5 small hesitations (resistance at each pin). Pins follow contact physics. The plug has stiction (eased start) and a detent settle (7 Hz, decays in about 0.15 s). The shackle snaps (spring, about 60 ms, zeta 0.55). The heavy body drops, then swings slowly (0.5 s period). Never give every part the same ease curve.

**Release logic as a function of the driver:** compute dependent motion from the driving angle (`release_state(theta)` → ball position → shackle lift) instead of keyframing each part. A retime of the turn then retimes everything, including the sound events.
