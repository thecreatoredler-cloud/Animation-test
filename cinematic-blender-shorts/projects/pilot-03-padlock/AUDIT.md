# Production audit: padlock pilot v2 → v3

**Audited:** `projects/pilot-02-padlock/output/pilot-02-padlock_final.mp4` (1440×2560, 30 fps, 8.00 s; the file has synthesised Foley but no voice-over) and its Blender scene `blend/s01_padlock_v2.blend` (built from `shots/s01_padlock_v2.py`).
**Benchmark:** the 18 Zack D. Films Shorts the owner supplied (measured in `references/zach_visual_analysis.md`). The note mentions a "reference compilation"; the owner earlier withdrew the compilation in favour of these 18.
**Method:** frames every 0.5 s and at events, full-resolution 100 % crops (`audit/crops_v2.jpg`), measured motion statistics, audio loudness, onsets and spectrograms, and **controlled single-variable render tests** for every lighting and material claim.
**Labels:** **[O]** observed or measured · **[H]** hypothesis · **[S]** stylistic choice.
**Limitation:** **I can't listen to audio.** Sound statements come from measurements and spectrograms, and none of them claims the sound is convincing.

---
## 1. Reference benchmark for mechanism and object explainers
From the measured 18 Shorts, with emphasis on the object explainers (cheating dice, cartridge trap, wood, blank round, armor, derma roller).

**Recurring principles (use them):**
1. **The real object in a believable context, usually with a human hand** acting on it [O: dice, splinter, wood, trunk, blank round]. A floating object reads as a 3D demo.
2. **Bright, high-key, saturated look.** Shadows are soft but present; metals show strong, shaped reflections (gradients, not flat fills).
3. **Continuous camera motion.** Median stillness 4 %, mean zoom about 0.9 %/frame, pushes and pulls balanced, few hard cuts (median 3 per 30 s); cuts happen on action.
4. **Every second shows the exact noun being said.** Explanations are visual, not labelled.
5. **Highlights point at the key element:** a red impact glow on armor, a glow on the sword, coloured internal parts (the derma roller's holes, the skin-tag vessels). They are subtle and short, not bloom.
6. **Cross-sections are clean, bright and readable**, from the same material family as the outside (dice cut, soil section, skin layers).
7. **Captions:** 1–3 words, white extra-bold with a soft shadow, about 72–78 % height.

**Specific to individual videos, not universal rules:**
- The blue-sky gradient backdrop belongs to the medical and body videos. Mechanism videos use real contexts.
- The brand logo on T-shirts. Never copy it.
- Fast-cut action pacing (sword: 17 shots in 45 s) belongs to action stories, not mechanism explainers.
- Extreme stylisation of anatomy (flat red/blue vessels) belongs to the anatomy mode only.

---
## 2. Shot-by-shot audit of v2
| Time | Shot / action | Working | Weakness [label] | Why it matters | Correction | Priority |
|---|---|---|---|---|---|---|
| 0.0–0.7 | Low macro under the lock; key rises | Strong hook: question caption, keyhole visible, rack focus | Key bow is a **blown white disc** in the foreground [O: crop 0.4 s] | The brightest, largest shape is the least important | Bevel the key; brighter nickel with real reflections; bow partly out of frame | High |
| 0.0–0.7 | Same | — | Key **floats**, with no hand or ring [O] | Reads as a CG demo, unlike the reference (principle 1) | v3: split ring plus a second key that swings (physical cause, sound). Hand: needs the character system | High |
| 0.7–1.6 | Key tip enters; front half cracks and lifts | The piece leaving proves it's the same lock | — (fixed in v2 iteration 7: faster exit) | | | — |
| 1.6–5.0 | Pin ride | Mechanism reads correctly; pairs move independently | **Section faces render flat cream/ivory** [O: crops 1.6/4.7/5.5 s; measured saturation 29 %, brightness 85 %] | The cutaway reads as a beige diagram, not the inside of a brass lock. This was the owner's central continuity concern | **Root cause [O, tested]:** the uniform front fill light is mirrored by every flat face. Fill off drops brightness from 85 % to 8 %. Fix: move the fill low-left (grazing) plus a weak front fill (v3). **Disproved hypotheses:** HDRI rotation (no change), sun (no change), AgX look (−2 %) | **Critical** |
| 1.6–5.0 | Same | — | **Springs read as threaded screws** (8 tight coils, thin wire) [O: crop 4.7 s] | Misreads a key component | 5 open coils, 0.27 mm wire (v3) | High |
| 1.6–5.0 | Same | — | Key reads as **grey plastic** (flat, razor-sharp 90° edges) [O] | Breaks the material realism at macro | 0.16 mm bevel and brushed nickel; the moved fill gives reflections a gradient (v3) | High |
| 2.2–5.0 | Same | Readable | 2.8 s of fairly **frontal** framing (orbit 25→18°) [O] | The least cinematic stretch | 30° orbit (az 25° → −5°) during the ride for parallax on the pins (v3) | Medium |
| 5.0–5.4 | Macro on the shear line | Gaps visibly align | The alignment isn't **emphasised** beyond the caption [S] | The reference uses short highlights to point (principle 5) | Thin warm glow along the shear line, fading in for 0.15 s and out at the turn (v3) | Medium |
| 5.4–6.2 | Turn; cam and balls | Correct cause and effect | Mid-transition blur fixed in v2 iteration 7. Caption covered the balls (fixed: top caption) | | | — |
| 6.0–7.3 | Shackle pops; body drops and swings | Physical payoff | **No secondary reaction** from the key itself [O] | A jolt that moves nothing else feels weightless | Keyring and second key swing (pendulum, T ≈ 0.38 s), kicked by the drop (v3) | Medium |
| 7.3–8.0 | Pull-out; lock hanging open | Clear payoff | **Rivets look like water droplets** (white spheres) [O: crop 8.0 s] | Breaks believability in the final, longest-held frame | Flat 0.28-height domes, darker steel (v3) | Medium |
| 7.3–8.0 | Same | — | The frame is a little empty and the lock small [S] | | Optional: 10 % tighter final framing. Not changed (needs a re-plan with narration) | Low |
| All | Continuity | No jumps, clipping or missing frames [O: QC spike and flicker checks pass] | — | | | — |

---
## 3. Modeling and geometry
| Element | State | Action |
|---|---|---|
| Body silhouette | Plausible 40×22×36 mm block, 3-segment bevel | Keep. Optional: a shallow engraved band and maker-free stamp for scale cues (not done; low) |
| Key | Correct bitting from one function; **no edge bevel** | **Bevelled** (v3). Bow is still a plain disc: low priority |
| Plug, shear line | Correct geometry; 0.15 mm clearance reads as a dark line | Keep. The glow adds emphasis |
| Key pins / drivers | Lathe profiles with chamfers and rounded tips; hold up at 100 % | Keep |
| Springs | 8 coils, 0.19 mm wire → screw-like | **5 coils, 0.27 mm** (v3) |
| Shackle | Exact polyline, ball notches | Keep |
| Cam | Rounded box; reads as "a block" | Optional: a slotted tailpiece shape (low) |
| Cutaway | One plane shows the whole chain; the static split piece proves continuity | Keep (the v2 key decision) |
| Hasp, rivets | Rivets were full spheres | **Flattened** (v3) |
| Topology, normals | No shading artifacts found at 100 % (flat-shaded cut faces avoid fan streaks) | — |

## 4. Materials (each tested under the actual light)
| Material | v2 problem | v3 change | Evidence |
|---|---|---|---|
| Brass section | Cream (sat 29 %, val 85 %) from the mirrored fill | No shader change needed; lighting fixed it | fill_moved test: sat 86 %, val 29 %; v3 render: rich brass |
| Brass body | Good | — | |
| Nickel key | Grey plastic (#3B3F43 + mirrored fill) | #8A8F95, r 0.24, brushed, bevelled | v3 4.7 s crop: brushed steel |
| Steel drivers | Good, bright chrome | — | |
| Springs | Fine | Geometry fix | |
| Rivets | Bright, glossy | RivetSteel #6E7478 r 0.5, flat | |
| Planks | Good (PBR, tinted) | — | |
Shader rule learned: **check what a flat metal face mirrors before changing its shader** (lesson 32).

## 5. Lighting, environment, rendering
- Key (sun, warm) / fill / rim balance [O]: the fill dominated flat faces. v3: grazing fill at 8 W plus a 1 W front fill.
- Reflection shapes: rough metals mirrored a uniform rectangle. Now they get gradients from the grazing fill and the HDRI.
- Contact shadows: present on the door. Interior AO comes naturally in Cycles.
- Background: the door and garden bokeh support the subject with no distractions [O].
- DOF: important moving parts stay sharp (focus tracks the target). The 0.4 s foreground bow is intentionally soft.
- Noise and flicker: none detected (QC spike and flicker checks; SSIM 0.976+ against 16 samples).
- **Not added, on purpose:** volumetrics, bloom, extra lights. Each would cost render time without improving readability.

## 6. Camera
Measured motion of v2: still 3 %, zoom 1.0 %/frame, in/out 47/47 %. This matches the reference. Remaining issue: the frontal pin ride → v3 orbit. The revised plan is §11.

## 7. Animation and physical behaviour
All parts have their own physics: the key's hand curve with 5 hesitations, pins on contact physics, plug stiction and detent, balls driven by the cam, a spring-snap shackle, a body that drops and swings. **Accuracy check [O]:** correct order (pairs aligned → plug free → cam → balls → spring). Simplifications: no wards or keyway profile; the plug retainer and the turn stop aren't shown. Missing secondary motion: the key assembly didn't react to jolts → v3 keyring.

## 8. Effects
| Effect | Verdict |
|---|---|
| Motion blur (180°) | Needed. Measured cost −3.6 s/frame. Keep |
| DOF | Needed (macro realism, focus guides attention). About 1 s/frame. Keep |
| Grain 2, vignette 0.18, unsharp 0.2 | Subtle, fine. Re-check after YouTube compression (§12) |
| Glow/highlight | Was missing → v3 shear-line glow (geometry emission, no bloom pass) |
| Particles and dust | Not needed. Dust in a sunlit macro could add life but would compete with the pins. Not added [S] |
| Cutaway transition | Good (static split piece) |

## 9. Sound map (v3)
`SOUND_DESIGN.md` has the full table. v3 adds `key_jingle` (the second key knocking the first at the swing extremes after each jolt, decaying over 3 knocks). **Not listened to.** Measured: no masking (every event detected), no sub-bass, LRA about 8 LU, true peak −1 dBTP.
**Recommended real-Foley upgrade (free, unambiguous rights):** the owner records on their phone, in a quiet room, close-miked, 3 takes each: key into a padlock slowly; turning the key; shackle popping open; a padlock dropping 1 cm onto its own shackle; two keys on a ring clinking. Drop the WAVs in `assets/sound/own/` and switch the recipes to `{"kind": "file"}`. Timing stays automatic, and the licence is "own recording". This is the highest-value sound improvement available.

## 10. Editing, pacing, captions; narration design
- First second: creates curiosity [O]. Every shot adds information [O]. No dead moments. The tightest beat is the cam and balls (about 0.8 s).
- Captions: accurate; after-the-visual timing fixed in v2. **New in v3:** kept inside the Shorts safe area (72 % height, 14 % side margins: the right 12 % holds the player's buttons, the bottom about 20 % holds the title).

**Narration workflow (designed; ducking implemented and tested with a synthetic voice):**
1. Write the narration first (2.3–2.7 words/s). Mark each noun that has a visual beat.
2. Record or generate the voice → `audio/narration.wav`. Mark word times; with no forced aligner here, use a manual cue sheet `narration_cues.json` with word and start time.
3. Retime the shot from the cues: the shot's frame constants (F_KEY_HOME, F_TURN0, …) become functions of cue times, so each action lands on its word. Sound events follow automatically because they come from the same functions.
4. Captions are generated from the cues (1–3 words each), not written separately.
5. Leave 0.4–0.6 s voice pauses before the two reveals (front half lifting, shackle pop) so sound and picture carry them.
6. Mix: voice about −16 LUFS; Foley ducked −8 dB under speech (`foley.duck_gain`: 30 ms attack, 80 ms hold, 250 ms release; verified −8.0 dB during speech, full level about 0.5 s after).

## 11. Revised shot and camera plan (v3, implemented)
| t (s) | Camera | Change from v2 |
|---|---|---|
| 0.0–0.8 | Low 3/4 macro, 45 mm f/4, rack from key to keyhole | Keyring visible swinging below the bow |
| 0.8–2.2 | Rise and arc to the front 3/4 while the front half lifts | — |
| 2.2–5.0 | **30° orbit** (az 25° → −5°) while pushing 65→75 mm | Was 7° |
| 5.0–5.4 | Macro on the shear line, 85 mm f/9 | **Glow** on the gaps |
| 5.4–6.2 | Rise to a front/high view between the shackle legs | — |
| 6.2–8.0 | Pull out to 45 mm, lock hanging open | Keyring swings from the drop |

## 12. Mobile readability and compression
- Caption cap height ≈ 5.2 % of frame height (about 7–8 mm on a 15 cm phone): readable [O]. Moved inside the safe area (v3).
- Focal point: one subject per beat, with DOF isolating it [O].
- **YouTube-like compression test:** see `COMPRESSION_TEST.md` (generated after the v3 render).

## 13. Scorecard (1–10; v2 audited, v3 after fixes)
| Category | v2 | v3 | Reason |
|---|---|---|---|
| Modeling | 6 | 7 | Bevelled key, open springs, flat rivets. The cam and key bow are still basic |
| Materials | 5 | 7 | Section faces now read as brass and the key as metal (root cause fixed in lighting, measured) |
| Lighting | 6 | 7 | The fill no longer flattens metals. Still a single setup with no shot-specific tweaks |
| Environment | 7 | 7 | Unchanged: motivated, uncluttered, a little sparse in the wide end |
| Camera | 7 | 7.5 | Orbit adds parallax in the pin ride. Plan matches the reference's motion statistics |
| Animation | 7 | 7.5 | Keyring adds physically caused secondary motion. Still no hand |
| Effects | 6 | 7 | Purposeful shear-line highlight; nothing gratuitous |
| Sound | 6 | 6 | Unverified by ear; jingle added. Real recordings recommended (§9) |
| Editing / pacing | 7 | 7 | Tight but clear; the cam beat is short |
| Clarity | 8 | 8.5 | The mechanism reads beat by beat; the glow marks the key idea |
| **Resemblance to the reference style** | 6 | 7 | Bright, real-context explainer with continuous motion. Missing: human hands, recorded Foley, narration |

## 14. The five highest-impact changes (ranked)
1. **Fill-light redesign** (section faces cream → brass; key plastic → metal). Measured, implemented.
2. **A human hand holding and turning the key.** Biggest remaining gap to the reference. Needs the character system (MPFB host allowance). Not done.
3. **Real recorded Foley** (owner's phone recordings, §9). Not done; can't be done here.
4. **Keyring secondary motion and the shear-line highlight.** Implemented.
5. **Geometry fidelity at macro** (key bevel, open springs, flat rivets). Implemented.

## 15. Problems that can only be judged with the voice-over
- Whether 8 s fits the explanation at natural speech speed (about 20 words): probably tight.
- Whether each action lands on its word (requires cue-based retiming, §10).
- Caption density once captions come from the narration.
- Whether the Foley at −8 dB under the voice still carries the clicks.
- Final loudness (voice-led, about −16 to −14 LUFS) and how much the Foley climax needs taming.
- Whether the two pauses for the reveals feel natural or slow.
