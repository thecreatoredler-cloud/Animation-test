# QA — Test 01 "The Little Red Flag"

Checked with `node qa/capture.js productions/test-01-mailbox/index.html --step 0.25` (61 frames, emulated Pixel 7). Report: no console errors, no missing assets. A playback test with sound (start, mute, pause, resume) also ran with no errors.

## Measured color (all 61 frames) vs. references
| | Saturation | Brightness | Darkest 10% | Brightest 10% |
|---|---|---|---|---|
| References (typical) | 26 (23–29) | 110 (96–131) | 47–78 | 160–186 |
| First render | 31.2 | 109.6 | 55.7 | 176.0 |
| **Final** | **28.8** | **117.5** | **58.8** | **181.2** |

## Scorecard (sections of ANIMATION_STANDARD.md)
| # | Section | Result | Notes |
|---|---|---|---|
| 1 | Visual style | PASS | Ink-outlined 2D characters inside a sunny, saturated 3D suburb; one consistent art direction. |
| 2 | Environment | PASS | 7 houses with siding, shingle roofs, trim, porches, columns, windows, shutters, chimneys, flower beds; picket fences, trees, power lines, cars, hydrant, bicycle, distant hills and water tower. Hand-built in code because Poly Haven is blocked from the build machine (allowed under section 9). |
| 3 | Characters | PASS | Rosa and Mr. Bram: layered rigs with knees, elbows, a hat and a bag that move separately; 4 and 3 facial expressions; shading and rim light computed live from the sun direction; long shadows from hidden twin rigs. |
| 4 | Lighting | PASS | Warm low sun as key, sky-blue fill, warm rim, long shadows that follow each shot, ambient occlusion baked under houses, cars and walls, distance haze, a visible sun disc. |
| 5 | Camera | PASS | 7 shots: crane reveal → flag close-up → whip pan into a tracking shot → low-angle push-in → push across the mailbox → whip pan to a two-shot → crane-out. Every move eases in and out. |
| 6 | Animation | PASS | Walk tied to the distance covered (no foot sliding), squash on the stop, anticipation and spring on the flag, the door opens and closes with bounce, the letter moves from the box to her hand, waving, secondary motion on hat and bag. |
| 7 | Rendering | PASS | MSAA, ACES tone mapping plus a saturation and lift grade (free, no extra pass), vignette, motion blur on whip pans. |
| 8 | Technical | PASS* | Single file, Three.js from the CDN, 9:16, merged geometry (few draw calls), adaptive resolution that ignores warm-up and adjusts both ways. *Phone speed is still to be measured on the Edge 50 Fusion.* |
| 9 | Production process | PASS | PLAN.md was written first and approved. |
| 10 | Quality control | PASS | 3 review rounds; problems found and fixed are listed below. |

## Fixed during QA
1. The crane opened on a rooftop. It now aims at the street and mailbox, and starts moving immediately instead of after 0.75 s.
2. The flag close-up was too tight, the "42" sign sat under the flag, and the hand was oversized. Re-framed, sign moved, hand scaled down.
3. A tree trunk blocked the tracking shot. Tree moved.
4. The sky read as night: it was too dark, and the dust looked like stars. Sky brightened; dust made smaller, lower and fainter.
5. The mailbox shot cut off Rosa's head. The camera pulls back behind the fence, which also adds a foreground layer.
6. A power pole sat in the middle of the final shot. Poles moved.
7. Saturation overshot (31 → 28.8). Character rim light was too weak (raised).
8. The two-shot cropped Rosa's face. Re-framed and widened.
9. Code fixes: the mailbox door opened inward, the shadow twins faced the wrong way, the hat sat too high, and the hand insert was rotated the wrong way.

## Known limits (honest)
- **No depth-of-field blur on close-ups yet.** The references blur the background in close-ups; a cheap version can come next.
- **Characters always face the camera**, like the references, so the over-the-shoulder shot became a three-quarter shot across the mailbox.
- **Sound** is synthesized and can't be heard in this test environment. It runs without errors, but its quality needs a listen on the phone.
- **Real frame rate** needs to be measured on the phone (results card at the end).
