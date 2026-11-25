# Reference A: visual analysis of 18 Zack D. Films Shorts

The source is 18 Shorts supplied by the owner on 2026-11-25. They replace an earlier compilation the owner withdrew. Each is 24.6–45.5 s long, 30 fps (29.97) and 9:16, uploaded at 480p–1296×2304.
**Method:** I looked at contact sheets of 12 evenly spaced frames per Short, plus individual frames. Every Short was also measured with `scripts/analyze_reference.py`. Per-Short data is in `measurements/`; screenshots are in `frames/` (270 px wide, kept for analysis only).
These are study notes. Our videos use original characters, stories and art. Never copy their characters, branding or episodes.

## 1. Measured numbers (the targets the camera tools are tuned to)

| Short | s | shots* | median shot s | mean abs zoom %/frame | frames zooming in / out | camera still | object motion px/s** |
|---|---|---|---|---|---|---|---|
| an island of toenail clippings | 29.2 | 7 | 2.2 | 0.889 | 0.34 / 0.62 | 0.01 | 82.0 |
| blown veins explained | 29.7 | 1 | 29.7 | 0.83 | 0.36 / 0.59 | 0.03 | 15.7 |
| bone grafting explained | 31.9 | 2 | 16.0 | 0.25 | 0.32 / 0.32 | 0.20 | 13.2 |
| could ancient armor stop bullets | 29.4 | 3 | 6.4 | 1.081 | 0.56 / 0.33 | 0.00 | 31.1 |
| how a derma roller works | 29.0 | 2 | 14.5 | 0.944 | 0.31 / 0.60 | 0.05 | 33.1 |
| how cartridge traps injured soldiers | 24.6 | 2 | 12.3 | 0.46 | 0.31 / 0.52 | 0.11 | 15.4 |
| how cheating dice work | 38.9 | 7 | 4.9 | 0.931 | 0.45 / 0.40 | 0.06 | 21.8 |
| how long are your blood vessels | 39.4 | 7 | 6.1 | 1.362 | 0.13 / 0.70 | 0.06 | 24.1 |
| how splinters get unstuck | 30.4 | 3 | 4.5 | 0.333 | 0.32 / 0.30 | 0.33 | 6.4 |
| how stitches work | 31.0 | 1 | 31.0 | 0.534 | 0.55 / 0.26 | 0.11 | 4.9 |
| how this expensive wood is made | 30.5 | 3 | 6.5 | 1.211 | 0.39 / 0.52 | 0.02 | 34.5 |
| how to escape a car trunk | 26.1 | 10 | 1.1 | 1.651 | 0.52 / 0.34 | 0.10 | 56.8 |
| stuck in a water slide | 30.9 | 4 | 3.1 | 0.876 | 0.37 / 0.50 | 0.03 | 66.7 |
| the indestructible sword paradox | 45.5 | 17 | 2.4 | 1.935 | 0.55 / 0.38 | 0.02 | 109.1 |
| tootsie rolls used in war | 35.2 | 9 | 3.7 | 1.467 | 0.72 / 0.22 | 0.01 | 39.8 |
| what is a skin tag | 32.2 | 2 | 16.1 | 0.909 | 0.48 / 0.40 | 0.02 | 30.0 |
| why did people put bells on graves | 35.4 | 5 | 3.6 | 0.886 | 0.43 / 0.38 | 0.11 | 9.1 |
| why one shooter gets a blank round | 26.8 | 2 | 13.4 | 1.709 | 0.58 / 0.32 | 0.02 | 51.1 |
| **median** | **30.7** | **3** | **6.2** | **0.92** | **0.41 / 0.39** | **0.04** | **30.6** |

\* The "shots" column counts only hard cuts the detector is sure of. Whip-pans, motion-blur transitions and morph transitions (for example, a skin surface turning into a cross-section) read as continuous camera motion. Treat it as a lower bound.
\*\* "Object motion" is the median motion that the camera move does not explain, in px/s for a 1000-px-tall frame. In other words, it measures how much the subject itself animates.

**Validation:** for "How Stitches Work" the tool measures a mean zoom of 0.536 %/frame (max 3.34). The tutorial's own tool reports 0.541 (max 3.50) for the same video.

### Rules derived from the numbers
1. **The camera almost never stops.** It is still in a median of 4 % of frames, and the most is 33 %. Every shot needs a continuous slow push or pull. A locked-off shot is the exception, and it must be short.
2. **Zoom dominates over pan.** The camera pushes in and pulls out (median |zoom| ≈ 0.9 %/frame) more than it pans sideways. Push-in and pull-out frames are roughly balanced (41 % / 39 %). The typical arc is **wide → push in to explain → pull out to resolve.**
3. **There are few hard cuts.** The median is 3 per 30 s. Many videos are 1–3 long continuous moves that run through morphs and transitions. Fast-cut videos (sword, trunk, tootsie) are action stories and cut every 1–2.5 s.
4. **The subject moves too.** Object motion has a median of 31 px/s. Calm medical explainers (stitches, splinters, bone graft) are the lowest at 5–13 px/s, and even there the wound or tissue is changing. Action stories reach 50–110 px/s.
5. **Length is about 30 s.** The median is 30.7 s and the range is 25–45 s, so plan 900–1,000 frames.

## 2. The five visual modes (pick one per scene, don't force one template)

| Mode | Examples (`frames/`) | What defines it |
|---|---|---|
| **M1 Body macro explainer** | stitches_t2/t12/t29, derma_roller_t12, skin_tag_t2, blown_veins_t4 | A real-looking body part (leg, arm, finger) against a **flat blue sky-gradient background**. The camera pushes into extreme macro. The surface has pores, fine hair and a wet or matte wound. The process happens over time: stitches tighten, holes heal. |
| **M2 Cutaway cross-section** | skin_tag_t14, splinters_t14, bone_grafting_t20, blown_veins_t4 | A stylised anatomy block: epidermis/dermis/fat layers in saturated pink-red-orange, hair as black spikes, vessels as red/blue tubes. It is still lit like a product shot, on the same blue backdrop. |
| **M3 Product / object hero** | derma_roller_t1, cheating_dice_t3, cartridge_traps_t10, wood_t20 | One object fills the frame, with a shallow depth of field. Strong key light with specular highlights on plastic, metal or wood. A clean background or tabletop. The object rotates or reveals its mechanism. |
| **M4 Character situation** | water_slide_t6, car_trunk_t8, armor_t3, tootsie_t12, blank_round_t4 | A realistic-proportioned 3D human: game-quality skin, plain T-shirt and jeans or a uniform, expressive open-mouth faces. In a believable set (tube slide, car trunk, battlefield, desert). Lots of low and high angles and POV shots. |
| **M5 Scale / world vista** | toenail_island_t12, blood_vessels_t2, bells_on_graves_t14, sword_t16 | A big imaginative scale reveal: an ocean of clippings, a vessel line circling the Earth, a buried coffin in ground cross-section. Pull-outs dominate (blood vessels: 70 % of frames zoom out). |

Most videos mix modes: M4 to set up the human situation, M1/M2 to explain, then back to M4 or M5 to resolve.

## 3. Characters (M4)
- **Proportions:** realistic adult (about 7.5 heads), not cartoon. Slightly large, clean-featured heads. They read as "game cinematic" humans, not photoreal ones.
- **Faces:** big readable expressions, held 0.5–1.5 s: open-mouth shock, wince, strain (water slide, armor). Eyes always have specular catchlights. The jaw and brows move. A **facial rig is required**, since a static face looks dead.
- **Skin:** matte with subsurface warmth and visible pores in close-up, and no plastic shine. Hair is a simple cap or short cut.
- **Clothing:** simple solid garments (white tee, blue jeans, camo) with folds. The brand logo on a T-shirt is their mark, so **we never copy it.**
- **Interaction:** hands touch things in almost every shot (pressing a latch, holding tweezers, rolling dice). Close-ups of hands are frequent.

## 4. Environments
- **Default backdrop is a blue sky gradient.** Sampled sky colours: `#5BB7E7` (87,183,231), `#2C9BD9`, `#5DB7FF`, `#91CBEB`. The tutorial measured RGB 82,164,222 (`#52A4DE`) as the channel's typical blue. The gradient runs lighter toward the horizon, and sometimes has a few soft clouds.
- When an environment is used, it is **built to the shot**, not a whole world: the water-slide tube interior, a trunk interior lit cold blue, a desert with distant hills and a truck, a stone wall with coffins. Layers: foreground prop, mid character, background silhouette or sky.
- **Ground cross-sections** (soil layers with a coffin, wood interior) are presented like a diorama cut.
- Atmosphere is a mild haze on wide vistas. There is almost no heavy fog or volumetrics.

## 5. Materials
- **Skin:** SSS, pores via a bump/normal map, fine hair cards or particles on legs and arms, slightly desaturated.
- **Wounds and tissue:** wet glossy red with darker edges, and swollen pink rims (stitches).
- **Plastic and metal:** clean PBR, strong specular, low roughness on metal (cartridge brass, tweezers).
- **Stylised anatomy:** saturated, nearly flat colours (vessels pure red/blue, fat yellow) with soft shading. This is a deliberate exception to realism.
- **Wood, dice, fabric:** realistic textures (CC0 PBR is good enough).

## 6. Lighting
- **High-key daylight:** a bright, soft key from the upper front-side plus strong sky fill, with **almost no dark areas** in M1–M3 and M5. Shadows are soft, short and coloured blue by the sky.
- **Rim/back light** separates the subject from the blue background, which matters because skin and sky are both mid-tones.
- **Dramatic exceptions follow the story:** the trunk interior is monochrome blue darkness with a single practical light, and the sword sequence uses red flashes and lens glare.
- The **colour pipeline protects the blue:** the tutorial's fix was to keep normal tones as they were and only stop highlights from clipping (sections 4 and 7 of the tutorial notes). In Blender this means AgX/Filmic tone mapping with a look tuned so the background stays saturated blue.

## 7. Camera
- **Lenses:** wide-ish (24–35 mm equivalent) for characters and sets, often low or high. Long lens (85–135 mm) plus a **very shallow depth of field** for macro and product shots (derma surface, dice).
- **Moves:** continuous slow push-ins with ease-in/out, pull-outs to reveal scale, small arcs/orbits around products, a follow camera on a sliding body, and POV shots (trunk).
- **Transitions:** a continuous push through the surface into the cross-section (a morph, not a cut), whip/blur transitions, and motion-blurred speed cuts in action pieces.
- The camera **never shakes randomly.** Moves are smooth and eased (see "zoom jerk" in the tutorial).

## 8. Animation
- Something always changes: the wound closes, holes fill and heal, dice roll and settle, water rises, a bullet travels.
- **Physical timing:** objects settle with small overshoot (dice), and impacts have anticipation and recoil (armor, blank round).
- **Process animation is procedural:** stitches tightening, swelling that rises and falls, layers growing. Blender shape keys, displacement driven over time, and geometry-nodes growth suit this.
- **Secondary motion:** water ripples, hair spikes, dust and sparks on impacts.

## 9. Editing, captions and storytelling
- **Captions:** 1–3 words at a time, white bold rounded sans (similar to Montserrat ExtraBold) with a soft dark shadow, centred at about **72–78 % of frame height**, changing word-group with the narration. Our open alternative is Montserrat or Nunito ExtraBold (SIL OFL).
- **Hook in the first second:** the subject appears immediately, already in motion and in close-up (the stitch already pulling, the roller already rolling).
- **One idea per camera move:** the narration line maps to one push or pull, and the visual shows exactly the noun being said ("derma roller" shows the roller; "tiny holes" shows the holes).
- **Resolve with a pull-out:** the ending widens back out (the healed leg walks away, the scar fades).
- The visuals explain things without on-screen diagrams or labels. The camera and the process animation carry the information.

## 10. What we will implement (traceability)
| Rule | Tool |
|---|---|
| Continuous eased push/pull, about 0.5–1 %/frame zoom | `scripts/camera_tools.py` presets `push_in`, `pull_out`, `orbit_arc` |
| Blue gradient backdrop and high-key light | `scripts/lighting_tools.py` rig `daylight_studio` |
| AgX tone mapping that preserves blue | `scripts/blender_setup.py` colour management |
| M1/M2 procedural skin and cross-section | `scripts/scene_builder.py` builders |
| Captions 1–3 words at 75 % height | `scripts/video_assembler.py` |
| Checking our renders against these numbers | `scripts/analyze_reference.py` run on our own output |
