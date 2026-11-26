# Render benchmark report: pilot-02 (8 s, 240 frames, 1440×2560, 30 fps)

## Hardware and software (measured, `benchmarks/environment_report.json`)
- Claude Code cloud container: **4 vCPU Intel Xeon @ 2.30 GHz, 16 GB RAM, no GPU.** Renders ran here, not on the owner's computer.
- Blender 5.3.0 as the Python module (`bpy` from PyPI), **Cycles on the CPU**. EEVEE isn't viable without a GPU: it fell back to software OpenGL at 248 s or more per frame (pilot-01).

## Final settings (profile `final`, chosen by measurement)
Cycles, 4 samples (adaptive), OpenImageDenoise with **prefilter FAST, quality FAST, albedo-guided**, light tree off, 4 bounces (2 glossy, 2 diffuse), motion blur 180° shutter, DOF on, 1k HDRI, persistent data **on** (geometry is static; the cut is made at build time), PNG 8-bit at compression 0.

## Full render (iteration 6, all 240 frames, one process)
| Metric | Value |
|---|---|
| Frames rendered / failed | 240 / 0 |
| **Total render wall time** | **3,660 s = 61.0 min** |
| Mean frame time | 15.25 s |
| Median | 14.88 s |
| 95th percentile | 18.41 s |
| **Worst frames** | 175: 23.5 s · 174: 23.1 s · 176: 22.6 s · 173: 21.5 s · 177: 21.3 s (the plug turn: fast rotation × motion blur × macro DOF) |
| Peak memory | 2.2 GB |
| Assembly (Foley + captions + encode) | 55 s |
| **End-to-end** | **61.9 min** |

**Target: under 60 min. Result: missed by 1.9 min (3 %).** The prediction from 4 benchmark frames was 15.3 s/frame (actual 15.25).

## Iteration 7: re-render only the changed frames
After fixing the front-half exit and the turn transition, `render_manager.py --changed-only` compared per-frame scene-state hashes and re-rendered only the frames that changed:
| Metric | Value |
|---|---|
| Frames unchanged (skipped) | 31 (frames 1–30 and 240) |
| Frames re-rendered | 209 (31–239) |
| Wall time | 3,269 s = 54.5 min (mean 15.64 s, worst 20.9 s, down from 23.5 s thanks to the shorter turn) |
| Why so many | The front half's off-screen resting pose (frames 53–203) changed with its new exit path. The hash is deliberately conservative: an off-screen object can still change shadows and reflections, so any transform change re-renders the frame |
| Preserved | Iteration-6 frames in `renders/final_iter6_s01_padlock_v2/` (hard links), `output/pilot-02-padlock_final_iter6.mp4`, `qc/QC_final_iter6.md` |

**Projected full render with iteration-7 settings:** 31 × about 13.5 s + 209 × 15.64 s ≈ 61.5 min. The target is still missed by about 2.5 %.

## How the time was found (ablation and candidates)
Full tables are in `references/render_optimization.md`. Summary:
1. Baseline (old final: 8 samples, accurate denoise): **46.7 s/frame** → 3.1 h.
2. One-variable ablation on the slowest frame: **denoising took 16.6 s of 52.4 s**. Then light tree (5.6), procedural shaders (5.2), HDRI (5.0), area lights (4.9), motion blur (3.6). DOF, bounces and adaptive threshold each cost 1.5 s or less.
3. Combined candidates against a 16-sample reference at the **same resolution** (SSIM/PSNR plus 100 % crops, `scripts/image_compare.py`): chosen c6 at **15.3 s/frame, SSIM 0.976–0.991** (PSNR 34.6–41.2 dB). The visible difference at 100 % is slightly smoother micro-texture on the small brass pins. Kept: motion blur, DOF, HDRI reflections, all lights, full resolution.
4. Rejected: removing micro-bump on small parts (−0.2 s, visible change, SSIM 0.967).

## What would close the last 3 %
- The 5 worst frames (the turn) cost about 35 s above the mean in total. Shortening the fast-rotation segment, or lowering the shutter to 120° only there, would recover about 30–40 s.
- About 30 % of frames are background-dominated wide shots that could use 3 samples (not tested).
- A GPU machine. Cycles on any modern GPU is typically far faster for this scene, but that is **not measured**: run `render_benchmark.py` there before relying on it.
