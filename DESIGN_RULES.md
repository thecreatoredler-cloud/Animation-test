# Design Rules

The owner's quality bar is **cinematic 2.5D**: stylized, illustrated cartoon people living inside detailed, believably lit 3D worlds, at the production level of the reference shorts ("Rick Clips"-style channel). This is **not** low-poly game graphics and not a Three.js demo. The full standard is `ANIMATION_STANDARD.md`, and is mandatory. Measured analysis of the references is in `STYLE_GUIDE.md`. This file condenses both and adds the decisions made since.

## Reference material (not in repo)
**8 reference shorts** were studied, each about 64 s, 720×1280, 30 fps. Titles:
- "Every Memory Has a Price" (night city, blue with warm practical lights)
- "Why the Second Draw Always Wins" (western, sunny and sunset)
- "The Town Built Around a Button"
- "How a Mirror Rigged a Horse Race"
- "Why Sailors Carried Storm Oil"
- "Why Drivers Started Filming The Road"
- "This Shape Saved Roller Coasters"
- "The Pink Prison Cell Experiment"

Never copy their characters, scenes or artwork.

## 1. Style
- **Detailed 3D environments** with real materials (wood grain, plaster, brass, glass, fabric), stylized but not photoreal.
- **Illustrated 2D characters** integrated into the 3D world: thick, slightly uneven dark ink outline (#1d1418); off-white or cream skin; big round head (about 35–40% of height); small bean-shaped body; thin ink-line limbs; tiny hands; small shoes.
  - **Each character has a signature color and an identity accessory** (cap, bun with pencil, glasses, loupe, bow tie, apron…).
- **Characters must not look like flat stickers.** They get form shading, a rim light on the light side, scene-colored tint, real cast shadows and contact shadows, and they sit at real depth with props in front of and behind them.

## 2. Environment
- **Toon look for the world (2026-11-10 study):** flat painted colours with soft gradients and **black ink contour lines** on props and architecture, not bare PBR realism. Real models are fine as a base, but they need the outline pass and flatter materials.
- **Many small vignette sets** per video, dressed only where the camera looks, each with readable signs or text.
- **Every shot has several depth layers:** foreground element (often blurred), action midground, detailed background, hazy far background.
- **Dense, story-supporting dressing:** signs and readable text, posters, lamps, wires, clutter, books, tools, background life (people, animals, birds). **No empty backgrounds.** The owner explicitly criticised Test 01's empty world.
- **Prefer real CC0 models** (Poly Haven) for furniture and props, optimized with `tools/fetch-polyhaven.mjs`. Hero story props may be built in code at high detail (pocket watch, gears, pendulum clocks). Never build a whole environment from bare boxes.
- **Correct real-world scale.** Poly Haven models are in metres. The character card scale must match: Augusta needed scale 0.72.

## 3. Lighting (highest priority)
- **Strong key light, soft fill, rim light, contact shadows, ambient, atmosphere.** Warm/cool contrast: warm key against cool shadow or rim.
- **Day exteriors:** deep blue sky, warm low sun, long blue-tinted shadows, haze toward the horizon, light rays and dust in sunbeams.
- **Night and interiors:** blue ambient with warm practical lights (lamps, windows, neon), light cones, moonbeams.
- **Characters must take the scene's light:** warm side toward the key, cooler shade, glowing rim, darker or cooler in shade.
- **Bloom only on real light sources.** Never a haze over the whole image (Test 02's bloom was too hazy).
- **Measured color targets** from the references (ffmpeg `signalstats`, 8-bit):
  - saturation (SATAVG) 23–29, typically 26;
  - brightness (YAVG) 96–131, typically 110;
  - darkest 10% 47–78 (shadows are lifted, never crushed);
  - brightest 10% 160–186;
  - warmth (VAVG) 119–135, average about 129.
  - Night reference "Every Memory": U 138, V 129, saturation 25, brightness 96.
  - Test 01 was too cool (V 118). Fix color mainly with **warmth**, not more saturation.

## 4. Camera
- **New framing every 1–2.5 s.** Never one static angle; even holds keep a slow push or drift.
- **Shots are separate set-ups, each with its own smooth move, joined without hard cuts:** 4–8 frame cross-dissolves while both shots are moving, whip + dissolve, following a moving object, pushing through a shape (photo, porthole, binoculars), and long crane reveals. A video uses **8–12 locations** and 28–35 set-ups per 60 s (STYLE_GUIDE.md section 8).
- **The vocabulary:**
  - crane from top-down into the scene;
  - low hero angle with sky behind;
  - extreme close-up insert of the key object, with shallow depth of field;
  - two-shot with background depth;
  - POV;
  - tracking shot with parallax;
  - rising orbit pull-back finale.
- **Wide lenses close to the subject.** Mix in **wider framings that show the character with the world around them.** The owner asked for the camera "a little longer" from the character at times.
- **Movement must be smooth.** Use one continuous keyframe path with monotone tangents (`lib/camera.js`). Check the speed-change metric: showcase 28 m/s² is good; above about 80 m/s² outside a deliberate whip is a problem. The owner called Test 01's stop-and-go transitions abrupt.

## 5. Character animation
- **Pose-to-pose with holds (2026-11-10 study):** strong poses changed in 2–4 frames and held 8–20 frames with a small bob, timed to the narration. Expression swaps are instant, often with a 2D effect (sweat drop, sparkle, shock lines). The face slides inside the head circle for look direction. Simple, flat character art; integration comes from scene tint and glow.
- **Hand-drawn 2D effects over the 3D scene:** flames, dust puffs, speed lines, impact bursts.
- **Ease-in/out, anticipation** (dip or lean before a move), **follow-through** (forearms, hat, bag, hair bun trail the main motion, done by lag-sampling the pose at `t − δ`), **secondary motion**, idle breathing and weight shift.
- **No sliding feet:** stride is tied to distance travelled.
- **Expressive faces:** separate eyes, lids, pupils (look-at), brows, mouth shapes; blinks; a small "pop" when an expression changes; story-timed expression beats (concentration → surprise → delight).
- **Hands have shapes** (open, pinch, grip, point) and reach objects with IK. **Objects respond:** flags spring, doors bounce, gears click and spin, watches move with the hand.
- **Avoid:** arms crossing the face, IK targets too close to the shoulder (the arm folds unnaturally), characters too low behind furniture.

## 6. Composition, pacing, storytelling
- **Subject in the middle band of the 9:16 frame;** captions (when used) in the centre-lower third.
- **Every camera move and animation must serve the story beat.** Reveal, emphasize, guide attention.
- **Captions:** one or two words at a time (about 3 words per second), white heavy rounded font, thick black outline, soft drop shadow, centred at about 70% of frame height. Words are hard-swapped at full size: **no pop scale** (corrected by the 2026-11-10 frame study).
- **Sound:** music, foley and effects synced to actions (footsteps from the walk cycle, clicks, chimes).

## 7. Rendering
MSAA, correct sRGB color management, ACES plus a per-scene grade, subtle bloom, depth of field on close-ups, motion blur only on fast moves, vignette. No noise, no oversaturation (watch for neon greens after raising saturation).

## 8. Technical bar
- 9:16 and stable on the Edge 50 Fusion.
- Expensive effects scale down automatically (high/medium/low) and manually (HUD quality button).
- Deterministic in time.
- QA with the capture tool before calling anything done.
