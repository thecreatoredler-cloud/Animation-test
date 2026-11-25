# Diagnosis of pilot-01 (v1), the 8 s padlock test

Inputs: `projects/pilot-01-padlock/output/pilot-01-padlock_review.mp4` (720×1280, 30 fps, 8.00 s; it matches the note's spec), the contact sheet, and the shot script. The note's `/mnt/data/*` paths don't exist in this environment. The reference is the 18 Zack D. Films Shorts the owner supplied (the owner withdrew the compilation earlier).
Tools: `scripts/audio_analysis.py` (BS.1770 loudness, onsets, spectrogram → `v1_audio/`) and `scripts/analyze_reference.py` (motion).
**Limitation:** I can't listen to audio. Audio findings come from measurements plus the spectrogram, and the owner's ear is the final judge.

## A. Sound (highest priority)
Measured: integrated −22.5 LUFS, LRA 7.8 LU, peak −2.8 dBFS. Momentary loudness per 0.5 s:
`−42.6 −41.8 −41.9 | −26.8 −24.9 −25.7 −25.4 −24.8 −25.6 −26.6 | −21.0 −18.7 −14.9 −23.0 | −33.6 −44.3`

| Time | Problem | Evidence | Cause |
|---|---|---|---|
| 0.0–1.6 s | Near-silence while the key travels, then a hiss with no visible source | −42 LUFS; spectrogram shows a flat 3–10 kHz noise band | "scrape" layer at −38 dB = band-passed white noise |
| 1.45–3.3 s | Generic whoosh at the reveal (a sound "because a shot changes") | Broad 1–3 kHz noise hump | `whoosh` cue at the cutaway: no physical source |
| 2.0–5.5 s | Pin clicks inaudible as events (1 of 12 detected) | Thin click lines sit on top of a continuous 3.4 s noise bed at about −25 LUFS | Scrape level −24 dB masks clicks at −21 dB; clicks were sine pairs plus noise, too similar to the bed |
| 5.5, 5.95, 6.33 s | Three oversized "cinematic" impacts for a 4 cm object | Peaks 32–41 dB over the floor; most energy **below 100 Hz** in square-edged 0.35 s blocks | `impact`/`weight` layers (55–70 Hz thump). A real padlock has no sub-bass |
| 6.33–7.2 s | "Ting" reads as a beep | Pure 1.5 kHz line with harmonics, 0.9 s | 4 sine partials, too few and too clean for a steel shackle |
| 6.4–7.7 s | A second whoosh on the pull-out | Noise hump 0.4–1.8 kHz | Decorative |

Verdict: the soundscape is noise beds plus sine pings with a loudness ramp from near silence to booms. It isn't coherent and it isn't Foley.

## B. Animation
| Time | Problem |
|---|---|
| 0.0–2.0 s | The key glides in from the left in mid-air on one ease curve. There's no approach toward the hole and no contact moment at the keyway |
| 3.3–5.5 s | Pins ride the bitting correctly (good), but every part moves with the same linear tie to the key. No pin inertia; springs scale smoothly with no lag or settle |
| 5.5–6.2 s | The plug turns 90°, but the turn axis points at the camera and the motion reads as "mushrooms rotate". The cause and effect (pins aligned → plug free) isn't staged: no pause, no beat |
| 6.3–7 s | **The shackle pops with no visible cause.** There's no cam, locking bolts or balls. A mechanical gap (see E) |
| All | The same `inout` ease for the camera, cutter and key; nothing has its own weight |

## C. Camera
- 2.9–6.5 s (frames 88–196): about 3.6 s of one near-frontal, orthographic-looking side composition. The reference measured 4 % still frames; ours technically moves (0.82 %/frame), but the **angle** never changes, so it reads as static.
- 0–2 s: the hero is a mid-distance 3/4 view. The key is small and unfollowed; the most interesting moment (key meets keyhole) happens off-axis.
- The plug turn is filmed along its own axis, which is the least readable angle.

## D. Models and materials
- The cut faces render as a uniform **beige block** (`BrassMachined #E2CFA0`, r 0.42). It doesn't read as the inside of the same brass lock (the note's main point).
- The body is a simple rounded box: no shackle bores, rim chamfers or keyway escutcheon detail. The key bow is a plain disc.
- Steel drivers are good. The springs are thin and get lost.

## E. Mechanical accuracy (researched)
Common pin-tumbler padlocks have the **keyway on the bottom face**, the **plug vertical**, and pin stacks drilled sideways into the body. Turning the plug turns a **cam** at its top. The cam lets the **locking balls (or a bolt)** leave the **notches in the shackle legs**, and a **shackle spring** pushes the shackle up. The long leg stays captive. Sources: Firgelli padlock mechanism explainer (commercial), USPTO patents US 11346133 "Padlock with integrated keyway" and US 5964108 (ball-bearing locking).
v1: front keyway with a horizontal plug (door-cylinder layout), and no cam, balls or shackle spring. The release is unexplained, which counts as a misleading simplification.

## F. Environment and lighting
- A generic blue sky over a beige tabletop. The white mug is the brightest shape in frames 1–60 and pulls attention away from the subject (as the note said).
- Even high-key light leaves no sculpting on the brass. The rim is barely visible.

## G. Storytelling
- No curiosity gap: the whole lock is visible at once, and the inside is then revealed by a slab sliding down.
- The best visual (pins jumping as the key's teeth pass) is shown front-on and small.

## H. Captions
| Caption | Time | Issue |
|---|---|---|
| "Inside a padlock" | 0.25–1.3 | Fine |
| "are tiny pins" | 1.5–2.6 | **Before** the pins are visible (reveal completes about 3.3 s) |
| "The key's ridges" / "lift each pin" | 2.8–5.3 | Inaccurate: the key lifts **pin pairs** |
| "to one line" | 5.35–6.2 | Vague: it's the **shear line** |
| "and it opens" | 6.3–7.9 | Fine |

## Hypotheses for v2 (each tested in a later iteration)
1. **Sound:** physically modelled contact Foley (modal resonances of brass and steel parts, excited by contact events taken from the animation) with no noise beds, no sub-bass and no whooshes. It will measure as distinct events (all pin clicks detectable) with natural loudness relationships.
2. **Mechanism and storytelling:** bottom keyway, vertical plug, cam plus two locking balls plus shackle spring, shown in a **quarter-section** (front-right quarter removed) that exposes the pin plane and the shackle-lock plane together. Cause and effect are staged as beats.
3. **Cutaway continuity:** cut once at build time (static booleans). The removed quarter is a real piece of the same lock that **lifts away**, and the cut faces are the same brass with a machined finish. A side effect is that persistent data becomes safe, which cuts per-frame fixed cost.
4. **Camera:** start low on the keyhole as the key rises into it, follow, arc to the quarter-section 3/4 view, macro on the shear line, re-angle for the turn, pull out to the lock hanging open.
5. **Environment:** a padlock hanging on a steel hasp of a weathered wooden shed door in low warm sun. It motivates the lock, raking light sculpts the brass, and a blurred garden gives a soft background. Detailed in VISUAL_DIRECTION.
6. **Render:** under 15 s/frame at 1440×2560 from static geometry, persistent data and a tuned sample count, verified against 16-sample frames at the same resolution.
