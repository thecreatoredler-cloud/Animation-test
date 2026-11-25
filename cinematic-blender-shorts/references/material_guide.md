# Material guide

Tool: `scripts/materials.py`. Every material is procedural (no downloads needed) with built-in roughness variation, plus `image_pbr()` for CC0 texture sets from `asset_manager.py`.

| Function | Use | Key settings (tested in pilot-01) |
|---|---|---|
| `metal(name, color, roughness, brushed, scale, wear)` | Brass, steel, chrome, tools | Brass `#B9944E` r 0.36. Steel `#8F969E` r 0.28. Machined cut face `#E2CFA0` r 0.42 |
| `plastic(name, color, roughness, coat)` | Plastic, ceramic (with coat) | Ceramic `#EDE7DC` r 0.18 coat 0.4 |
| `wood(name, light, dark, scale, varnish)` | Procedural wood | Walnut `#8A5A35`/`#3E2414` |
| `skin(name, tone, roughness, pores, pore_scale)` | M1 macro skin | SSS 0.35, pores via Voronoi plus noise bump. pore_scale is about 900 per metre at real scale |
| `tissue(name, color, wet)` | Wounds, stylised anatomy (M2) | Saturated colour, coat 0.5 when wet |
| `glass`, `emission`, `painted` | | |
| `image_pbr(name, color, rough, normal, scale)` | ambientCG / Poly Haven texture sets, box-projected (no UVs) | |

## Rules
1. **No perfectly uniform surface.** Every material has noise-driven roughness (±0.05–0.15). Uniform roughness is the fastest giveaway of the "CG look".
2. **Lower the saturation of metals.** The pilot's first brass (`#D4A84F`, r 0.26) read as fake gold. Desaturated and rougher (`#B9944E`, r 0.36) reads as brass.
3. **Cut faces get their own material** (boolean `material_mode="TRANSFER"` from the cutter): **the same alloy with a finer machined finish**, never a different colour. v1's light-beige section face (`#E2CFA0`) read as a separate block (pilot-02 diagnosis §D).
4. **Skin is matte with SSS and pores**, never oily (tutorial).
5. **Use real-world scale and Object coordinates.** Texture detail stays the same size as the camera pushes in. Set feature scale per metre.
6. **Stylised anatomy (M2) is an intentional exception:** flat saturated reds, blues and yellows with soft shading. Keep it consistent within a video.
7. **Brushed noise mapping can create radial streaks** on large flat faces (seen on the pilot's cut face). Use it only on small or curved parts.

## Pilot-02 settings (tested in Cycles, final profile)
| Material | Settings | Note |
|---|---|---|
| Aged brass body | `#8F6C32` r 0.36 wear 0.14 | Earlier `#B08C4A` read pale cream outdoors |
| Brass section face | `#A9853F` r 0.26 brushed | Same alloy, finer finish (continuity) |
| Plug | `#A88640` r 0.24 | Slightly different, so the shear line reads |
| Nickel key | `#3B3F43` r 0.3 brushed | Low reflectance; brighter values mirrored the sky as "white plastic" |
| Chrome balls | `#D9DDE1` r 0.06 | |
| Galvanised hasp | `#9AA1A3` r 0.45 wear 0.2 | |
| Painted planks | Poly Haven `distressed_painted_planks` 1k, tint `#A7AEA6` | Tint stops the door washing out in sun |
`image_pbr(..., arm_path=...)` reads Poly Haven packed AO/rough/metal maps. `metal(..., micro_bump=False)` exists, but on pilot-02 it saved only 0.2 s and changed the look, so it isn't used there.
