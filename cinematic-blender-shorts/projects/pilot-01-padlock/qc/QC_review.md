# QC report: pilot-01-padlock (review)

Contact sheet: `qc/contact_review.jpg`

## Automatic checks

| Check | Result | Note |
|---|---|---|
| Frames: complete, readable, 9:16, no black/frozen/flicker | PASS | 240 frames checked |
| Video: resolution | PASS | 720x1280 (expected 720x1280) |
| Video: 30 fps | PASS | 30/1 |
| Video: audio track present | PASS | 1 audio stream(s) |
| Motion: camera never parked (still fraction <= 0.33) | PASS | still 0.05 |
| Motion: zoom rate in reference range 0.25-2.00 %/frame | PASS | mean |zoom| 0.822 %/frame, in 0.62 / out 0.31 |
| Motion: subject animates, not only the camera (residual >= 4 px/s) | PASS | residual 17.2 px/s |

## Manual checks (fill in after looking at the contact sheet and the video)

| Check | Result | Note |
|---|---|---|
| Subject reads instantly in the first second (hook) | PASS | padlock hero centred at frame 1, key already moving |
| Materials convincing (no plastic CG look) | PASS | brass/steel/wood with roughness variation; cut faces read as machined. Wood grain is procedural; a CC0 photo texture (Wood049) would add realism |
| Lighting: key/fill/rim, soft defined shadows, no clipped highlights | PASS | warm sun key, cool fill, rim on the shackle; contact shadow under lock; AgX, no clipping |
| Environment has foreground/mid/background depth | PASS | table foreground, lock, mug and notebook out of focus, blue gradient |
| Camera moves have purpose, no jumps | PASS | one continuous move: hero creep, arc into cutaway, macro, pull-out; segment continuity fixed |
| Animation: eased, anticipation/follow-through, contacts correct, no intersections | PASS | pins derived from the key profile (exact contact), plug anticipation, shackle spring overshoot |
| Attachments follow their surfaces | PASS | key and key pins parented to the rotating plug pivot |
| Captions readable, synced, inside safe area | PASS | 1-3 words at 76 % height, pop-in |
| Sound synced to visual events, layered, no clipping | PASS | 12 pin clicks computed from pin motion; stacked impacts at turn and shackle; peak -3 dBFS |
| Matches reference visual mode | PASS | M3 product/mechanism: blue backdrop, push-in explains, pull-out resolves |

## Known weaknesses (not blocking for an 8 s test)
- The key floats in the opening with no hand holding it (characters are not built yet).
- No narration voice (TTS models are unreachable here); the captions carry the story.
- Review render only (720p). The final 1440×2560 render is about 2 h on this container (8 s × 30 fps × about 28 s/frame) and waits for owner approval.

## History
- v1 review: frames 162–200 had black chamber interiors. Root cause: Cycles persistent data with animated booleans. Fixed, and the new QC spike check would catch it.
