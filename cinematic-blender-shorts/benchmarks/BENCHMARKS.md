# Benchmarks

## Pilot-02 (current reference scene: outdoor HDRI, image textures, metal cutaway), 4 vCPU, no GPU
| Profile | Resolution | Samples / denoise | s/frame (measured) |
|---|---|---|---|
| preview | 360×640 | 8 / accurate | about 2.5 |
| **final** | 1440×2560 | 4 / fast, albedo | **15.25 mean, 14.9 median, 23.5 worst** (full 240-frame run: 61.0 min) |
| final_hq | 1440×2560 | 8 / accurate | 46.7 mean (5-frame benchmark) |
| 16-sample reference | 1440×2560 | 16 / accurate | 77.6 mean (5 frames) |
Details: `projects/pilot-02-padlock/RENDER_REPORT.md`, `references/render_optimization.md`, `render_tests/s01_padlock_v2/*/render_log.csv`, `render_tests/ablation_s01_padlock_v2/ablation.csv`.

## Pilot-01 (older, simpler scene)

- `environment_report.json`: output of `scripts/check_env.py` (machine, Blender, libs, network).
- `performance_logs/benchmarks.csv`: one row per benchmarked frame (date, host, config, seconds, peak memory, resolution, samples, status, note). Appended by `scripts/render_benchmark.py`.
- `render_tests/<shot>/<config>/render_log.csv`: per-config logs. The images are git-ignored.
- `ablation_frame110.sh`: the one-variable-at-a-time experiment behind `references/render_optimization.md`.

## Current numbers (4-vCPU container, no GPU, pilot-01)
| Profile | Resolution | Samples | s/frame (measured) |
|---|---|---|---|
| preview | 360×640 | 8 | about 1.5 |
| review | 720×1280 | 8 | see the review log of the pilot render |
| final | 1440×2560 | 8 | 28.1 (slowest frame); mean about 24 (projected) |
| final_fast | 1080×1920 | 8 | about 14 (projected) |

Rule of thumb: Cycles time ∝ pixels × samples, plus about 7 s fixed per final frame.
