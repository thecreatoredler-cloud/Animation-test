# Current Progress

_Last verified: 2026-11-10. All four pages loaded and rendered with no console errors or missing assets in `qa/capture.js`, using a software GPU._

## Timeline (what was built, in order)
1. **`index.html` — "Night Shift" 5 s benchmark.**
   - A school hallway, a canvas-drawn janitor card that walks and waves, a FPS results card.
   - **On the owner's phone:** 59.9 average FPS, 1% low 48.5, Adreno 710.
   - Its old adaptive-resolution logic wrongly dropped the resolution to 1× during warm-up. That was fixed in later pages; this file is unchanged apart from QA hooks.
2. **`ANIMATION_STANDARD.md` + `CLAUDE.md` + `qa/capture.js`.** The quality standard and workflow (plan → build → QA scorecard → send proof).
3. **`STYLE_GUIDE.md`.** The measured study of the 8 reference shorts.
4. **`productions/test-01-mailbox/` — "The Little Red Flag", 15 s.**
   - Sunny street, mail carrier Rosa and homeowner Mr. Bram (canvas art), 7 shots, captions, synthesized music and sound effects.
   - **Owner's feedback:** liked the camera move into the house street. Disliked: not smooth (stutter, abrupt camera, stiff characters), empty background, camera always too close, lighting and saturation not like the references.
5. **`productions/test-02-mailbox/` — same story, upgraded.**
   - One continuous camera path, a better walk with follow-through, 16 houses and street dressing, background people, golden-hour light, light rays, post effects (bloom, depth of field, motion blur), quality warm-up, audio-clock timing.
   - The owner watched it on the phone (reported ≥55 FPS) and as an MP4, then asked for a deeper quality upgrade.
6. **`lib/` system + `productions/showcase-01-watchmaker/` — "The Watchmaker", 10 s.**
   - Real Poly Haven models and PBR textures, original character Augusta Penn (SVG art, face rig, IK), lamp key vs moon rim, four shots.
   - The owner watched it as an MP4. **No detailed feedback on it has been given yet.**

7. **Second reference study (2026-11-10).** Six reference shorts re-uploaded and analysed frame by frame; results in STYLE_GUIDE.md section 8, and DESIGN_RULES.md updated. Main findings: the references use many separate set-ups joined by short cross-dissolves, a toon-outlined world, simpler pose-to-pose characters, captions without pop, continuous voice-over. **No code has been changed for these findings yet.**

8. **`productions/antikythera-01/` — "The Ancient Computer Found Underwater", part 1, 10.4 s (2026-11-10).**
   - First production in the reference-study style: owner's voice-over (silences removed), six set-ups in three locations joined by dissolves, toon world with ink lines, simple pose-to-pose characters (Captain Stavros, Nikos the diver, a fish), captions without pop.
   - New shared modules: `lib/shots.js` (shot sequencer + dissolves), `lib/captions.js` (WebGL captions), `lib/toon.js` (toon materials, `drawToon`, `ToonActor`). `lib/post.js` gained ink outlines, dissolve buffers and flash; `lib/stage.js` gained audio-file tracks (`Sound.load`), `onRender` and `overlay`.
   - QA capture clean; MP4 rendered (1080×1920, 14 MB). **Owner feedback and phone numbers: not yet received.**
   - `vo-full-tight.mp3` holds the whole 60.3 s narration for the remaining parts.

9. **Antikythera, full video, 60.4 s (2026-11-10).** The owner supplied the script and asked for the rest.
   - The script was force-aligned to `vo-full-tight.mp3` (all 177 words); `words.js` holds the caption cards. Part-1 captions were corrected to the script.
   - 33 set-ups. New in `world2.js`: statue field, ancient ship, lump and restored machine, a room dressed as museum / workshop / lab, a dark stage (gear burst, Sun-Moon-planets, eclipse, X-ray letters), Greek exteriors (sundial court, Olympia, Athens 2005 with truck, hill of passing eras).
   - Six new characters in `cast.js` (diver in helmet, archaeologist, ancient craftsman, two scientists, runners).
   - QA capture clean (242 frames). MP4 rendered at 1080×1920, 54.5 MB. Measured: brightness 120, saturation 26, warmth 128, darkest 10% 69, brightest 10% 170, loudness −13.6 LUFS (all inside the reference ranges). The voice file is loudness-normalised to −14.5 LUFS.
   - **Owner feedback and phone numbers: not yet received.**

## Verified working (tested here)
- **All pages load and render deterministically** through `__seek`, with no errors (capture.js, 2026-11-10).
- **Showcase 01:**
  - All 13 GLB model files (16 placed instances) and 3 texture sets load; the clock hands inside the GLBs animate.
  - Face rig: blink, lids, pupils, brows, 6 mouths, the loupe flip.
  - Hand shapes swap correctly.
  - Measured IK accuracy: the hand lands within 1 cm of its target (debug probe at t = 1, 4.5, 6.5, 7.2 s).
  - The tweezers pick the gear and seat it; the watch moves to her ear.
  - Pendulums start in sequence.
  - Camera smoothness metric: 28 m/s².
  - UI test: Start, Pause, HUD, quality button cycling high → medium → low → high.
- **Draw cost (HUD, whole frame):** high 463 calls / 453k triangles; medium and low 356 / 299k (moon shadow off).
- **`tools/render-mp4.cjs`** produced a valid H.264 + AAC MP4 (0.5 s test, 2026-11-10). The same method made the full Test 02 MP4: 1080×1920, 30 fps, 15 s, about 19 MB.
- **`tools/fetch-polyhaven.mjs`** fetched and optimized every asset in `assets/polyhaven/` (3.1 MB → 665 KB for the mantel clock, for example).

## Not verified / incomplete
- **Phone FPS and stutter for Showcase 01:** unknown. It's the heaviest scene; draw calls are high for a mobile GPU.
- **Sound quality** of all productions: synthesized, runs without errors, never listened to by me. The owner hasn't commented on it.
- **`index.html`** still has the old adaptive-resolution logic (it drops resolution during warm-up).
- **Tests 01/02 are single-file pages** and don't use `lib/`. The showcase is the only page on the new system.
- **Showcase visual weaknesses** (from QA):
  - the watch at her ear is small and partly hidden;
  - the moonlight rim on Augusta is subtle;
  - the image is a bit darker, more contrasty and less blue than the night reference (brightness 88.9 vs 96, U 126 vs 138);
  - Augusta's legs are hidden behind the bench, so the walk cycle isn't exercised in the new system.
- **The character system has no walk cycle yet.** The Test 02 walk logic (stride tied to distance, `legPose`) still lives only in `test-02-mailbox/index.html`.
- **No captions** in the showcase (Test 01/02 have them).
- **Static geometry in the showcase isn't merged.** Test 02 has `bakeStatic()`, which merges by material; the showcase doesn't use it yet.

## Project structure
```
index.html                         first benchmark (single file)
CLAUDE.md                          workflow rules (auto-loaded by Claude Code) -> imports ANIMATION_STANDARD.md
ANIMATION_STANDARD.md              mandatory 10-section quality standard
STYLE_GUIDE.md                     measured reference study
PROJECT_CONTEXT.md / DESIGN_RULES.md / CURRENT_PROGRESS.md / TODO.md   handover docs
lib/stage.js      Stage class: renderer, installGrade(), quality levels, warm-up, loop, HUD + quality button, results card, Sound + synth, QA hooks
lib/post.js       Post class: MSAA HDR target, blur chain, composite (bloom, DOF, motion blur, glow, vignette)
lib/camera.js     CameraPath (hermite, monotone tangents, roughness()), motionBlur(), shot.dolly/orbit helpers
lib/character.js  rasterSVG(), Character (cards, face rig, hands, IK, key/rim light, shadow twin), PoseTrack, ease, solveIK2, POSE_DEFAULTS, POSES
lib/assets.js     prop() GLB loader/cloner, node(), pbr() texture-set material
productions/test-01-mailbox/       index.html, PLAN.md, QA.md, contact-sheet.png
productions/test-02-mailbox/       same
productions/antikythera-01/        index.html, main.js (shots, sound), world.js + world2.js (sets), cast.js (characters), words.js (caption cards), vo-full-tight.mp3, PLAN.md, QA.md, contact-sheet.jpg
lib/shots.js, lib/captions.js, lib/toon.js   shot dissolves, captions, toon characters (2026-11-10)
assets/fonts/fredoka-700.woff2     caption font (SIL OFL)
productions/showcase-01-watchmaker/ index.html (scene), augusta.js (SVG character art + dims), PLAN.md, QA.md, contact-sheet.png
assets/ASSETS.md                   credits (all CC0, Poly Haven)
assets/polyhaven/*.glb             13 models: WoodenTable_03, desk_lamp_arm_01, vintage_grandfather_clock_01, mantel_clock_01,
                                   alarm_clock_01 (placed 3x), wall_clock (placed 2x), wooden_bookshelf_worn, vintage_wooden_drawer_01,
                                   vintage_oil_lamp, brass_vase_01, screwdriver, pliers, hanging_picture_frame_01
assets/polyhaven/tex/*.webp        old_wood_floor, plastered_wall_04, dark_wooden_planks (diff / nor / arm)
qa/capture.js, qa/package.json     QA capture (local HTTP server, CDN routed to qa/node_modules/three)
tools/fetch-polyhaven.mjs, tools/bounds.mjs, tools/render-mp4.cjs, tools/package.json
```
Git-ignored: `qa/node_modules`, `qa/out`, `exports/` (MP4s), `tools/node_modules`, `tools/raw`.

## Problems encountered → solutions
| Problem | Solution |
|---|---|
| The owner saw a white page | A broken paste created `Index.html.` (capital I, trailing dot). Removed; file names must be lowercase. |
| jsDelivr blocked in the container | QA routes the CDN URL to `qa/node_modules/three` (0.160.0). |
| `file://` can't load ES modules or GLB | `qa/capture.js` serves the repo over HTTP. |
| Adaptive resolution dropped to 1× in warm-up (benchmark) | Ignore warm-up frames; pick the level in a pre-Start warm-up and lock it during playback. |
| Stutter in Test 01 | Pre-compile hidden objects; no resolution change during play; removed the CSS blur; audio-clock timing. |
| Camera overshoot (flew into the mailbox) and speed jumps | Monotone (Fritsch–Carlson) tangents; smoothness metric checked in QA. |
| Motion blur everywhere | Only above a speed threshold (fast whips). |
| Shared vertex-colour material turned the hero mailbox black | Give animated hero props their own materials. |
| Card characters cast thin shadows | Hidden twin rig facing the light casts the shadow. |
| Augusta 40% too big; hands hidden below the bench; arm folded | Scale 0.72; seat higher and in the work plane; IK targets on the card plane along the camera ray. |
| Lamp glow floating in front of her face | Measured the real lamp-head position with `tools/bounds.mjs`. |
| Forearm crossed her face at the ear | Outward elbow (`ikBendR` sign) and an ear point further out. |
| Saturation boost made the mat neon | Darkened the mat colour. |
| HUD showed "1 call" | `renderer.info.autoReset = false` and reset per frame. |
| Showcase too heavy | Moon shadow only on high quality (−107 draw calls). |
| MP4 render screenshots timed out at 1080×1920 | 600 s timeouts in `render-mp4.cjs`. |
| `qa/capture.js` created a folder named after an importer's `--out` | Output folder only when run directly. |
| GitHub push 403 | The owner reconnected the Claude GitHub App. |

## Notes from the Antikythera build
- **Speech-to-text:** model hosts (Hugging Face etc.) are blocked in the container. `pocketsphinx` from PyPI works offline and gave usable word timings; small words can be wrong, so ask the owner for the script text.
- **Silence removal:** `ffmpeg silenceremove=stop_periods=-1:stop_duration=0.07:stop_threshold=-38dB`.
- **`#include` in a shader string must start its own line.**
- **MP4 render speed:** about 1.4 s per frame for this scene (the full minute takes about 45 minutes).
- **Forced alignment:** with the script text, `pocketsphinx` `set_align_text` gives exact word times; add unknown words with `add_word` (e.g. "antikythera").
- **Character size:** a `ToonActor` of height 1.6 stands only about 1.2 m tall; next to furniture scale the root by about 1.4.

## Important decisions
- **Browser + Three.js only;** the phone is the renderer. No Blender, Remotion or Node on the owner's side.
- **Original characters and stories;** reference shorts are only for analysis.
- **Golden afternoon** for exterior tests; **watchmaker workshop at night** for the showcase.
- **Real CC0 models from Poly Haven** are allowed (cloud environment "animation-test" allows those hosts).
- **No more full 60 s videos until the quality showcase is approved** (owner's instruction). The showcase is the quality proof.
- MP4s are delivered as files in chat, **not committed**. The owner said the showcase MP4 export wasn't needed (it was stopped at 184/300 frames).
- Work happened on `claude/quality-standard` until 2026-11-10; the current session works on `ccr-4aca1a75-voyg75` (which includes it). The owner merges to `main`.
