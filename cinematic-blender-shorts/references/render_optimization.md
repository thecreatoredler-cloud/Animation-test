# Render optimisation: measured, not guessed

Measured hardware: this Claude cloud container. 4 vCPU Intel Xeon @ 2.3 GHz, 16 GB RAM, **no GPU**. Blender 5.3 as the `bpy` module. Raw data: `benchmarks/performance_logs/benchmarks.csv` and `benchmarks/render_tests/s01_padlock/*/render_log.csv`.
Test scene: pilot-01 padlock (procedural, 3 animated exact booleans, about 30 objects, sun plus 2 area lights, sky world, DOF, motion blur). Frame 110 is the slowest (macro cutaway).

## 1. Engine comparison at 1440×2560
| Engine | Settings | Frame 1 | Frame 110 | Frame 240 | Verdict |
|---|---|---|---|---|---|
| EEVEE (software GL, llvmpipe) | 48 samples | 247.9 s (includes shader compile) | — | — | Frame 60 was still rendering after 300 s (stopped). **Unusable without a GPU** |
| Cycles CPU | 32 samples | 72.0 s | 92.6 s | 70.9 s | 27 h for a 40 s video |
| Cycles CPU | 16 samples | 36.2 s | 47.2 s | 37.0 s | 14 h for 40 s |
| Cycles CPU | **8 samples + OIDN** | — | **28.1 s** | — | Chosen (see §3) |

EEVEE is only a choice on a machine with a real GPU. Re-benchmark it there with `render_benchmark.py --configs eevee_final`.

## 2. One-variable ablation (frame 110, Cycles 16 samples, 1440×2560, baseline 49.3 s)
| Change | Time | Δ | Keep the feature? |
|---|---|---|---|
| Denoising off | 46.6 s | −5 % | Keep denoising: 3 s buys clean 8-sample frames |
| Motion blur off | 49.5 s | 0 % | **Keep** (free; essential for realism) |
| DOF off | 51.2 s | +4 % (noise) | **Keep** (free) |
| Bounces 4 → 2 | 48.7 s | −1 % | Not worth the light loss |
| Threads fixed at 4 | 49.6 s | 0 % | Default is already optimal |
| **Samples 16 → 8** | **28.1 s** | **−43 %** | **Yes** (quality equal at 100 % crop) |
| **Resolution 1440 → 1080** | **28.0 s** | **−43 %** | Fallback for long videos |

**Bottleneck found: pixel × sample count.** About 2.65 s per sample per frame plus about 7 s fixed per frame (scene sync, booleans, denoise, PNG write) at 1440×2560. Lights, bounces, DOF and motion blur are not the cost in this scene class. That is different from the tutorial, where volumetrics and fake lights were the bottleneck. **So measure every new scene class** (`render_benchmark.py`), especially anything with volumes, transparency, hair or particles.

## 3. Quality check of the cheap settings
A 100 % crop of frame 110 (pins) compared 16 samples at 1440, 8 samples at 1440, and 16 samples at 1080 upscaled. They are visually equivalent. 8 samples shows very slight denoiser smoothing of the micro-texture on the pins, invisible at phone size. 1080 upscaled is marginally softer.

## 4. Feasibility (budget 9 h, 20 % reserve → 7.2 h usable)
s/frame for the final profile = (16-sample time − 7 s fixed) / 2 + 7 s fixed. Frame 110 is measured; frames 1 and 240 are projected the same way. Mean ≈ **24 s/frame**. `final_fast` ≈ 0.57× → **≈ 14 s/frame**.
| Video | Frames | `final` (1440, 8 samples) | `final_fast` (1080 → 1440) |
|---|---|---|---|
| 30 s | 900 | **6.0 h ✔** | 3.4 h ✔ |
| 40 s | 1,200 | 8.0 h ✘ (over 7.2, under 9) | **4.6 h ✔** |
| 45 s | 1,350 | 9.0 h ✘ | **5.2 h ✔** |
| 60 s | 1,800 | 12 h ✘ | 6.9 h ✔ (no slack) |

These are **projections for this pilot's complexity on this 4-vCPU container.** A heavier scene (characters, hair, big sets) costs more; re-measure about 12 frames across the real shots before promising a deadline. The owner's computer has not been measured. Run `python3 scripts/check_env.py --render-test` and `render_benchmark.py` there.

## 5. Rules
1. Always use Cycles on CPU-only machines. Use `preview` for stills, `review` (720p, 8 samples, about 5 s/frame) for full-motion checks, and `final` only after approval.
2. Benchmark about 12 frames spread across shots before the final render. Use the slowest frame plus the mean for the projection.
3. Before lowering resolution, try samples 8 + OIDN, then adaptive threshold 0.05. Use `final_fast` when the projection is still over budget.
4. Render one shot at a time. `render_manager.py` skips finished frames, so a crash or a fix costs only the frames that changed.
5. Watch for per-frame fixed cost: animated exact booleans re-evaluate every frame. Keep cutters to the few objects that need them, and apply static booleans at build time (the pilot does this).
6. **Persistent data is OFF by default.** With it on, a sequential render of the pilot reused stale geometry from the animated booleans. Frames 162–200 lost their chamber walls (they rendered black), yet each one rendered fine on its own. Off costs about 17 % (7.6 vs 6.5 s per review frame) but makes every frame equal to a fresh render. QC's temporal-spike check now catches this class of bug (it flagged exactly frame 162).
7. Volumes, emission-heavy "fake light" and transparency haven't been measured yet. Benchmark them before using them, as the tutorial did.

## Pilot-02 (outdoor HDRI, image textures, metal-in-metal cutaway): target under 60 min for 240 frames at 1440×2560
Full data: `benchmarks/BENCHMARKS.md`. One-variable ablation on frame 165 (8 samples, single frame, so it includes about 5 s of first-frame load):
| Variant | s | Δ vs 52.4 |
|---|---|---|
| no denoise | 35.8 | **−16.6** |
| denoise prefilter FAST + quality BALANCED | 39.7 | **−12.7** |
| simple shaders (no procedural noise) | 47.2 | −5.2 |
| no light tree | 46.8 | −5.6 |
| no HDRI (flat world) | 47.4 | −5.0 |
| no area lights | 47.5 | −4.9 |
| no motion blur | 48.8 | −3.6 |
| glossy bounces 1 / bounces low / no DOF / adaptive 0.05 | 50.9–52.3 | ≤ −1.5 |
**Bottleneck: OIDN at 3.7 MP on 4 cores (accurate prefilter), then sampling.** Combined candidates (sequences, steady state) against a 16-sample reference:
| Candidate | Steady s/frame | Worst | SSIM vs s16 |
|---|---|---|---|
| s8, accurate denoise (old final) | 46.7 | 50.6 | 0.987–0.989 |
| c1 s8, fast/balanced denoise | 34.3 | 38.0 | 0.984–0.986 |
| c3 s6, fast denoise, no light tree | 23.7 | 26.2 | 0.981–0.984 |
| c2 s4, fast/balanced, no light tree | 17.3 | 19.1 | 0.978–0.982 |
| c4 s4, fast/fast, no light tree | 16.2 | 18.0 | 0.977–0.980 |
| c5 c4 + PNG level 0 + albedo-only denoise | 15.7 | 17.5 | 0.976–0.991 |
| **c6 c5 + 1k HDRI (chosen `final`)** | **15.3** | **16.8** | **0.976–0.991** |
| c7 c6 − micro-bump on small parts | 15.1 | 17.3 | 0.967 (rejected: look changed) |
