# Reference B: "How to Make Ultra-Realistic 3D Animated Shorts Using Claude (Full Workflow)"

The video is 12:25 long, 1280×720, 30 fps, and was supplied by the owner.
**Method:** contact sheets every 6 s (`ffmpeg fps=1/6, tile`) plus full frames at the key moments. **The speech could not be transcribed.** This container's network blocks every speech-model host (Hugging Face and OpenAI's model host). Statements below are marked:
- **[seen]**: read directly from on-screen text or images in the video.
- **[brief]**: from the owner's description of the video in the project brief, not independently confirmed.

## The creator's loop, in order
1. **Pick reference Shorts and study them frame by frame [seen].** The tutorial downloaded "How Stitches Work" (255M views) and "How Splinters Get Unstuck" (216M) and read the frames as grids. On-screen conclusion: *"The camera never stops moving. 'How Stitches Work' has no cuts at all. It is one shot that starts wide on a calf, pushes slowly into an extreme close-up of the wound, and stays there while the wound changes. Then it pulls back out and the scar fades. Pushing in explains, pulling out resolves."*
2. **Measure the motion [seen].** On-screen tool output for the stitches Short: `930 frames; zoom %/frame mean|z| 0.541 max 3.500; frames zooming in 42% out 23%; pan px/frame mean 0.28 max 1.0; camera still 23%; zoom jerk (2nd diff) mean 0.0507 max 2.500`. The tutorial then ran the same analysis on **the channel's 50 most-viewed Shorts** (about 47,700 frames) and showed a dashboard with medians: 0.52, 0.18, 0.44, −10.4, 2.77, 0.14. "Hard cuts, share 0.14, median of 47" is legible; the other labels are too blurred to read. It also showed a **background swatch of RGB 82, 164, 222** and graphs comparing his camera motion with "our first test".
   → **We built the same capability:** `scripts/analyze_reference.py`. It reproduces his stitches number (0.536 vs 0.541 %/frame) and was run on all 18 of our references (`zach_visual_analysis.md`).
3. **First recreation, then compare side by side [seen].** A Blender leg-with-stitches render was laid next to the original frames. Later grids compared his frames and ours shot by shot ("Measure calf width in his frames and ours", "Put his and our frames side by side").
4. **Geometry has to follow the surface [seen + brief].** The early stitch thread floated over or cut through the skin. The fix bound the effect to the animated mesh instead of screen or world space. We generalise this: **anything attached to a body must be parented, constrained or shrinkwrapped to the deforming surface** (`character_guide.md`, `animation_guide.md`).
5. **Swap the character for one with a real facial rig [seen].** Frames show a low-detail head that could not form expressions, replaced by a head with mouth, jaw and brow shapes (open-mouth tests at 8:20–9:00). The lesson: **check the facial rig before choosing a character.**
6. **Build the environment to fit the shot [seen].** A blood-vessel story moved through a football stadium, a city (on screen: *"a low sun with long shadows, about 1,300 trees, cars and rooftop AC units"*), clouds and the Earth. A green plane was replaced with track, seating and buildings where the camera could see them.
7. **Layered sound [seen].** On-screen summary:
   - *"A foundation layer: a very quiet room tone, so the scene never sits in dead digital silence."*
   - *"Stacked sounds on the big moments: a low 'weight' layer, the main sound, and a high detail on each."*
   - *"Sound follows the camera: wide shots get more room echo and a duller top; the close-up is dry and detailed."*
   - A background for each world: stadium air, wind as the camera cranes up, a scanner hum in the X-ray, city traffic → high-altitude wind → ocean, a deep-space drone for the Earth.
   - Effects timed to the frame: an X-ray sweep with the dissolve, a bone knock on the word "bones", a whoosh on every cut, and clouds passing left then right.
8. **Realism pass [seen].**
   - *"Colour mode. Every tutorial says never use the mode we use. It clips bright areas to flat white … The fix that keeps our approved blue looks the same in normal tones and only stops the highlights from clipping."* → Keep the look, but use a tone-mapping curve (AgX) so highlights roll off instead of clipping.
   - *"Skin: matte instead of oily, no plastic shine, stronger pores, warmer light through the skin."*
   - *"Teeth: … the green on the teeth was never the texture; it's grass light bouncing up into the shadow under the lip."* → Check colour casts from bounce light before blaming textures.
   - Also mentioned: light falloff ("ours have none of that"), lens softness, motion blur, film grain [brief + partly seen].
9. **Render-time profiling [brief].** He measured per-frame render time, found the unusually slow frames, traced them to expensive fake lighting and volumetrics, changed them, and re-rendered the same frames to confirm the saving. The specific numbers were not legible in our frames.
10. **Approval checkpoints [seen].** His task list included *"Final 2K render + sound (ask first)"* and *"Build the side-by-side comparison"*. He also asked for "render some still frames, like PNGs, from different scenes, and show me that" before committing to the full render.
11. **Save the workflow as a Skill [seen + brief].** The end of the video shows the saved workflow, offered as a paid community download. **We build our own instead.**

## Rules this system adopts
| # | Rule | Where it lives |
|---|---|---|
| T1 | Measure the reference before building, and measure our render with the same tool | `scripts/analyze_reference.py`, `quality_control.py` |
| T2 | Every scene has camera motion **and** subject motion **and** secondary motion | `animation_guide.md`; QC checks camera-still fraction and residual motion |
| T3 | Attachments follow deforming geometry (parent, constraint, shrinkwrap, surface deform) | `character_guide.md` |
| T4 | Choose characters by rig quality (body + face) before looks | `character_guide.md` |
| T5 | Build environments only where the camera sees them, but fully there | `environment_guide.md` |
| T6 | Four-layer sound: room tone, low weight, main hit, high detail; reverb and EQ by shot size | `audio_guide.md`, `video_assembler.py` |
| T7 | AgX tone mapping, matte skin with SSS, check bounce-light casts | `lighting_guide.md`, `material_guide.md` |
| T8 | Profile render time per frame, fix the measured bottleneck, re-render the same frames | `render_benchmark.py`, `render_optimization.md` |
| T9 | Stills for approval before the final render, and side-by-side with the reference | `SKILL.md` workflow gates |
