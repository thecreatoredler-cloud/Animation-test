# Asset library and licensing

## Policy
1. Prefer **CC0** (Poly Haven, ambientCG), custom procedural geometry, or **your own recordings and photos**.
2. Any other licence: confirm that commercial use in monetised video is allowed, record the licence URL **before** use, and keep attribution if required.
3. Log every external asset in `templates/asset-manifest.csv` (name, purpose, provider URL, licence, allowed use, local path, attribution, modified?).
4. Never extract or open downloaded `.blend` files (they can carry scripts). Never install unknown add-ons.
5. Never use a reference channel's logos, characters or assets. Never embed reference videos in deliverables.

## Automated sources (`scripts/asset_manager.py`)
| Source | Kind | Licence | Command |
|---|---|---|---|
| Poly Haven | HDRIs, PBR textures, glTF models | CC0 | `asset_manager.py get polyhaven hdri <id> --res 1k` |
| ambientCG | PBR textures | CC0 | `asset_manager.py get ambientcg texture <id> --res 1K-JPG` |
It writes `<workspace>/assets/registry.json` automatically (id, source, licence, authors, files, intended use, date).
**Network:** the sandbox must allow `api.polyhaven.com`, `dl.polyhaven.org`, `ambientcg.com` and `acg-download.struffelproductions.com`. Fallback: procedural materials only (every material in `materials.py` works offline).

## Characters, animals and sounds (not automated: verify per item)
| Need | Free options to evaluate | Status in source project |
|---|---|---|
| Rigged human with face | MPFB 2 (MakeHuman; output CC0, add-on GPL) + Rigify | Not tested (hosts blocked) |
| Animals | Sculpt or lathe procedural (tested: fish); licensed glTF (check each) | Procedural only |
| Foley | Own phone recordings (best: clear rights); CC0 libraries (check each file) | Synthesised only |
| Fonts | Montserrat (SIL OFL) | In use |

## Quality checks for every asset
Silhouette and proportions first; scale in metres; texture resolution matched to its screen size; edges bevelled; one realism level across the scene; adjust the colour to the scene palette (`image_pbr(tint=)`).
