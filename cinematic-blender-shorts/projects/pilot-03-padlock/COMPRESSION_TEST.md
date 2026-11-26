# Compression test (simulated YouTube Shorts delivery)

Master: `output/pilot-03-padlock_final.mp4` (1440×2560 H.264 CRF 16). Simulation: downscale to 1080×1920 and H.264 at 5 Mb/s (6 Mb/s max), roughly typical of Shorts 1080p delivery. YouTube's real encoder and bitrate vary and are not reproduced exactly. Compared against the master scaled to 1080×1920 (isolates codec loss).

| t (s) | Content | SSIM | PSNR dB |
|---|---|---|---|
| 0.4 | hook, key + keyhole | 0.981 | 42.8 |
| 3.3 | pin ride (fine springs) | 0.973 | 38.3 |
| 5.2 | shear-line glow | 0.967 | 38.2 |
| 6.2 | cam + balls | 0.974 | 39.2 |
| 7.8 | end wide | 0.977 | 39.8 |

100 % crops (left: master, right: simulated delivery): `comparison/compression_crops.jpg`.
