# Quality control

## Automatic (`scripts/quality_control.py PROJECT --profile final`)
Frames are complete, readable and 9:16; no black, frozen, flickering or **temporal-spike** frames (this check caught stale-geometry frames). Video resolution, 30 fps and an audio stream are verified. Motion is checked against reference targets: still ≤ 0.33, mean |zoom| 0.25–2 %/frame, subject motion ≥ 4 px/s. Writes `qc/QC_<profile>.md`, a contact sheet and `qc.json`.
Plus: `audio_analysis.py` (loudness, true peak, onsets, spectrogram) · `image_compare.py` (quality against a reference) · `caption_placer.py` report (importance under captions) · a compression check (re-encode at 1080×1920, 5 Mb/s, then SSIM).

## Manual (must be done by watching): use `templates/final-qc-checklist.md`
Watch the **whole export at normal speed, then at phone size**. Never rely on stills alone. Score 1–10 per category with a reason, list the top 3 weaknesses with timestamps, fix every FIX, re-run QC.

## Things automatic QC missed in the source project (so check by eye)
| Defect | Found by |
|---|---|
| Black interiors from stale geometry (before the spike check existed) | contact sheet |
| Cream metal (mirrored fill) | 100 % crop |
| Captions over the action, and before the visual | assembled frames at caption times |
| Repetitive middle framing | timeline sheet every 0.33 s |
| Soft DOF on the explained part | sharpness (Laplacian variance) plus eye |
| Mechanism inaccuracy (wrong lock layout) | research |
| Unrealistic proportions (springs read as screws) | 100 % crop |

## Sound QC
Every intended event detected as an onset; no continuous bed masking events; no sub-100 Hz energy unless a big object makes it; true peak ≤ −1 dBTP; limiter gain reduction ≤ about 4 dB; **a human listens** to the final export (the analysis can't judge naturalness).
