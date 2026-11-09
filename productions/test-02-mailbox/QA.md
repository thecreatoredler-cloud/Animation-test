# QA — Test 02

Checked with `node qa/capture.js productions/test-02-mailbox/index.html --step 0.25`: 61 frames, emulated Pixel 7, full quality. Report: **no console errors, no missing assets.**

## Color (all 61 frames) vs. the references
| | Warmth V | Saturation | Brightness | Darkest 10% | Brightest 10% |
|---|---|---|---|---|---|
| References | 119–135 (≈129) | 24–29 | 96–131 | 47–78 | 160–186 |
| Test 01 | 118 | 28.6 | 117.5 | 58.8 | 181.2 |
| **Test 02** | **125.6** | **24.8** | **113.5** | **57.8** | **185.7** |

## Camera smoothness (path sampled at 30 fps)
| | Largest speed change | Frames with an abrupt change (>60 m/s²) |
|---|---|---|
| First build | 150 m/s² | 24 |
| **Final** | **80 m/s²** | **11** — all inside the two deliberate whip pans, which carry motion blur |

## Scorecard
| # | Section | Result | Notes |
|---|---|---|---|
| 1 | Visual style | PASS | Golden-hour suburb, ink characters lit by the scene, consistent art direction. |
| 2 | Environment | PASS | Four rows of houses, distant neighborhood, hills with trees, church, water tower, garage and hoop, swing set, hedges, gnome, 9 mailboxes, bins, lamps, signs, 5 cars, power lines, birds, plus a kid on a bike, a jogger, a neighbor watering and a dog. No empty backgrounds. |
| 3 | Characters | PASS | Same designs as Test 01; better walk, follow-through, anticipation, expression pops, idle motion. |
| 4 | Lighting | PASS | Low amber key light with long shadows, blue fill, glowing rim, shade detection, light rays, sun glow and flare, bloom. |
| 5 | Camera | PASS | One continuous path; wide, medium and close framings; orbit and whip moves; background blur on the close-up. |
| 6 | Animation | PASS | No foot sliding (stride tied to distance), anticipation, follow-through, props react (flag, door, letter, bike wheels, hose water, dog tail). |
| 7 | Rendering | PASS | MSAA, bloom, depth blur, motion blur only on fast moves, warm grade inside the reference range, vignette. |
| 8 | Technical | PASS* | Warm-up picks the quality and locks the resolution; no allocations in the frame loop; time locked to the audio clock. *Real phone FPS still to be measured.* |
| 9 | Production process | PASS | PLAN.md written; the owner approved the plan. |
| 10 | Quality control | PASS | 4 review rounds; fixes listed below. |

## Fixed during QA
1. The camera overshot keyframes and flew into the mailbox at 3 s. Overshoot-free curves now prevent this.
2. Motion blur fired on almost every move. Limited to fast whips.
3. Speed jumps in the whip-orbit (150 → 80 m/s²). Softened tangents, and the whip got 0.17 s more.
4. The opening crane started from a standstill. It now starts already moving.
5. The hero mailbox post and handle would have rendered black (a material shared with the merged town). Given its own materials.
6. The kid floated below his bike seat. Raised to saddle height.
7. The loading overlay showed in QA frames. Skipped during automated capture.
8. Warmth 124.7 → 125.6 with a warmer grade; saturation kept in range.

## Known limits
- Still hand-built models: external CC0 libraries are blocked from the build machine.
- The phone's real frame rate and stutter must be checked on the Edge 50 Fusion. The results card now also counts frames over 33 ms ("hitches") and shows the quality level chosen.
