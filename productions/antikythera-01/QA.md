# QA — "The Ancient Computer Found Underwater" (full video, 60.4 s)

Capture: `node qa/capture.js productions/antikythera-01/index.html --step 0.25` on 2026-11-10 (software GPU). 242 frames. `contact-sheet.jpg` in this folder shows every half second (label = seconds).
**Console errors: none. Missing assets: none.**

| # | Section | Result | Note |
|---|---|---|---|
| 1 | Visual style | PASS | One toon look with ink lines across all 33 set-ups; original 2D characters. |
| 2 | Environment | PASS, uneven | Seabed, boat and island are well dressed. The part-2 sets (museum, workshop, lab, Olympia, Athens, hill of eras) are simpler: fewer props and background layers than part 1. Readable text in most locations (hull, sign, calendar, banners, crate, manual, year board). |
| 3 | Characters | PASS | Nine original characters, consistent between shots. All are pose swaps with a small bob; no in-between motion. |
| 4 | Lighting | PASS, uneven | Strong contrast between scenes (dark green seabed, night storm, warm workshop, black stage with gold, cold lab, sunset finale). Room shots are flatter than the exteriors; museum and workshop lean orange. |
| 5 | Camera | PASS | Every set-up moves; 6-frame dissolves; dive, follow, pan, close-ups, aerials, orbit, rising pull-back finale. |
| 6 | Animation | PASS | Beats land on the words: gear glow on "computer", lightning on "storm", statues revealed on "They were statues", shoebox drop, calendar flips, gear burst on "thirty", Sun/Moon/planets on their words, flag drop on "start", truck brake on "Athens", manual pop. |
| 7 | Rendering | see numbers below | MSAA, ACES + grade, bloom only on glowing things. |
| 8 | Technical | **NOT MEASURED** | 9:16, deterministic `__seek`, quality levels and HUD present. Phone frame rate and loading time are unknown. Eight sets are built at start, so loading will be longer than part 1, and dissolve frames draw the scene twice. |
| 9 | Process | PASS | PLAN.md part 2 written before the build; the owner asked for the rest of the video directly. |
| 10 | Quality control | PASS | Every set-up checked on contact sheets and single frames. Fixed during QA: characters hidden behind tables (too short), orange room lighting, gear burst out of frame, eclipse white-out, runners and scientists out of frame, bright water surface in the dark seabed shot, finale caption covering the lump. |

## Measured on the MP4 (1080×1920, 60.4 s)
| Measure | This video | Reference range (typical) |
|---|---|---|
| Brightness (YAVG) | 120 | 96–131 (110) |
| Saturation (SATAVG) | 26 | 23–29 (26) |
| Warmth (VAVG) | 128 | 119–135 (129) |
| Darkest 10% | 69 | 47–78 |
| Brightest 10% | 170 | 160–186 |
| Loudness | −13.6 LUFS | about −14 LUFS |

Section 7 (Rendering): **PASS** on these numbers.

## Known weaknesses (not fixed)
- Characters do not walk or move between poses.
- Part-2 sets are sparser than part 1; Athens and Olympia use simple block buildings.
- The diver-descending shot has a plain blue background.
- The ancient ship is dark against the night sea.
- In the hill-of-eras shot the third era (clock tower) arrives only at the very end.
- Sound mix is synthesized and has not been listened to by a person.
- Phone performance is unmeasured.
