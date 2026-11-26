# Lighting, materials and rendering

## Lighting (tested lessons)
1. **Key, fill and rim, motivated by the place:** sun or window, sky or bounce, rim to separate the subject.
2. **Never put a big uniform light on the axis of flat metal facing the camera.** The metal mirrors it as flat cream or plastic. The padlock section went from sat 29 %, val 85 % (fill mirrored) to sat 86 %, val 29 % with the fill grazing low-left. Use **grazing fills plus a weak (about 12 %) front fill**, or gradient cards.
3. **Probe before you edit shaders:** `render_ablation.py` variants (`fill_off`, `fill_moved`, `sun_off`, `exposure_m07`, `look_none`, `section_dark`, …). Three plausible causes were tested and disproved before the real one was found.
4. HDRI for reflections (Poly Haven CC0). **1k is enough** behind DOF: 2k cost +0.4 s/frame.
5. No volumetrics by default. Aerial perspective via `add_distance_haze` (camera distance → haze colour), at about zero cost.
6. Colour: AgX with the Medium High Contrast look. A camera-ray split world keeps an art-directed backdrop colour exact.

## Materials
- Procedural metals, wood, skin and tissue in `materials.py`, all with **roughness variation** (uniform roughness looks CG).
- Metals: the base colour *is* the reflectance. Bright flat metal mirrors whatever is in front of it, so check what it sees.
- Bevel every hard edge that's seen close (0.1–0.2 mm at object scale). Razor 90° edges read as paper or plastic.
- Section faces use **the same alloy with a finer finish**, never a different colour.
- Small macro parts need real proportions (5 open spring coils, not 8 tight ones).
- PBR texture sets: `image_pbr(color, rough | arm, normal, tint=)`, box-projected (no UVs needed).

## Render engine choice (measured on 4 vCPU, no GPU)
| Engine | Result |
|---|---|
| EEVEE (software GL fallback) | 248 s first frame, over 300 s second: **unusable without a GPU** |
| **Cycles CPU** | Viable. Cost ≈ pixels × samples plus a fixed part (denoise, sync) |
On a GPU machine, re-benchmark both. Don't assume.

## Profiles (`blender_setup.PROFILES`)
| Profile | Resolution | Settings | Use |
|---|---|---|---|
| preview | 360×640 | 8 samples, no motion blur | stills at beats, framing |
| review | 720×1280 | 8 samples | full-motion check |
| **final** | 1440×2560 | **4 samples, OIDN prefilter FAST + quality FAST, albedo-guided, light tree off, PNG level 0** | delivery |
| final_hq | 1440×2560 | 8 samples, accurate OIDN | scenes with fine texture or glossy noise |
| final_fast | 1080×1920 | 8 samples, upscale at assembly | long videos over budget |
`final` vs a 16-sample reference: **SSIM 0.976–0.991** (slightly smoother micro-texture at 100 %). Always verify with `image_compare.py` on a new scene class.

## Optimisation method (worked twice; the bottleneck differed each time)
1. Benchmark about 5 representative frames **as a sequence** (persistent data skews single-frame tests).
2. One-variable ablation on the slowest frame (`render_ablation.py`).
3. Combine the winners → compare against the reference at the **same resolution** (SSIM/PSNR plus 100 % crops).
4. Keep what carries realism: motion blur, DOF and bounces each cost under 7 %.
Found bottlenecks: pilot-01, samples × pixels; pilot-02, **OIDN at 3.7 MP = 16.6 of 52 s**.

## Persistent data
Safe only when no geometry is animated by modifiers. With animated booleans or armatures, turn it off. Pilot-01 rendered black frames from stale geometry with it on.
