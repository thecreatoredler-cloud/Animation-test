# Animation and rigging

Everything is a **function of time, baked per frame** (deterministic, so any frame re-renders identically and sound events can be computed from the same functions).

## Universal principles (tested on the padlock and the blockouts)
- **Different weights, different motion:** never one ease curve for everything. A key on a hand curve with hesitations; pins on contact physics; a plug with stiction and a detent settle; a shackle spring-snap (about 60 ms); a heavy body that drops, then swings slowly.
- **Drive dependents from their cause** (cam angle → ball position → shackle lift). Retiming the cause retimes everything, including the sound.
- **Secondary motion needs a physical cause:** the keyring swings only when the key is jolted (touch, seat, drop, stop).
- **Hold the insight** (0.3–0.5 s) before the consequence.

## Library
| Function | For | Notes |
|---|---|---|
| `spring(t, freq, zeta)` | All overshoot and settle | zeta 0.2 bouncy … 1.0 none |
| `slide`, `hinge`, `turn`, `drop_settle`, `pop`, `wobble`, `sway` | Object moves | anticipation and overshoot parameters |
| `spring_follower(profile, …)` | Cam followers, lock pins, valves | Real pins (preload about 250 m/s²) stay in contact. Clicks come from **ridge crossings** |
| `pendulum(t, amp, period, decay)` | Hanging things | T ≈ 2π√(L/g) |
| `wave_chain(arm, …, axis)` | Fish, snakes, tails, tentacles | Travelling wave head→tail, amplitude grows toward the tail |
| `pose_keys(arm, {frame: {bone: (rx, ry, rz)}})` | Character acting, pose to pose | Bezier eased; repeat a pose on two frames to **hold** it |

## By subject
- **Characters (J):** pose to pose: hold readable poses for 0.5–1.5 s, anticipation before actions, overlap on the arms and head, weight shift, **feet planted** (no sliding). **Face rig required for close-ups:** the blockout test's close-up on a faceless head showed why.
- **Animals (C):** species-specific locomotion. Fish: body wave about 2–3 Hz, 1–2 body lengths/s cruising, head yaw small and tail large (tested). Quadrupeds: gait cycles from reference footage (not tested). Birds: asymmetric up/down stroke (not tested).
- **Biology (B/F):** flows at a consistent speed with a parabolic profile in vessels (fast centre, slow wall, tested); pulsing at a heart-rate period; slow rolling of white cells along the wall.
- **Landscape (I):** the camera carries the motion; add slow environmental motion (water, clouds) only if visible.

## Rigging status (honest)
- Bone chains via `chain_armature` + auto weights: **tested** (fish).
- Blockout human via skin modifier + generated armature: **tested** for blocking and acting. Not production quality: no face, no hands with fingers, no clothing.
- Production humans (MPFB 2 / Rigify face): **not available in the source environment** (network hosts). Needed before any character close-up.
