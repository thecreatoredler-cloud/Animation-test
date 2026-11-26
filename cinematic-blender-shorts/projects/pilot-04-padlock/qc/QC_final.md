# QC report: pilot-04-padlock (final)

Contact sheet: `qc/contact_final.jpg`

## Automatic checks

| Check | Result | Note |
|---|---|---|
| Frames: complete, readable, 9:16, no black/frozen/flicker | FIX | s01_padlock_v4: temporal spike at 0018.png (change 58.3 vs typical 4.6); s01_padlock_v4: temporal spike at 0074.png (change 54.4 vs typical 4.7) |
| Video: resolution | PASS | 1440x2560 (expected 1440x2560) |
| Video: 30 fps | PASS | 30/1 |
| Video: audio track present | PASS | 1 audio stream(s) |
| Motion: camera never parked (still fraction <= 0.33) | PASS | still 0.02 |
| Motion: zoom rate in reference range 0.25-2.00 %/frame | PASS | mean |zoom| 1.312 %/frame, in 0.39 / out 0.56 |
| Motion: subject animates, not only the camera (residual >= 4 px/s) | PASS | residual 26.5 px/s |

## Manual checks (fill in after looking at the contact sheet and the video)

| Check | Result | Note |
|---|---|---|
| Subject reads instantly in the first second (hook) | ? | |
| Materials convincing (no plastic CG look) | ? | |
| Lighting: key/fill/rim, soft defined shadows, no clipped highlights | ? | |
| Environment has foreground/mid/background depth | ? | |
| Camera moves have purpose, no jumps | ? | |
| Animation: eased, anticipation/follow-through, contacts correct, no intersections | ? | |
| Attachments follow their surfaces | ? | |
| Captions readable, synced, inside safe area | ? | |
| Sound synced to visual events, layered, no clipping | ? | |
| Matches reference visual mode | ? | |
