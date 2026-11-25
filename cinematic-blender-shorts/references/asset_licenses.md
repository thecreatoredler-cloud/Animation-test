# Asset licences

The machine-readable registry is `assets/registry.json`, written by `scripts/asset_manager.py` on every download. This file holds the policy and the hand-added entries.

## Policy
1. Prefer **CC0** (Poly Haven, ambientCG). No attribution is required, but we record it anyway.
2. Any other licence: verify that it allows commercial use in a monetised video, record the licence URL here **before** use, and never redistribute raw files if the licence forbids it.
3. No add-ons or executables from unknown sources. Downloaded `.blend` files are not extracted (they can embed scripts).
4. Don't use the reference channel's assets, characters, logo or branding.

## Registered assets
| Asset | Source | Licence | Format | Location | Use |
|---|---|---|---|---|---|
| Studio Small 09 (HDRI, 1k) | Poly Haven (Sergej Majboroda) | CC0 1.0 | .hdr | assets/hdri/polyhaven/studio_small_09/ | Neutral studio IBL for product and macro shots |
| Wood049 (1K-JPG PBR set) | ambientCG | CC0 1.0 | JPG maps | assets/textures/ambientcg/Wood049/ | Table tops |
| Montserrat ExtraBold | github.com/JulietaUla/Montserrat | SIL OFL 1.1 (assets/fonts/OFL.txt) | .ttf | assets/fonts/ | Captions |
| All SFX | Synthesised by `audio_tools.py` | Original (ours) | generated WAV | per project build/ | Sound design |
| Pilot-01 geometry and materials | Procedural (scripts) | Original (ours) | | projects/pilot-01-padlock/ | |
