# Visual style guide (house style)

Our own house style, derived from the measured reference (`zach_visual_analysis.md`). It shares the reference's *production language* (bright high-key 3D, continuous camera, macro explanation) but uses original subjects, characters and branding.

## 1. Choose the visual mode per scene (not one template per video)
```
Is the subject a body process (skin, wound, vein)?        -> M1 body macro, then M2 cross-section for "inside"
Is it how an object or mechanism works?                   -> M3 product hero, cut away into the mechanism (pilot-01)
Is it a person in a situation (escape, danger, history)?  -> M4 character situation (needs character rig)
Is it about size, quantity or distance?                   -> M5 scale vista with a big pull-out
```
A typical 30–45 s video uses 2–3 modes: M4/M3 hook → M1/M2 explanation → M5/M4 resolution.

## 2. Style tokens
| Token | Value |
|---|---|
| Format | 1440×2560, 30 fps, 30–45 s (900–1,350 frames) |
| Backdrop | Screen-space gradient top `#2B8ED8` → bottom `#9FD3F3` (reference measurements `#52A4DE`, `#5BB7E7`) |
| Colour pipeline | AgX + Medium High Contrast; exposure 0 |
| Key light | Warm `#FFE9CF`, sun 3° (defined but soft shadows), 40–50° elevation |
| Fill / rim | Cool `#CFE6FF` fill; white rim behind subject |
| Lenses | 24–35 mm wide, 50–60 mm product, 75–100 mm macro |
| DOF | Always on; macro at f/8–11 real scale |
| Camera | Never still (target ≤ 10 % still frames); 0.3–1.0 %/frame zoom |
| Captions | Montserrat ExtraBold, white, soft shadow, 1–3 words, ~76 % frame height, 85 → 100 % pop-in |
| Finish | Grain 3, vignette 0.22, light unsharp 0.25. **No bloom, no glow by default** |
| Sound | Room-tone bed −44 dB; stacked hits; reverb by shot size |

## 3. Shot rules
1. **Hook in 1–2 s:** the subject is on screen and moving at frame 1.
2. **One idea per camera move;** the visual shows exactly the noun being said.
3. **Push in to explain, pull out to resolve.**
4. **Three motion layers in every shot:** camera, subject, secondary.
5. **Three depth layers in every frame:** foreground, subject, background.
6. **Explain with the image, not with labels or diagrams.**
7. **Cuts only on action or on a whip.** Otherwise use continuous moves and morphs (surface → cross-section).

## 4. Realism without the "too perfect CG" look
Do: roughness variation everywhere, micro bump, contact shadows, motion blur (180° shutter), real-scale DOF, desaturated metals, bounce light, slight grain.
Don't: heavy bloom, glow halos, chromatic aberration, oversaturation, noise you can see on a phone, uniform plastic surfaces.
