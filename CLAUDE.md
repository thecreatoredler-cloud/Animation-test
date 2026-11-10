# Animation Studio — instructions for Claude

This repository makes vertical (9:16) 2.5D animated story videos that run in Three.js in a mobile browser and are published with GitHub Pages. The owner's phone (Motorola Edge 50 Fusion, Adreno 710, Android Chrome) is the render device. Their computer is too weak to render, so never assume Blender, Remotion, Node.js or a render server on their side.

**Start of every session:** read `PROJECT_CONTEXT.md`, `DESIGN_RULES.md`, `CURRENT_PROGRESS.md` and `TODO.md` before changing anything, and keep them updated (maintenance rule in PROJECT_CONTEXT.md).

## The quality standard is mandatory

@ANIMATION_STANDARD.md

Read the standard above before every task in this repository. A scene that doesn't meet it isn't finished, however good the code is.

## Required workflow for every video

1. **Production plan first.** Before writing any scene code, create `productions/<name>/PLAN.md` with:
   - the story broken into scenes, each with its duration;
   - for each scene: environment, characters, props and the assets to use (with their sources);
   - the visual direction: palette, key/fill/rim lighting, time of day, mood;
   - the shot list: shot type, camera move and what each shot reveals or emphasizes;
   - the animation beats: character actions, facial expressions, object interactions, secondary motion.

   Show the plan to the owner and get approval before building.
2. **Build** in `productions/<name>/index.html`, loading Three.js from the jsDelivr CDN (pin the version). New productions should import the shared modules in `lib/` (see `productions/showcase-01-watchmaker/`) and may use models from `assets/`. Every page must set:
   - `window.__duration`: total length in seconds;
   - `window.__seek(t)`: pause, jump to time `t`, render that exact frame;
   - `window.__ready = true` once loaded.

   All animation must be a deterministic function of time (never of frame count), so `__seek` matches playback.
3. **QA, before saying "done":**
   1. Run `npm install --prefix qa` (once per session), then `node qa/capture.js productions/<name>/index.html --step 0.25`.
   2. Open the contact sheet and the individual frames, and look at every shot.
   3. Write `productions/<name>/QA.md`: one line for each of sections 1–10 of the standard, each marked PASS or FIX with a note. Also list every console error or missing asset from `report.txt`.
   4. Fix every FIX item, re-run the capture, and update `QA.md`. Repeat until everything passes.
   5. Send the owner the contact sheet and `QA.md`. Never report a video as complete without them.
4. **Performance.** The QA capture uses a software GPU, so its frame rate is meaningless. Real speed is measured on the phone: keep the benchmark HUD (FPS, 1% low, resolution, GPU) available in every production, and ask the owner for the numbers.

## Technical rules
- Use the latest stable Three.js through an import map, with no build step (GitHub Pages serves files as they are).
- Default resolution is up to 2× device pixel ratio. Only lower it after the first 30 frames, only on sustained slowness, and raise it again when speed recovers.
- External 3D assets must be browser-loadable (GLTF/GLB, KTX2/JPG/PNG textures) and licensed for reuse (CC0 preferred). Record each asset's source in `PLAN.md`.
- Characters and stories are original. Match the production quality of the reference channels, but never copy their characters, art or episodes.
- File names are case-sensitive on GitHub Pages: use lowercase, with no trailing dots or spaces.
