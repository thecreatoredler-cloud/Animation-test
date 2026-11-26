# Camera and composition

Tool: `scripts/camera_tools.py`. Analytic moves are baked one key per frame (`Seg`, `animate`, `push_in`, `orbit_arc`, `focus=` rack). Deterministic: any frame re-renders identically.

## Measured targets (reference Shorts) and our QC
Still camera ≤ about 10 % of frames (reference median 4 %). Mean |zoom| 0.25–2 %/frame (reference median 0.92). Balance push-ins and pull-outs. `quality_control.py` measures all three on the export. All padlock pilots v2–v4 pass.

## Shot grammar
| Purpose | Move | Lens (vertical sensor fit, 36 mm) |
|---|---|---|
| Establish place or whole object | slow crane or dolly, wide | 24–45 mm |
| Explain a process | push in (ease `push` or `inout`) | 50–75 mm |
| Show a contact or mechanism detail | close move to the contact point, rack focus | 75–100 mm, f/8–16 at small scale |
| Resolve or payoff | pull out to the whole thing in context | 35–50 mm |
| Character coverage | wide (blocking) → medium (action) → close (reaction); eye level by default | 35 / 50 / 70 mm |
| Animal | tracking alongside, low angle for size | 35–50 mm |
| Landscape | high oblique fly-over, slow; a top-down "map" moment | 24–35 mm |
| Inside a tube or flow | track along the flow axis, look ahead | 24–28 mm |

## Tested rules (with evidence)
1. **Segments must start where the previous one ended** (use `center1` for orbits). Jumps otherwise (pilot-01).
2. **Each beat needs its own framing.** Changing captions over the same view reads as static (v3, 2–5 s; fixed in v4 with context → contact → springs → shear line).
3. **Film rotations off their axis** (v1 plug turn unreadable along its axis).
4. **DOF:** at 5–10 cm distances, f/5.6 blurs the subject's own depth. Use f/9–16 on the part being explained. Measure sharpness with Laplacian variance on the centre (v3 turn: 12–20 vs 31–65).
5. **Keep large foreground parts out of the move** (shackle leg and returning piece blurs, v2).
6. Frame height = distance × 36 / lens. Choose the lens from the width the action needs (v2's first opening framed only a beige blur).
7. Drift about 0.3 % of distance keeps holds alive. More reads as shake.

## Vertical composition and safe zones (YouTube Shorts)
- Right 12 %: player buttons. Bottom 20 %: title and description. Top 10 %: status bar.
- The subject sits in the middle 60 %. The camera's look target is at frame centre, so the **explained action is central by construction**.
- Captions: `scripts/caption_placer.py` picks a band (20–72 % height) per caption from edges, motion, brightness and a centre-protection term. Verified on v3: moved two captions off the cam and shackle (importance 2.13 → 1.44).
