# Style Guide — learned from 8 reference shorts

Studied: 8 vertical shorts (~64 s each, 720×1280, 30 fps). Method: every second of each video on contact sheets, quarter-second strips through individual shots to read the camera, close-ups of single frames, and per-frame color measurement (ffmpeg `signalstats`, every 0.5 s). This guide describes the *style* so our own original characters and stories can reach the same quality. We copy no characters, stories or artwork.

## 1. Measured color targets
| Measure (8-bit video) | References (range / typical) | Our benchmark | Target |
|---|---|---|---|
| Average saturation (SATAVG) | 23–29 (typ. 26) | **14** | 24–30 |
| Average brightness (YAVG) | 96–131 (typ. 110) | 133 | 100–120 (day), 90–100 (night) |
| Darkest 10% (YLOW) | 47–78 | 62 | 50–75: shadows are *lifted*, never crushed black |
| Brightest 10% (YHIGH) | 160–186 | 182 | 160–185: highlights stay just short of clipping |

Our benchmark was too washed out and too bright. Push saturation up, bring the mids down, and keep the shadows colored, not grey.

## 2. Color and light recipe
- **Day exteriors:** deep saturated blue sky (gradient: darker cobalt at the top, paler near the horizon) with crisp puffy white clouds. Strong warm sun, low-ish, so it casts **long, dark, blue-tinted shadows** across the ground. Grass a vivid yellow-green, dirt orange/ochre.
- **Golden hour / sunset:** orange-pink sky, backlit characters with a hot rim, long shadows pointing at the camera, dust in the air.
- **Night:** everything in deep blue/indigo, with warm orange practical lights (lamps, windows, neon), so warm light pools sit against cool shadow. Light bloom only around the lamps themselves.
- **Interiors:** warm (wood, red wallpaper, lamp glow) with a cool light coming through windows.
- **Always warm/cool contrast:** sunlit surfaces warm, shadows cool blue/purple. No neutral grey anywhere.
- **Ambient occlusion everywhere:** dark contact shading where objects meet the ground and in corners. It's what makes objects feel solid.
- **Atmosphere:** distance haze takes on the sky color, plus floating dust in light beams and soft volumetric light shafts. Mild vignette.
- **Depth of field:** close-ups blur the background strongly. Wide shots stay sharp.

## 3. World building
- The world is fully 3D, **stylized-realistic**: real proportions and real materials (wood grain, brick, metal with highlights, glass, fabric), but simplified and painterly, not photoreal.
- Dense with props that support the story: signs with readable text, posters, crates, lamps, fences, wires, plants, vehicles, crowds.
- Several depth layers in every shot: a foreground element (often blurred or close to the lens), the midground where the action is, a detailed background, then hazy far background (hills, skyline, stadium).
- Hero objects get extreme close-ups and are beautifully modelled: beveled edges, engraved details, worn paint, glints.
- Architecture is believable: proper windows with frames, trim, awnings, porches, roofs with overhangs, power lines between poles.

## 4. Characters
- **Proportions:** a very large round head (about 35–40% of total height), a small pear- or bean-shaped body, thin black line arms and legs, tiny hands, small dark shoes. Around 2–2.5 heads tall.
- **Line:** thick, slightly uneven dark brown/black ink outline on the head and body, as if hand-drawn.
- **Face:** off-white/cream skin; simple features (dot or oval eyes, thick expressive brows, small mouth). Expressions change in every shot: smug half-lidded eyes, sweat drop, wide shocked eyes, toothy grin.
- **Clothes:** saturated solid colors with texture patterns (stripes, plaid, polka-dot bow tie, overalls with stitching) and hats as identity markers (bowler, cowboy hat, cap). Each character has one signature color.
- **Integration with the world (the key trick):**
  1. Characters are **lit by the scene**: they take the warm sun tint by day, turn blue at night and get orange rim from lamps.
  2. They have **soft shading** across the head and body (a darker side away from the key light), so they read as round rather than flat.
  3. They cast **real shadows** on the 3D ground and stand on soft contact shadows.
  4. They are placed at real depth, with props in front of and behind them, sometimes partly blocked by foreground objects.
  5. They stay oriented toward the camera like illustrated cards. The camera moves around them, but they never show their thin edge.
- **Motion:** squash and stretch on reactions, quick snappy poses held for a beat, hats and accessories bounce, crowds idle-bob.

## 5. Camera language (the biggest difference from a basic demo)
- **Shots are short:** a new framing every **1–2.5 s**. Nothing holds still for long.
- **Few hard cuts.** Shots are joined by **motivated camera flights**: whip pans, fast pushes, or following a moving object (a bullet, a coin, a coaster car) from one setup to the next, plus short 0.2–0.3 s crossfades or flash-whites. The video feels like one continuous ride.
- **Constant gentle motion:** even in "static" dialogue shots the camera keeps a slow push-in or drift with easing. It's never locked off.
- **Lenses:** wide-angle (roughly 24–35 mm) close to the subject, so perspective is exaggerated: low angles make the ground stretch away, close-ups make heads bulge toward the lens. Telephoto is rare.
- **The shot vocabulary used again and again:**
  - **Crane reveal:** start on an object, rise up into a top-down aerial of the whole place, then sweep back down.
  - **Low hero angle:** camera near the ground looking up at a character, with sky behind.
  - **Extreme close-up of a key object:** a button, gauge, ledger or holster fills the frame.
  - **Over-the-shoulder/two-shot:** two characters tight together, with the background blurred.
  - **POV:** from a dashboard or coaster car, objects rushing past.
  - **Follow shot:** track alongside a moving character or vehicle, with parallax on the background.
  - **Snap zoom:** a quick punch-in on a reaction face.
- **Composition:** the subject sits in the middle band of the 9:16 frame. Captions occupy the center-lower third, so faces sit above them.

## 6. Captions
- One or two words at a time, synced to the voice, center screen slightly below middle.
- White, heavy rounded bold font, with a thick black outline and soft shadow.

## 7. Technical translation for Three.js on the Edge 50 Fusion
- **Color:** ACES filmic tone mapping, saturation boosted in a cheap final color pass (or in the materials and lights themselves), slightly lifted blacks, mild vignette.
- **Ambient occlusion:** baked into textures and vertex colors (cheap), plus soft contact-shadow blobs. Real-time SSAO is too costly here.
- **Depth of field:** for close-ups, render the background as a separately blurred layer, or use a light bokeh pass only in those shots.
- **Characters:** layered canvas-texture cards with baked shading gradient, a rim-light strip on the key-light side, and a scene tint applied each frame. Cast shadows come from alpha-tested depth materials.
- **Camera:** a shot list of keyframed camera rigs (position, target, field of view, roll) with ease-in/out, whip transitions done by fast moves with motion-blur smear, and short crossfades rendered with a two-frame blend.
