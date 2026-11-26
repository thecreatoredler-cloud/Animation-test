# Lessons learned (tested, with evidence)

From 4 padlock iterations and 4 cross-category blockout tests in the source project. **Tested** means it was built, rendered and measured. Theory is labelled. Append new lessons as: *what · evidence · when it applies*.

## Validation status by archetype
| Archetype | Status | Evidence |
|---|---|---|
| A mechanism | ✅ 4 full 8 s productions | padlock v1→v4 |
| J character | 🟡 2 s blockout | rig deforms well; **no face rig**, so close-ups fail |
| C animal | 🟡 2 s blockout | fish locomotion measured; quadrupeds and birds untested |
| B/F biology, science | 🟡 2 s blockout | instanced flow works; close-lens blobs unsolved |
| I landscape | 🟡 2 s blockout | readable valley after 3 fixes |
| D history, E events, G inventions, H abstract | ⬜ theory only | planned by fresh-agent Skill tests, never built |

## Story, camera, composition
1. **Establish context before going close.** Padlock v3 opened on a detail and you couldn't place it. v4 opens wide on the whole lock and pushes into the keyhole.
2. **One new picture per beat.** v3 held a similar framing for 3.3 s while only the captions changed. v4 uses context → contact → springs → shear line.
3. **The explained part must be sharp.** v3's turn measured sharpness 12–20 against 31–65 elsewhere. Use f/9–16 at 5–10 cm.
4. **Film rotations off their axis** (v1 turn unreadable). **Fish bend sideways**, so a side-on camera hides the body wave. Film from a 3/4 angle above.
5. **A follow camera must come from the subject's own motion function.** The animal test's hand-typed lerp lost the fish out of frame.
6. **Keep big foreground objects out of camera paths** (a shackle leg, a returning piece, cells near the lens).

## Geometry, animation, physics
7. **Derive the mesh, motion and sound from one function** (key bitting → key mesh, pin motion, click times).
8. **Make cutaways once at build time** (`split_by_box`) and animate the piece, not a boolean.
9. **Check proportions and clearances with numbers:**
   - Shackle travel was shorter than the leg depth, so it never cleared.
   - Mannequin feet hovered 2.5 cm (foot joint height ≠ skin radius).
   - Fish tail sweep was 2 % of body length when about 20 % was intended: phase-spread bones cancelled. Fixed by a longer wavelength and verified at 0.21.
10. **Measure deformation** with evaluated mesh vertices before rendering. It's cheap and found the fish bug in seconds.
11. **Scale-dependent parameters are in metres.** Terrain noise at 1.4 m gave spikes on a 600 m map; 150 m gave hills. A leftover global offset then flooded the terrain under the water plane.
12. **Every motion has its own weight** (hand curve, contact follower, stiction, spring snap, gravity drop, pendulum). Secondary motion needs a physical cause.

## Look development
13. **Flat metal mirrors whatever faces it.** A uniform frontal fill made brass sections cream (sat 29 %, val 85 %); moving it to graze gave sat 86 %. Three plausible causes (HDRI rotation, sun, AgX look) were tested and disproved first. Probe with `render_ablation.py`.
14. Bevel edges seen close (a razor-edged key read as plastic). Use real proportions (8 thin spring coils read as a screw). Flat-shade cut faces. Section faces are the same alloy as the body.
15. Fake caustics from raw Voronoi edges look like tiles; warp them with noise and lower the contrast.
16. Distance haze through a material (camera distance) gives aerial perspective at about zero cost: underwater and landscape tests.

## Rendering (4 vCPU, no GPU)
17. **EEVEE without a GPU is unusable.** Use Cycles CPU.
18. **Profile before optimising; the bottleneck moves.** Pilot-01: samples × pixels. Pilot-02: OIDN (16.6 of 52 s). The `final` profile (4 samples + fast albedo OIDN) holds SSIM ≥ 0.976 against 16 samples.
19. **Persistent data produced black geometry twice:** pilot-01 with animated booleans, and pilot-04 **without** any, in a long run interrupted by a restart. Keep it off for finals. Always QC before assembly: the temporal-spike check caught both.
20. **Resume works:** a container restart mid-render cost nothing (v3). `--changed-only` is conservative: an off-screen pose change re-renders the frame, which is correct because shadows and reflections can change.
21. Measure renders without CPU contention. v4's 73.7 min total ran alongside builds and tests, so it isn't a benchmark. v3's clean run took 57.6 min.

## Sound and captions
22. **Noise beds mask events** (v1: 1 of 12 clicks audible; v2: 14 of 14). There's no sub-bass on small objects. Friction must be damped and detuned or it hums.
23. **Sparse Foley can't be loud without limiting.** Let narration set the loudness, and duck the Foley −8 dB under speech (verified on a synthetic voice).
24. **Nobody has listened to the synthesised Foley yet.** The analysis checks timing and levels only. The best upgrade is your own phone recordings.
25. **Captions must not cover the action.** `caption_placer.py` with centre protection moved captions off the cam and shackle (importance 2.13 → 1.44). Wrapping must be on (`WrapStyle: 0`; it was silently off).
26. **Captions appear after the thing they name** (v1 and v2 showed "pins" before the pins).

## Process
27. **Use three focused attempts, then stop and document** (key brightness, micro-bump, biology lens blobs).
28. **An unchanged result is data.** Verify the change was applied, then reject the hypothesis.
29. **Fresh-agent Skill tests find real gaps:** a missing planning-only mode, padlock-flavoured wording, no superlatives rule, a heavy template.

## Open problems (next work)
- A production human with a face rig (MPFB 2 / Rigify or a licensed asset). Character close-ups are blocked until then.
- Foley realism, which needs a listener and preferably real recordings.
- Interior flow scenes: vessel-to-cell scale versus lens; design rule needed.
- Archetypes D, E, G and H never built; fluids and crowds untested.
- GPU render times unmeasured.
