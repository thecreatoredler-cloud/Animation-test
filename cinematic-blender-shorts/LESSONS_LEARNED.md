# Lessons learned (what worked, why, and when it applies)

Each lesson cites the evidence. Read this before planning a new video; it's the cheapest way to avoid repeating a mistake.

## Story and direction
1. **Show cause → effect as separate beats, and let silence mark the "aha".** v1 rotated the plug the instant the pins aligned, so the viewer missed why it could turn. v2 holds 0.4 s on the aligned gaps (macro, no sound) before the turn. Applies to any mechanism explainer.
2. **The payoff must be physical.** In v1 the shackle popped with no cause. v2 shows cam → balls → shackle spring, and the hanging body drops and swings. When something "opens", show what held it and what releases it.
3. **Choose a setting that motivates the object, not a backdrop.** A shed door with a hasp makes the lock *hang*, which enables the drop and swing, gives the brass real reflections, and removes the generic table and white mug (v1's brightest distraction). Not a universal rule: medical and body videos still suit the reference's blue backdrop.
4. **Research the real construction before animating.** v1's front keyway and horizontal plug looked plausible but were wrong for a padlock, and they hid the cam and ball mechanism. Ten minutes of research changed the whole layout, and the correct layout turned out to be the more filmable one: everything in one plane.

## Geometry and continuity
5. **Make a cutaway from the real object once, at build time** (`scene_builder.split_by_box`), and animate the removed piece. An animated boolean cutter (v1) cost time every frame, forced persistent data off, and produced a "beige block" look. A static split keeps the same brass on the section faces, the leaving piece proves it's the same object, and persistent data becomes safe.
6. **Design so one section shows the whole chain.** Put pins, cam, balls and shackle notches in one plane (y = 0) so a single half-section explains everything without a second cut.
7. **Derive geometry and motion from one function.** The key's bitting function generates the key mesh, the pin motion (`spring_follower`) **and** the click times for sound. Contacts are exact, and sync can't drift.
8. **Baked transforms replace the object's base location.** The returned front half ended 18 mm low because its origin was at BH/2. Always add the base: `shell_base + offset`.
9. **Check the mechanism's clearances numerically.** A 10 mm shackle travel left the short leg 2.5 mm *inside* the body; it needs to be ≥ 12.5 mm. A one-line calculation would have caught it before any render.

## Camera
10. **Start where the action begins, at a lens that frames it.** 60 mm at 7 cm under the lock showed only a beige blur. 45 mm at f/4 with a rack focus from the key to the keyhole made a clear hook.
11. **Film a rotation from off its axis.** v1 filmed the plug turn along its axis (unreadable). v2 rises to see the cam and balls from the front and above.
12. **Keep big foreground parts out of transitions.** The shackle leg and the returning piece both crossed the lens as large blurs until their paths and the camera were adjusted.

## Materials and light
13. **Bright metal reads as white plastic** when its flat face mirrors a bright sky behind the camera. For metals the base colour *is* the reflectance: lower it (nickel #3B3F43) and add brushed grain. Halving it from #7C8186 barely helped. It took three attempts; the key face is still slightly flat.
14. **Section faces = same alloy, finer finish.** Cut faces in a different light colour (v1 #E2CFA0) read as a separate block.
15. **Polish the moving part slightly differently** (plug vs body) so the boundary that matters (the shear line) reads.

## Sound
16. **Noise beds mask events.** v1's continuous scrape (−25 LUFS) hid 11 of 12 pin clicks. In v2, friction is micro-contacts about 12 dB under the clicks, and 14 of 14 are detectable.
17. **Friction through lightly damped modes turns into a hum.** Contact damps the parts (T60 × 0.25) and each micro-impact needs different detuned resonances.
18. **No sub-bass on small objects.** The only low end in v2 is the wooden door knock (185 Hz), which is really there.
19. **Sparse Foley can't be loud without limiting.** Its integrated loudness is set by the climax itself, so turning the climax down raises the master gain. Choose the loudness (−22 LUFS) that keeps limiting about 3–4 dB on one transient, and let narration carry loudness when present.
20. **No sound for visual devices** (the section lifting, the alignment beat). This is what keeps the soundscape believable.
21. **I can't listen.** Spectrograms and onset analysis catch masking, hum, sub-bass and loudness shape. Naturalness still needs a human ear.

## Rendering (4 vCPU, no GPU; numbers in `benchmarks/BENCHMARKS.md`)
22. **Profile the frame; the bottleneck changes with the scene.** v1's bottleneck was samples × pixels. In v2, **denoising was 16.6 s of a 52 s frame** (OIDN "accurate" prefilter at 3.7 MP). The tutorial's bottleneck was volumetrics. Never reuse a conclusion without measuring.
23. **Fast denoise + 4 samples ≈ 16 samples to the eye in this scene class:** SSIM ≥ 0.976 against a 16-sample reference, with slight smoothing of micro-texture on small parts. Always check a 100 % crop.
24. **Measure sequences, not single frames.** First-frame load (BVH, HDRI, textures) adds about 5–6 s that persistent data removes from later frames.
25. **Small stuff adds up:** light tree off (few lights) −0.9 s, PNG compression 0 −0.5 s, 1k instead of 2k HDRI −0.4 s.
26. **Not everything is worth cutting.** Motion blur, DOF and bounces cost under 7 % each and carry the realism. Removing micro-bump saved 0.2 s and visibly changed the look (reverted).
27. **Persistent data plus animated modifiers = stale geometry** (v1 frames 162–200 went black). Keep animated geometry out of modifiers, or keep persistent data off.

30. **Captions must not cover the action.** At 6.0–6.6 s the bottom caption sat on the cam and balls. Check each caption against its frames and use `"pos": "top"` when the subject is low.
31. **Change-detection must be conservative.** `--changed-only` re-rendered 209 of 240 frames after a small fix, because an off-screen piece's pose changed, and off-screen objects can still cast shadows and reflections. Plan edits so unchanged spans stay truly unchanged (e.g. keep a piece's hidden pose fixed) to benefit.

## Process
28. **Write the event list in the shot, not by hand in the mix.** Sound timing then follows edits to the animation automatically.
29. **Three focused attempts, then stop and document** (key brightness, micro-bump). This keeps usage bounded.
