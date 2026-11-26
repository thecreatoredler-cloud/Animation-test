# Pilot-04 (padlock v4): final-cycle pass

**Inputs verified.** None of the brief's `/mnt/data/*` paths exist in this workspace. The local equivalents are pilot-03 final (1440×2560 H.264, 240 frames, AAC 48 kHz stereo, which matches the brief's metadata), the 18 reference Shorts, the tutorial video and both notes from the uploads folder. The compilation was withdrawn by the owner earlier and isn't used.
**Audio:** I can't listen. Audio judgements are from loudness, onset and spectrogram analysis only.

## Brief observations, validated against v3
| # | Observation | Verdict | Evidence |
|---|---|---|---|
| 1 | Middle-shot repetition (2–5.5 s) | **Confirmed** | Timeline sheet: about 3.3 s of near-identical section framing |
| 2 | Shallow DOF in the plug turn | **Confirmed** | Centre sharpness 12–20 vs 31–65 elsewhere |
| 3 | Captions over the active mechanism | **Confirmed** (6.0–6.8 s cam; lower band over the key and pins) | `caption_placer` importance 2.13 under the fixed position |
| 4 | Opening lacks spatial context | **Confirmed** | Whole lock first seen at 7.3 s |
| 5 | Ending continuity | **Partly**: payoff works; the returning piece blurs across the frame at about 7.0 s | Frames 205–215 |
| 6 | Materials | **Mostly resolved in v3** (grazing fill); the bright key bow at 0–1 s remains | 100 % crops |
| 7 | Cutaway coherence | **OK**: one static split of the same body; parts share one coordinate system | Geometry built from one function |
| 8 | Visual rhythm | Same as 1 | |
| 9 | Sound | **Not judgeable by me**: synthesised Foley; levels and timing verified only | `qc/audio_final/` |

## Shot timeline (v4)
| t (s) | Viewer understands | Camera | Caption (placement by `caption_placer`) | Sound (events) |
|---|---|---|---|---|
| 0.0–0.67 | A padlock on a shed door; the key is coming | Medium 3/4 of the whole lock → fast push to the keyhole, rack focus | "How does a key open this?" (lower) | air bed; key_touch 0.67 |
| 0.67–2.2 | The key enters; the lock's own front half lifts away | Rise and arc to the front 3/4 | | key_enter, slide begins |
| 2.2–3.3 | Context: pins, cam, balls and shackle in one view | Wide section, 55–58 mm | "Pin pairs block the plug" (top) | friction texture |
| 3.3–4.2 | The key's ridges lift each pair | Low close-up on the ridge/pin contact, rack focus | "The key's ridges lift them" (lower) | pin_click × 14 (2.3–4.5 s) |
| 4.2–5.0 | Springs compress | Slide along the stacks, rack to the springs | "squeezing the springs" (lower) | |
| 5.0–5.4 | The gaps align at the shear line | 85 mm macro, glow line | "Gaps align" (top) | key_seat 5.0, then **silence** |
| 5.4–6.2 | The plug turns; the cam swings | Rise to the cam view, f/16 | "The plug turns" (top) | turn_start/friction/stop |
| 5.9–6.6 | The balls retract; the shackle pops; the body drops and swings | Same view | "the cam frees the balls" (top) | balls, shackle_pop, body_drop, jingle |
| 6.2–8.0 | The whole lock hangs open; the front half returns | Pull-out to 45 mm | "and the shackle springs open" (top) | swing_creak, jingle |

## Changes (v4) and before/after
| Change | Before (v3) | After (v4) |
|---|---|---|
| Establishing opening | Underside only until 7.3 s | Whole lock at 0.0 s, keyhole by 0.67 s |
| Beat-distinct middle | One section view, 1.7–5.0 s | Context → ridges → springs → shear line |
| Turn DOF | f/11, sharpness mean 18.5 (f185–205) | f/16, mean **23.4** (+26 %) |
| Caption placement | Fixed 72 % (or manual top) | Per caption, from rendered frames (`caption_placer.py`) |
| Render defect | n/a | Black body in frames 18–73 (persistent data, mid-run). **Caught by QC**, re-rendered fresh, QC pass |

## Not changed (and why)
- Key bow brightness at 0–1 s (three attempts in v2/v3; low impact once the whole lock is visible first).
- Front half's return blur at about 7.0 s (low priority; it would need a path redesign).
- Foley (can't be judged without listening; real recordings recommended).
- Hand holding the key (needs a production character).

## Render
240 frames, 73.7 min summed frame time **under CPU contention** (concurrent builds, tests, renders and a container restart), so it isn't a valid benchmark. The clean benchmark is v3 at 57.6 min. Frames 18–73 were re-rendered with persistent data off (mean 18.9 s, contended).
