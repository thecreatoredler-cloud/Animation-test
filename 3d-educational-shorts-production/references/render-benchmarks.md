# Render benchmarks (measured, never assumed)

All numbers come from the source project's real renders. **Hardware: Claude Code cloud container, 4 vCPU Intel Xeon @ 2.3 GHz, 16 GB RAM, no GPU; Blender 5.3.0 (bpy module), Cycles CPU.** Different hardware gives different numbers: re-measure with `render_benchmark.py` (about 5 representative frames, as a sequence) before promising a deadline.

## Engines
| Engine | Measured | Verdict |
|---|---|---|
| EEVEE (software GL, no GPU) | 248 s first frame, over 300 s second (1440×2560) | Unusable without a GPU |
| Cycles CPU | 13–16 s mean per 1440×2560 frame with the `final` profile | Use it |
| Any GPU | **not measured** | Benchmark before relying on it |

## Full productions (240 frames, 8 s, 1440×2560, 30 fps)
| Scene | Profile | Mean / median / worst s per frame | Total render | Notes |
|---|---|---|---|---|
| Padlock v2 (outdoor HDRI, textures, metal cutaway) | final | 15.25 / 14.9 / 23.5 | 61.0 min | first full run |
| Padlock v3 (+keyring, glow, grazing fill) | final | 14.4 / 13.9 / 21.0 | **57.6 min** | resumed after a container restart (no re-render) |
| Padlock v4 (establishing wide shot + more beats) | final | (see `lessons-learned.md` once measured) | | |
Assembly (Foley, captions, H.264): about 55 s. Peak RAM: 2.2 GB.

## Where the time goes (padlock v2, single frame 165 at 8 samples, 52.4 s)
Denoising **16.6 s** (accurate prefilter at 3.7 MP) · light tree 5.6 · procedural shaders 5.2 · HDRI 5.0 · area lights 4.9 · motion blur 3.6 · DOF/bounces/adaptive ≤ 1.5 each.
Pilot-01 (simpler scene): time ≈ pixels × samples (7 s fixed + 2.65 s per sample at 1440×2560).

## Quality vs cost (same resolution, vs 16-sample reference)
| Settings | s/frame | SSIM |
|---|---|---|
| 16 samples, accurate denoise (reference) | 77.6 | 1 |
| 8 samples, accurate | 46.7 | 0.987–0.989 |
| **4 samples, fast albedo denoise, light tree off, PNG 0, 1k HDRI (`final`)** | **15.3** | **0.976–0.991** |

## Budget planning
frames = seconds × 30. Budget hours × 0.8 (20 % reserve) / frames = ceiling s/frame.
At about 15 s/frame on 4 vCPU: 8 s ≈ 1 h · 30 s ≈ 3.8 h · 45 s ≈ 5.6 h. With `final_fast` (1080→1440 upscale) about 0.57× that.
Blockout previews (360×640, 8 samples): about 1.5–3 s/frame.
