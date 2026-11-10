# TODO (ordered by priority)

**Next up:**
1. **Get the owner's verdict on `productions/antikythera-01/`** (MP4 sent 2026-11-10) and the phone results card. Confirm the script wording ("the" / "near a").
2. **Continue the video** with `vo-full-tight.mp3` (10.4–60.3 s: the diver's report, the statues, the bronze lump, the gears, what it computed, the X-ray scans, the ending). Write the plan for the next part first.
3. **Improve from QA:** in-between motion for characters (anticipation, arm follow-through), stronger seabed light shafts, better storm clouds, 2D effects helper (dust, sparkles, speed lines), performance check of dissolve frames on the phone.

Done on 2026-11-10 (see CURRENT_PROGRESS.md): shot dissolves, ink outline pass, simple pose-to-pose characters, captions module, voice-over playback.

The older list follows; items 3, 5 and 7 are partly superseded by the 2026-11-10 work.

1. **Get the owner's verdict on Showcase 01.** What still doesn't match the reference look? Ask for the phone results card (FPS, 1% low, slow frames, quality level chosen).
2. **Performance pass on the showcase** if the phone results are weak.
   - Merge static props and room pieces by material (port `bakeStatic()` from `productions/test-02-mailbox/index.html` into `lib/`).
   - Exclude far props from shadow casting; lower draw calls (now 463 high / 356 medium).
   - Re-measure with the HUD.
3. **Showcase polish** (from QA):
   - make the watch at her ear readable (bigger in hand, or a brief insert);
   - stronger moonlight rim on Augusta;
   - close the remaining color gap to the night reference (brightness about 96, a bit more blue) without washing out.
4. **Port the walk cycle into `lib/character.js`.** Stride tied to distance, legs and knees, arm swing with lag, from Test 02. Then test a walking shot with the new SVG character system.
5. **Captions module in `lib/`** (one or two words, pop scale, as in Test 01/02), so new productions get it for free.
6. **Pose library expansion and reusable gestures:** wave, point, shrug, sit/stand transitions, look-at helper. Add more hand shapes if needed.
7. **Better character artwork.** Biggest visual upgrade still available:
   - more detailed clothing folds and shading in the SVG parts;
   - a 3/4 head variant for side shots;
   - more mouth and phoneme shapes for future voice-over.
   - Consider commissioning illustrated parts, or an SVG style kit.
8. **Exterior environment upgrade** using the new system: Poly Haven street props and HDRI sky, to redo the mailbox-style exterior at showcase quality.
9. **Migrate or retire the old single-file pages.** Keep Test 01/02 and `index.html` as history. Optionally fix `index.html`'s adaptive-resolution bug, or mark it legacy.
10. **Voice-over and caption sync workflow** for full videos: narration timing drives the shot list.
11. **Only after the owner approves the showcase quality:** plan the first full 60 s video with the full CLAUDE.md workflow (PLAN.md → build → QA.md → MP4).
12. **Keep the handover docs current** (maintenance rule in PROJECT_CONTEXT.md).
