# Camera guide

Tool: `scripts/camera_tools.py`. All moves are analytic and baked to one key per frame, so they are deterministic and exact.

## Targets (measured on 18 reference Shorts, `zach_visual_analysis.md`)
| Metric | Reference median (range) | Rule |
|---|---|---|
| Camera still | 4 % of frames (0–33 %) | Never park. Add `creep` or `drift` to every hold |
| Mean abs zoom | 0.92 %/frame (0.25–1.9) | Calm explainer about 0.3–0.6; action about 1–2 |
| Zooming in / out | 41 % / 39 % | Balance push-ins with pull-outs |
| Hard cuts per 30 s | about 3 (1–17) | Prefer continuous moves; cut on action only |

Compute a dolly's zoom rate before rendering: `ct.zoom_rate_pct_per_frame(start_dist, end_dist, frames)`. For example, 0.26 → 0.09 m over 165 frames is about 0.65 %/frame, which is reference-typical.

## Grammar (why each move exists)
- **Push-in = "look at this / here's how it works".** Use it when narration introduces the mechanism. Ease `push`: a slow start and a long creeping settle.
- **Pull-out = "result / scale / resolution".** Use it at the end of an explanation and for scale reveals. Ease `push` or `out`.
- **Orbit arc (20–60°) = reveal another face of the object** or move into the cutaway plane. Never a 360° spin.
- **Follow = keep a moving subject the same size** (sliding body, falling object). Target is the subject, with a small lag.
- **Rack focus = shift attention** between two depths without moving. Animate `focus_offset`, or target two points.
- **Low angle = power or scale; high angle = overview or vulnerability; POV = immersion** (trunk, slide).

## Lens and depth of field
| Shot | Lens | f-stop at real scale |
|---|---|---|
| Wide or establishing (sets, characters) | 24–35 mm | f/4–8 |
| Medium or product | 50–60 mm | f/4–5.6 |
| Macro (pins, skin pores) | 75–100 mm | **f/8–11** (real-scale macro DOF is razor thin) |

The camera uses `sensor_fit=VERTICAL` with a 36 mm sensor height, so the lens numbers describe the 9:16 frame's height.

## Continuity rules
1. Each `Seg` starts exactly at the previous segment's end values, including the orbit `center` (use `center1` to move the centre). The pilot's first version jumped 2–9 mm at segment boundaries until this rule existed.
2. Keep drift about 0.3 % of the camera–subject distance (0.0006 m at 0.2 m). Larger drift reads as shake.
3. Don't change speed abruptly. `inout` (smootherstep) gives zero velocity and zero acceleration at both ends, so segments chain smoothly.
4. Check the result with `analyze_reference.py` on the review MP4 (QC does this automatically).

## Tested presets
| Preset | Used in | Result |
|---|---|---|
| `orbit_arc` 32→40° + radius 0.26→0.2 (hero creep) | pilot-01 frames 1–55 | Smooth; product stays centred |
| Orbit 40→88° while pushing 0.2→0.12 (into cutaway) | pilot-01 frames 55–110 | Reads as one deliberate move into the cut plane |
| Pull-out with rise, 0.1→0.2 m, lens 75→55 | pilot-01 frames 190–240 | A clear "resolution" ending |
