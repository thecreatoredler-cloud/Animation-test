# QA — Showcase 01 "The Watchmaker"

Checked with `node qa/capture.js productions/showcase-01-watchmaker/index.html --step 0.25`: 41 frames, emulated Pixel 7, full quality, served over HTTP. Report: **no console errors, no missing assets.** A Playwright UI test passed with no errors:
- Start and Pause work;
- the HUD shows;
- the quality button cycles high → medium → low → high.

## What was measured here (software GPU — real phone speed is NOT measured yet)
| Check | Result |
|---|---|
| Camera smoothness (largest change in camera speed, 30 fps) | **28 m/s²** (Test 02: 80, Test 02 first build: 150) |
| Frame cost, high quality (HUD, whole frame including shadow and post passes) | 463 draw calls, 453k triangles |
| Frame cost, medium/low (moonlight shadow off) | 356 / 349 draw calls, 299k triangles |
| Download size of the scene's models and textures | about 6.3 MB |

## Color vs the night reference ("Every Memory Has a Price")
| | Blue U | Warm V | Saturation | Brightness | Darkest 10% | Brightest 10% |
|---|---|---|---|---|---|---|
| Reference | 138.1 | 129.0 | 25.2 | 96.1 | 46.7 | 161.8 |
| First build | 123.6 | 131.9 | 19.3 | 88.2 | 39.3 | 168.0 |
| **Final** | **126.0** | **129.8** | **23.3** | **88.9** | **39.5** | **168.2** |

Warmth matches. Saturation is close. The image is still a bit darker, more contrasty and less blue than the reference. That's partly deliberate: the warm lamp-lit bench is the subject. A brighter, bluer try (+0.95 ambient, lifted blacks) washed the picture out (saturation 16.4), so it was reverted.

## Scorecard (ANIMATION_STANDARD.md)
| # | Section | Result | Notes |
|---|---|---|---|
| 1 | Visual style | PASS | Illustrated character with ink outlines inside a real, textured 3D room. |
| 2 | Environment | PASS | 15 Poly Haven models (bench, lamp, 7 clocks, bookshelf, cabinet, oil lamp, vase, tools, frame) with real PBR textures; plaster, wainscot and wood-floor texture sets; 3 code-built pendulum clocks; 54 books; a window onto a night street; foreground pocket watches; doorway frame. |
| 3 | Character | PASS | Layered SVG at 2× resolution. The face rig has separate eyes, lids, pupils, brows, 6 mouths and a flip-up loupe showing a magnified eye. 4 hand shapes. IK reaching. Bun follow-through. Shadow from a twin rig. |
| 4 | Lighting | PASS | Warm lamp spotlight with shadow as key; cool moon as rim and fill (shadow on high); practical glows (bulb, oil lamp, street lamp); lamp cone and moonbeam; dust; the character lit by key and rim in screen space. |
| 5 | Camera | PASS | Four shots on one continuous path: doorway dolly-in, close-up insert with depth of field, low-angle medium, rising orbit. |
| 6 | Animation | PASS | Anticipation before the gear move and the lift; slow precise drop; recoil at the click; expression changes with pops; blinks; the loupe flips up with overshoot; pendulums start one by one; clock hands tick; delighted bounce that settles. |
| 7 | Rendering | PASS | MSAA, ACES with a per-scene grade, bloom on light sources only, depth of field, motion blur only on fast moves, vignette. |
| 8 | Technical | PASS* | Shared modules in `lib/`; warm-up picks the quality level; a manual quality button; medium/low drop depth of field and the moon shadow. *Real phone FPS unknown — this is the heaviest scene so far.* |
| 9 | Production process | PASS | PLAN.md written; the owner approved the scene and assets. |
| 10 | Quality control | PASS | 6 review rounds; fixes below. |

## Fixed during QA
1. **Character scale:** Augusta was about 40% too big for real-scale furniture. Scaled to 0.72.
2. **Hands couldn't reach the work:** she sat too low (shoulders 17 cm above the bench) and too deep behind it, so in the close-up her hands were hidden below the bench top. She was raised and moved forward. IK targets are now projected onto her card plane along the camera ray, so the tweezers land exactly on the gear on screen.
3. **Light source:** the "bulb" and spotlight floated in front of her face. Moved into the real lamp head, which was found by measuring the model.
4. **Arm across the face:** lifting the watch to her ear crossed her forearm over her face. Fixed with an outward elbow and an ear point further out.
5. **Shot 3 framing:** too close. Widened.
6. **Color:** too yellow and desaturated against the night reference. Graded bluer and more saturated, then the neon work mat was toned down.
7. **HUD:** counted only the last post pass ("1 call"). Now counts the whole frame.
8. **Performance:** moonlight shadow disabled on medium/low (−107 draw calls, −155k triangles).

## Not tested / known limits
- **Phone speed:** frame rate and stutter on the Edge 50 Fusion are untested. Draw calls (~350–460) are high for a mobile GPU. If it runs slow, the next step is merging the static props into a few meshes per material, like `bakeStatic` in Test 02.
- **Sound:** synthesized; renders offline without errors, but nobody has listened to it.
- **Watch at the ear:** small and partly hidden by her hand.
- **Moonlight rim:** the rim light from the moon on her edges is subtle.
- **Character art:** illustrated by me in SVG. A professional illustrator's hand-drawn parts would raise quality the most (see the final report).
