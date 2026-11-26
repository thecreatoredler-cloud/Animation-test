# Content archetypes: selection logic and matrix

The subject, script and facts drive the visual design. These archetypes are **starting points for creative decisions, not templates.** Most videos combine 2–3 of them, for example a person in a scene (J) → the inside of the body (B) → a metaphor (H) → back to the person.

**Validation status** (see `lessons-learned.md`): ✅ produced end to end · 🟡 blockout tested (one short preview) · ⬜ theory only, not yet tested.

## 1. Selection: answer these before choosing
1. What is the **curiosity question** (one sentence the viewer wants answered)?
2. What **claim or sequence** must they understand? (Bullet the cause→effect chain.)
3. What is the **most visually interesting true way** to show it? (Inside view? Scale change? A person reacting?)
4. Which archetype(s) carry each beat? (Fill in the beat table in `templates/shot-list.md`.)
5. What must be **modelled / rigged / simulated / sourced**? What can't be done well here? Choose a simpler method that keeps the look.
6. Which **actions must be seen clearly**? Those get the sharp focus, centre frame and time.
7. What **camera language** fits (see each archetype)?
8. Which details are **essential vs cost-only**? Build only what the lens sees.
9. What does the audience **hear** at each moment (Foley from contacts, ambience of the place)?
10. How do **voice-over, captions and sound** share the timeline? (`sound-and-editing.md`)

Quick router (the order means nothing; A is not a default):
| The question is about… | Primary | Often combined with |
|---|---|---|
| How a thing works inside | A | G, F |
| What happens in the body or mind | B | J (person), H (mind), F |
| What an animal can do | C | I (habitat), B (sense organ close-up) |
| What happened (past) | D | J, I (map) |
| An accident or unusual real event | E | I, J |
| Why physics or chemistry behaves this way | F | H, A |
| A strange invention | G | A, D, J |
| An invisible or abstract concept | H | F, J |
| Size, distance, landscape, climate | I | F, D |
| A person's situation or story | J | any |

## 2. Matrix
### A. Object and mechanism ✅ (padlock pilots 01–04)
- **Forms:** a hero object in a believable context → macro → static-split cutaway or exploded view → staged cause→effect → payoff in context.
- **Build:** real-scale parametric geometry. **Derive the mesh and the motion from one function** (bitting → key mesh and pin motion). Static booleans at build time (`scene_builder.split_by_box`).
- **Assets:** procedural plus CC0 textures and HDRI (Poly Haven, ambientCG).
- **Camera:** establish the whole object (≤ 0.7 s) → macro on the contact → a distinct framing per beat (context, contact, consequence) → off-axis for rotations → pull out to the payoff. Lens 45–85 mm; f/8–16 at macro scale.
- **Animation:** each part has its own physics (follower, stiction, spring snap, gravity drop, pendulum). Dependent parts are driven from the driver (`release_state(theta)`).
- **Light:** key, grazing fill and rim. **Never a big uniform light on the axis of flat metal** (it mirrors as cream or plastic).
- **Sound:** contact Foley from the animation's events; silence on explanatory beats.
- **Risks:** a diagram-looking section, frontal holds, wrong mechanism (research it), a floating tool with no hand.
- **Cheap preview:** preview stills at the beats (about 2.5 s/frame at 360×640) and a motion check at step 2.
- **Success:** a viewer can retell the cause→effect chain from the pictures alone.

### B. Human biology, anatomy and psychology 🟡 (biology test: vessel and cell flow)
- **Forms:** everyday scene → push through skin to a layer section → process at cell or organ scale → back out to the person. Psychology: a clearly stylised metaphor space (label it as a metaphor).
- **Build:** stylised anatomy (clean, saturated, non-graphic). Instanced cells or particles (`instance_along_curve` in the test). Translucent tissue only where needed (render cost).
- **Assets:** procedural, plus a human (J) for the in-and-out transition.
- **Camera:** continuous push-ins through layers. Scale changes are cross-dissolves or a continuous dolly with matched framing. Flow is filmed **along** the vessel (tracking), not across it.
- **Animation:** flow speed and direction consistent. Pulsing with a heart-rate period (about 1 s). Secondary wobble of soft tissue.
- **Light:** soft and bright, subsurface or translucency feel, warm reds with a cool background for separation.
- **Sound:** low body-interior ambience (filtered), soft organic Foley. Keep it sparse.
- **Person → organ transition (theory):** keep the camera's screen position on the organ continuous. Push in on the torso, cross-dissolve at about 0.3 s to the stylised organ framed the same way, keep moving. Reverse it to return to the person.
- **Risks:** gore (stay non-graphic), wrong scale, metaphor shown as fact, mush (every object the same red).
- **Success:** you can tell layers and particles apart at phone size, and the scale transition is understood.

### C. Animal abilities and behaviour 🟡 (animal test: fish locomotion)
- **Forms:** the animal in its habitat → the ability in action → a close-up of the organ or sense → a comparison (scale, speed).
- **Build:** correct proportions and silhouette first. Species-specific locomotion: a body wave for fish (`fish_swim` test), gait cycles for quadrupeds, flapping with an up/down asymmetry for birds. A rig or deform cage. Sourced models need a licence check.
- **Camera:** track with the animal (follow cam with lag). Low angles for size. A macro insert of the organ.
- **Animation:** a locomotion wave that travels **head to tail** with growing amplitude. Speed matched to body length (fish: about 1–2 body lengths/s cruising). **No human-like motion.**
- **Light:** the habitat sets it (underwater: blue-green, depth falloff, caustics; savannah: hard sun).
- **Sound:** the habitat bed (water, wind), species sounds only from licensed or own recordings.
- **Risks:** a floating isolated model, generic "wiggle", wrong scale, cartoon proportions in a realistic world.
- **Success:** you can identify the species and recognise its movement on mute.

### D. Historical events ⬜
- **Forms:** an establishing shot of the place and period → characters staged → a key-object insert → map or timeline transitions.
- **Build:** period architecture, clothing and props from sourced references. **Separate fact from reconstruction** in `templates/fact-check-sheet.md`; signal uncertainty (generic faces, no invented dialogue).
- **Camera:** slow establishing crane, inserts on evidence objects, map moves with clear geography.
- **Risks:** anachronisms, invented specifics, copying a film's look.

### E. Unusual real-world events and accidents ⬜
- **Forms:** map or location → the scene as it was (period-correct, sourced) → the trigger (cause, labelled "likely" if it's a hypothesis) → the sequence with clear geography (tracking along the path of the event) → the consequence → what changed afterwards (rules, design).
- **Build:** only details supported by sources (fact sheet first). Faceless silhouettes where identity is unknown. One consistent reconstruction look (see story pipeline).
- **Fluids and waves (theory, not tested):** prefer a displaced or animated mesh surface (cheap, art-directable) over a fluid simulation. If you simulate, bake once, and benchmark the cache and render cost first. Avoid volumetric splashes and mist; use `add_distance_haze` for air.
- **Camera:** an establishing map move, then a street-level crane, then lateral tracking with the event's motion, then a wide aftermath with **no victims shown**.
- **Risks:** sensationalism, false precision (show estimates as ranges), missing context, implying blame without a source.

### F. Science, physics and counter-intuitive phenomena 🟡 (partly: the biology flow test exercises instancing and flow)
- **Forms:** a scale change, force or flow visualisation, a controlled simulation, side-by-side comparison, motion trails and vectors **only where they clarify**.
- **Build:** real physics where it's known (springs, pendulum and gravity drops are in `animation_tools`). Stylised metaphor when it isn't literal, and say so.
- **Risks:** pretty but meaningless particles; implying false physics.

### G. Strange inventions and technology ⬜ (A covers most of it)
- **Forms:** hero object → exploded view or assembly → functional close-ups → a human using it → old versus new.
- **Build:** as A, plus a human interaction (J).

### H. Abstract, invisible and conceptual topics ⬜
- **Forms:** a visual metaphor with a **stated rule set** (e.g. "each marble = one memory"), spatial analogies, graphic elements.
- **Risks:** a metaphor mistaken for fact. Keep its look clearly distinct from the "real" footage.

### I. Geography, environments and large-scale processes 🟡 (environment test: terrain fly-over)
- **Forms:** a wide establishing shot → a map or topography → a cross-section → a scale reference (a person, a building) → a process over time.
- **Build:** procedural terrain (displaced grid), a water plane, haze and mist **without volumes** (world colour plus distance fade), an instanced scatter for trees and rocks.
- **Camera:** high oblique fly-overs on smooth paths, slow (camera speed scaled to the scene). An orthographic or top-down map moment.
- **Light:** low sun for relief (long shadows show topography), atmospheric falloff.
- **Risks:** no scale reference; flat lighting hides the relief; volumetric fog render cost.
- **Success:** the viewer can say where things are relative to each other.

### J. Character-led stories and scenarios 🟡 (character test: blockout mannequin with an armature)
- **Forms:** a person in a recognisable place, readable silhouette and pose, an interaction with a prop, a reaction close-up.
- **Build:** **a facial rig is required for hero characters** (lesson from the tutorial). Here only a **blockout mannequin** (skin-modifier body plus a generated armature) is tested; a production character needs MPFB 2 or another licensed rigged human (`asset-library-and-licensing.md`).
- **Camera:** coverage: wide (blocking) → medium (action) → close-up (reaction). Eye-level by default; low for power, high for vulnerability. Motivated moves only.
- **Animation:** poses held long enough to read (about 0.5–1.5 s), anticipation before actions, overlap on the arms, weight shifts. **No sliding feet.**
- **Light:** motivated by the environment. Rim light to separate the silhouette.
- **Sound:** room tone of the place, cloth and footstep Foley, prop contacts.
- **Risks:** dead faces, stiff T-pose arms, uncanny realism mismatch, characters floating above the floor.
- **Success:** on mute, a viewer can tell what the person feels and does.
