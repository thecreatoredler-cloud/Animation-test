# Lighting guide

Tool: `scripts/lighting_tools.py`. Colour management: `blender_setup.set_color_management` (AgX plus the "Medium High Contrast" look).

## Rigs
| Rig | When | Contents |
|---|---|---|
| `daylight_studio` | Modes M1–M3 and M5 (most of the reference) | Warm sun key (3° angle, so soft but defined shadows), large cool area fill opposite, white rim behind and above |
| `sky_backdrop` (world) | Any shot with the blue background | Screen-space gradient seen by the camera, plus a separate soft sky for lighting |
| `hdri_world` | Realistic sets, reflective objects | Poly Haven HDRI. Optional `backdrop` keeps the blue for camera rays |
| `low_key_practical` | Night, interiors, tension (trunk-style) | One coloured motivated key, faint fill, strong rim |

`scale` is the subject size in metres. It scales positions and area-light power by scale², so the same rig lights a 4 cm padlock and a 2 m person.

## Rules
1. **Key, fill and rim every time.** The rim matters most on the blue background, because skin, brass and sky are all mid-tones and merge without it.
2. **Use the camera-ray split for the backdrop.** The background colour is then art-directed and never shifts when the lights change, which is the tutorial's "keep the approved blue" lesson. Measured reference blues are `#52A4DE`, `#5BB7E7` and `#2C9BD9`. The default gradient is top `#2B8ED8` to bottom `#9FD3F3`.
3. **Use AgX, not Standard.** Standard clips highlights to flat white. AgX with a contrast look rolls them off and keeps the sky saturated.
4. **Warm/cool contrast:** a warm key (`#FFE9CF`) against cool sky fill and bounce, as in the reference daylight.
5. **Watch bounce colour casts.** Green teeth turned out to be grass bounce (tutorial). The pilot's brass picked up orange from the table, which was fixed by darkening the wood. If a surface looks wrong, check what it reflects before editing its texture.
6. **Animate light only with a reason:** reveals, flashes, time of day. `animate_energy()` keys are smooth.
7. **Metals need something to reflect.** The world sky plus a big fill card give soft gradients. Point lights alone make black metal.

## Cost notes (see `render_optimization.md` for measurements)
- A sun light is cheapest in both engines. Area lights cost more in Cycles than in EEVEE.
- Avoid volumetric light (god rays, fog volumes) unless the shot needs it. The tutorial measured volumes as a top bottleneck. Fake haze with world-colour mist in the compositor or a gradient card.

## Pilot-02 outdoor rig (tested)
Garden HDRI (Poly Haven `garden_nook`, **1k** is enough for reflections behind DOF; 2k cost +0.4 s/frame) at 0.38, plus a warm sun (3.0, 1.2°) for crisp outdoor shadows, plus a cool top rim area light (edges the lock top and shackle), plus a cool low bounce fill (the ground). At sun 4.2 and HDRI 0.55 the brass read pale cream.
**Choosing a setting:** the environment must justify the object (a padlock hangs on a door) and give metals something to reflect. Don't default to a dark studio or to the blue backdrop.
