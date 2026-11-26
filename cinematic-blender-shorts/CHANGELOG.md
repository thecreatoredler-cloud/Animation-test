# Changelog

## 2026-11-25: first build (one session)
### Phase 1: reference analysis
- `analyze_reference.py`: shot cuts (histogram plus luma, merges micro-shots), per-shot camera move, zoom %/frame, pan, stillness, subject (residual) motion. **Validated**: 0.536 vs the tutorial's 0.541 %/frame on "How Stitches Work".
- `references/zach_visual_analysis.md` (18 Shorts, measured table, 5 visual modes, 22 screenshots) and `tutorial_workflow_analysis.md` (11-step loop, 9 adopted rules; speech not transcribable here).

### Phase 2: environment and research
- Headless Blender via `pip install bpy==5.3.0` (the Blender download site is blocked here); Mesa GL libraries for EEVEE.
- `check_env.py` report. `research_sources.md`: primary sources (contributor portfolio, job listing) and a tool-by-tool verdict.
- Network: switched to the owner's `animation-test` environment; added ambientCG and its download host plus the two research hosts.

### Phase 3: foundation
- `blender_setup.py` (scene reset, AgX colour, profiles), `lighting_tools.py` (sky backdrop with camera-ray split, daylight/low-key rigs, HDRI), `camera_tools.py` (eased baked segments, orbit with moving centre, drift, zoom-rate helper), `materials.py` (procedural metal, wood, skin, tissue, plastic, glass, PBR sets), `scene_builder.py` (builders plus the per-shot build CLI), `asset_manager.py` (Poly Haven and ambientCG with a licence registry).

### Phase 4: animation library
- `animation_tools.py`: spring, slide (anticipation/settle), hinge (anticipation/overshoot), turn, drop_settle (physical bounces plus squash), pop, wobble, sway, shape-key and property ramps, `bake()` for mechanism functions.

### Phase 5–6: pipeline and performance
- `render_manager.py` (resume, skip done, per-frame time and memory log, `--set` experiments), `render_benchmark.py` (configs plus 9 h feasibility), `audio_tools.py` (synthesised four-layer SFX, reverb by shot size, −3 dBFS master), `video_assembler.py` (concat, libass captions, grain/vignette/sharpen, audio, H.264), `quality_control.py` (frame/video/motion checks, contact sheet, manual checklist).
- Benchmarks: EEVEE without a GPU is unusable (248 s+ per frame); Cycles 16 samples is 36–47 s. Ablation shows cost ∝ pixels × samples; DOF, motion blur, bounces and threads are free. **Final profile changed to 8 samples + OIDN** (28 s on the slowest frame, equal quality at 100 % crop). Added `final_fast` (1080 → 1440).

### Phase 7: pilot-01 (8 s padlock)
- v1 (EEVEE preview): shackle not cut (blocked the pins), gold-looking brass, orange wood, table ending in front of the lens. All fixed in v2.
- v2 → Cycles: radial streaks on cut faces from smooth-shaded boolean fans, fixed by flat-shading the cutter.
- Camera segment jumps fixed by `center1` continuity.
- Review pass v1 manual QC: frames 162–200 had black chamber interiors. Root cause (tested): Cycles persistent data plus animated booleans. Fix: persistent data off by default (+17 % time). Added a QC temporal-spike check, which detects the defect automatically.
- Light objects renamed KeyLight/FillLight/RimLight (avoids name clashes with scene objects).

### Phase 8: skill packaging
- SKILL.md (frontmatter validated, all referenced paths exist), README, templates/project_template (PLAN.md, project.json, shot skeleton).
- Fresh-agent test: built and rendered a new shot from SKILL.md alone. Its gaps were fixed: generated `references/api_quickref.md` (`gen_api_ref.py`), explicit template steps, a library gotchas list, a `BLENDER_PY` line from `check_env.py`, `sb.sphere()`, and Cycles as the default engine.

## 2026-11-26: pilot-02 (padlock v2) and production-system upgrades
- **Diagnosis** of v1 with new `audio_analysis.py` (BS.1770 LUFS, true peak, onsets, spectrogram): noise beds masked 11 of 12 clicks; sub-bass impacts; a wrong mechanism layout; a beige section block; frontal framing; captions before the visual.
- **New shot** `s01_padlock_v2`: researched mechanism (bottom keyway, cam + locking balls + shackle spring); one-plane half-section; static cut piece that lifts away and returns (`split_by_box`); padlock hanging on a shed-door hasp (Poly Haven CC0 planks + garden HDRI); the body drops and swings on release.
- **Animation:** `spring_follower` (contact physics, click events), `pendulum`, driver-derived release logic, per-part timing.
- **Camera:** rack focus (`Seg(focus=...)`), the tested 6-segment mechanism progression.
- **Sound:** `foley.py`, modal synthesis driven by animation events, with friction damping and detuned variants (fixed the tonal hum), one master gain, true-peak limiter with gain-reduction logging, `mute` for visual devices.
- **Rendering:** `render_ablation.py` (bottleneck: OIDN at 16.6 of 52 s), `image_compare.py` (SSIM/PSNR plus crops). New `final` profile is 4 samples, fast albedo-guided OIDN, light tree off, PNG 0 (15.25 s/frame measured over 240 frames, 61.0 min). `final_hq` keeps the old settings. `--changed-only` re-renders by per-frame state hash.
- **Captions:** `*emphasis*` in gold; `"pos": "top"` when the action sits low in frame.
- **Iteration 7:** faster front-half exit (pins visible at 1.6 s), shorter turn transition (worst frame 23.5 → 20.9 s), captions moved after the visual and off the action.
- **Docs:** LESSONS_LEARNED.md (29 lessons), BENCHMARKS.md (renamed), and guide updates. SKILL.md marked DRAFT at the owner's request.
