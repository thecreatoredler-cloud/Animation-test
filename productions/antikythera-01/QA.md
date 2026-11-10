# QA — "The Ancient Computer Found Underwater", part 1 (10.4 s)

Capture: `node qa/capture.js productions/antikythera-01/index.html --step 0.25` on 2026-11-10 (software GPU). 42 frames, contact sheet in this folder.
**Console errors: none. Missing assets: none.**

| # | Section | Result | Note |
|---|---|---|---|
| 1 | Visual style | PASS | Toon world with ink contour lines, original 2D characters, one art direction across three locations. |
| 2 | Environment | PASS | Seabed (wreck, 19 amphorae, bust, bronze arm, weeds, fish, bubbles, shafts), boat with working gear, island with village, windmill, chapel, jetty, sign. Readable text on hull, crate and sign. |
| 3 | Characters | PASS | Captain and diver keep their look in every shot; three poses each, hard-swapped on the words. Weakness: only pose swaps and a small bob, no in-between motion. |
| 4 | Lighting | PASS | Cool seabed against the gold gear glow; warm sun then cold storm with lightning; lit windows and lantern at the island. Weakness: seabed light shafts are faint. |
| 5 | Camera | PASS | Six set-ups, each moving, joined by 6–9 frame dissolves. Dive, close-up, low 3/4 hero, two-shot, aerial crane, foreground sign. |
| 6 | Animation | PASS | Gears light and turn on "computer"; fish recoils; boat rides the swell; sail, flag, windmill, sign boards and rain move; weather turns on "hide" and strikes on "storm". |
| 7 | Rendering | PASS | MSAA, ACES + grade. Measured on the MP4: brightness 128, saturation 24, warmth (V) 119, darkest 10% 66, brightest 10% 178. All inside the reference ranges; brightness and warmth sit at the edge (bright, slightly cool). |
| 8 | Technical | **NOT MEASURED** | 9:16, deterministic `__seek`, quality levels and HUD present. Phone frame rate is unknown until the owner runs it. Dissolve frames render the scene twice. |
| 9 | Process | PASS with a note | PLAN.md was written before the build, but the owner asked for the video directly, so the plan was not approved first. |
| 10 | Quality control | PASS | Every shot checked on the contact sheet and on single frames. Fixed during QA: blown-out gear glow, mirrored hull text, sign out of frame, fish out of frame, characters under the caption, ink lines on blurred background, cool grade. |

## Sound
Voice-over in front at about −13.4 LUFS overall (reference about −14). Synthesized bed: underwater drone and bubbles, gear ticks and chime, whoosh, waves, gulls, wind, rain, thunder on the lightning, light plucked ostinato. Not listened to by a person yet.

## Known weaknesses (not fixed)
- Narration wording was transcribed by an offline recogniser; "the" / "near a" in the captions are best guesses.
- The lightning frame at 7.25 s is close to white for 2 frames.
- Storm frames in shot 4 are pale; the dark-cloud layer reads as a flat grey.
- Wreck hull planking is simple; the marble bust and bronze arm are small in frame.
