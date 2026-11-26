# Final QC checklist: <title>

Watch the whole export at normal speed, then at phone size (about 9 cm tall). Mark PASS/FIX with timestamps.

## Automatic (attach `qc/QC_final.md`)
- [ ] quality_control.py: all PASS (frames, spikes, resolution, fps, audio, motion)
- [ ] audio_analysis.py: true peak ≤ −1 dBTP, every intended event detected, no masking bed
- [ ] caption_placer report: no caption over the explained action
- [ ] compression check (1080×1920, 5 Mb/s): key details survive (SSIM ≥ 0.96)

## Story and clarity
- [ ] Frame 1 is curious; context is established within about 0.7 s
- [ ] Each beat shows something new; nothing shown before it is named
- [ ] The cause→effect chain can be retold from the pictures alone
- [ ] Facts match the fact-check sheet; reconstructions marked

## Picture
- [ ] Explained parts sharp; DOF supports, never hides
- [ ] Materials read as what they are (100 % crops of the hero objects)
- [ ] Light is motivated; key, fill and rim; no flat mirrored fills on metal
- [ ] No intersections, floating objects, sliding feet or popping
- [ ] Captions: readable, safe-area, accurate, not over action, emphasis sparing

## Sound (a human must listen)
- [ ] Every sound has a visible source and lands on its frame
- [ ] Nothing generic (whooshes or booms on small objects)
- [ ] VO intelligible; Foley ducked under it; reveals have room

## Scorecard (1–10 with a reason): modelling · materials · lighting · environment · camera · animation · effects · sound · editing · clarity · resemblance to reference quality
## Top 3 remaining weaknesses (with timestamps)
