# PLAN: pilot-02, how a pin-tumbler padlock opens (v2)

Same subject as pilot-01 by design: the point is to prove the system makes a clearly better film from the same concept. The v1 diagnosis is in `diagnosis/DIAGNOSIS_v1.md`. Every v2 decision below answers one of its findings.

## Story beats and shot plan (8.0 s, one continuous camera move)
| t (s) | Frames | What we see | Camera (why) | Cause → effect | Caption |
|---|---|---|---|---|---|
| 0.0–0.7 | 1–21 | Key rises toward the keyhole on the lock's underside; the hand's small misalignment settles | **Low 3/4 macro under the lock**, 45 mm, f/4. Rack focus from key tip to keyhole (curiosity: what's in there?) | Key finds the slot | "How does a key open this?" |
| 0.7–2.2 | 21–66 | Key tip enters. The **front half of the same lock** cracks, slides forward and lifts away up-left | Rises and arcs to the front 3/4 (reveal follows the piece leaving) | The piece leaving shows the pin pairs inside | "*Pin pairs* block the plug" |
| 2.2–5.0 | 66–150 | Key slides home with a small hesitation per pin. Each pair rides its ridges; springs squeeze | Slow push in, 65→75 mm (attention narrows to the pins) | Ridge → pin up → spring compresses | "The key's ridges lift them" / "squeezing the springs" |
| 5.0–5.4 | 150–162 | All five gaps sit on the **shear line** | **Macro** 85 mm, f/9, short hold (the "aha" beat) | Alignment frees the plug | "*Gaps align*" |
| 5.4–6.2 | 162–186 | Plug and key turn 90°. Key pins swing toward the viewer; the **cam** swings; the **balls** retract | Rises to a higher front view between the shackle legs (the turn is around the vertical axis, so a top-ish angle makes it readable) | Turn → cam's narrow side faces the balls → balls free | "The plug turns" / "the cam frees the balls" |
| 6.0–6.4 | 180–192 | Shackle spring snaps the shackle up 15.5 mm. The hanging **body drops** onto the shackle stop and **swings** on the staple | Continues rising, then begins pulling out | Spring + gravity: physical payoff | "and the shackle *springs open*" |
| 6.4–8.0 | 192–240 | The front half returns. A complete brass padlock hangs open on a weathered shed door | Pull-out 60→45 mm to a 3/4 wide (resolve, scale) | | |

## Mechanism (researched)
Bottom keyway, vertical plug, 5 pin pairs (brass key pins, steel drivers, springs) drilled sideways toward the short leg. A steel cam on the plug top holds two chrome balls in notches in both shackle legs, and a shackle spring sits under the captive long leg. Sources are in the diagnosis §E.
The bitting (ridge heights) is one function that generates **both** the key mesh **and** the pin motion, so contact is exact. The ball and shackle motion are computed from the cam angle (`release_state`): balls follow the cam, the notch wedge transmits shackle lift, and the spring takes over once the balls are clear.

## Visual direction
- **Setting:** a weathered, painted shed door (Poly Haven `distressed_painted_planks`, CC0) with a galvanised hasp and staple, lit by a garden HDRI (Poly Haven `garden_nook`, CC0) plus a warm low sun. It motivates why a padlock is here, gives the brass real things to reflect, and gives the release a physical consequence (the drop and swing). It replaces the generic blue sky and beige table and removes the distracting white mug.
- **Palette:** warm brass against a desaturated sage-grey door, with cool steel and nickel parts. The warm/cool contrast separates the subject.
- **Light:** warm sun key (3.0 W/m², 1.2° for crisp outdoor shadows); a cool top rim area light to edge the lock's top and shackle; a soft cool bounce fill from below-front (the ground); garden HDRI at 0.38 for reflections.
- **Section continuity:** the cut is made **once at build time** (`scene_builder.split_by_box`). The cut faces use the same brass alloy with a finer machined finish (`BrassSection`), never a different colour. The piece that leaves is the real front half, including the plug's front half.
- **Materials:** aged brass body (r 0.36 with wear noise), slightly brighter polished plug (so the shear line reads), brass key pins, steel drivers, chrome balls, hardened-steel shackle, nickel-silver key with a milled groove, galvanised hasp with rivets.

## Sound (see SOUND_DESIGN.md)
Event-driven physical Foley from `build/events_s01_padlock_v2.json`. No whooshes, no sub-bass and no sound on purely visual devices (shear-line beat, front-half lift).

## Render budget
Target: 240 frames at 1440×2560 in under 60 min, which means 15 s/frame or less. Measured in `RENDER_REPORT.md`.
