# Render report: pilot-03 (v3), 240 frames, 1440×2560, 30 fps

**Hardware:** Claude Code cloud container, 4 vCPU Xeon @ 2.3 GHz, 16 GB RAM, no GPU. **Software:** Blender 5.3.0 (bpy module), Cycles CPU.
**Settings (profile `final`):** 4 samples, OIDN fast/fast albedo-guided, light tree off, 4 bounces, motion blur 180°, DOF, 1k HDRI, persistent data on, PNG level 0, AgX Medium High Contrast. No compositing nodes. Grain, vignette and sharpen are applied in ffmpeg at assembly.

| Metric | v2 (iteration 6) | **v3** |
|---|---|---|
| Frames / failed | 240 / 0 | **240 / 0** |
| Sum of frame times | 61.0 min | **57.6 min** |
| Mean / median s per frame | 15.25 / 14.88 | **14.4 / 13.9** |
| 95th percentile | 18.4 s | **17.5 s** |
| Worst frames | 23.5 s (175) | **21.0 s (182), 19.7 (174), 19.5 (175)**: the plug turn (fast rotation × motion blur × macro DOF) |
| Peak RAM | 2.2 GB | **2.2 GB** |
| Assembly (Foley + captions + encode) | 55 s | about 55 s |
| **Total** | 61.9 min | **≈ 58.5 min: under the 60 min target** |

**Interruption and recovery (tested for real):** the container restarted after 182 frames. Re-running the same command skipped all 182 finished frames and rendered only the remaining 58 (wall time 920 s). Nothing was lost or re-rendered. The 57.6 min figure is the sum of measured per-frame times; the restart's idle gap isn't rendering time.

**Why v3 is about 6 % faster than v2 [hypothesis, not tested]:** the shorter turn transition (from iteration 7) halves the time spent in the most expensive frames, and the grazing fill gives fewer bright mirror reflections for the denoiser to resolve.

**EEVEE vs Cycles:** EEVEE needs a GPU. Here it falls back to software OpenGL (248 s first frame, over 300 s second frame, measured on pilot-01). Cycles CPU is the only viable engine on this host. Re-benchmark on any GPU machine with `render_benchmark.py`.

**Flicker and consistency:** QC temporal-spike and flicker checks pass on all 240 frames. Quality at these settings: SSIM 0.976–0.991 against a 16-sample reference (`references/render_optimization.md`). Delivery-compression simulation: `COMPRESSION_TEST.md` (SSIM 0.967–0.981, with fine brushed texture softened).

**Workflow features used:** per-frame logs (time, RAM, status), failed-frame detection, resume and skip of completed frames (tested by the restart), `--changed-only` hash re-render (v2 iteration 7), assembly from frames, and preserved earlier versions (v2 in `projects/pilot-02-padlock`).
