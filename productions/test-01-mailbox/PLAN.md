# Production plan — Test 01: "Why Mailboxes Have a Little Red Flag"

**Purpose:** a 15-second style test proving we can match the reference look on the phone: saturated sunny world, long shadows, characters lit by the scene, fast purposeful camera with flights between shots, and word-by-word captions. The story is original.

**Format:** 9:16, 15 s, 30 fps playback, Three.js single page with `__seek`. Silent for this test, captions only.

## Story (caption text, about 2.5 words per second)
> "Before phones, your mailbox could talk. Flag up meant *I have a letter for you*. So the mail carrier always looked for one thing: the little red flag."

## Characters (original)
- **Rosa, mail carrier** — signature color teal. Big cream head, thick ink outline, short dark-brown bob haircut, teal postal cap with a yellow badge, teal shirt, navy shorts, brown satchel with a strap. Expressions: neutral, curious (one brow up), delighted grin.
- **Mr. Bram, homeowner** — signature color mustard. Bald with a grey mustache, round glasses, mustard knitted vest over a white shirt, slippers. Expressions: hopeful, waving and smiling.
- Both are layered rigs: head, torso, upper and lower arms, legs, hat and satchel as separate parts, with baked shading, a warm rim on the sun side, a scene tint, and real cast shadows.

## Environment: a suburban street in late-afternoon sun
- 3 detailed houses: lap-siding texture, white trim, gabled shingle roofs with overhang, framed windows with curtains, a porch with columns and steps, front door with a knob. Each house in its own color (sky-blue, peach, mint).
- Picket fences, lawns with grass texture and flower beds, a concrete sidewalk with expansion joints, an asphalt road with a yellow center line and a curb.
- **Hero prop:** a mailbox on a wooden post, with a rounded metal body, an opening door, a hinged red flag that can rise, painted house number 42 and slight wear.
- Street dressing: trees with layered foliage, power poles with sagging wires, a parked car, a fire hydrant, a bicycle against a fence.
- Far layer: hazy hills and a water tower. Sky: a cobalt-to-pale gradient dome with drifting puffy clouds.
- Lighting: warm low key sun (long blue shadows), sky-blue fill, warm rim on the characters, contact/AO darkening under every object, floating dust in the sunlight.
- **Asset note:** Poly Haven isn't reachable from the build container, so these models are hand-built in code with beveled shapes, painted textures and baked AO. That's allowed by standard section 9 for a technical reason. Phone-loaded CC0 models can be added later if wanted.

## Shot list
| # | Time | Shot | Camera | Action / what it shows | Captions |
|---|---|---|---|---|---|
| 1 | 0.0–2.2 | Crane reveal | Starts high top-down over the street, sweeps down and forward to a low angle on mailbox 42 (ease-out) | Establishes the whole sunny street, then the hero prop | Before / phones, |
| 2 | 2.2–4.0 | Extreme close-up | Wide-angle lens 30 cm from the flag, slow push, background blurred | Mr. Bram's hand raises the red flag: anticipation dip, snap up, overshoot wobble | your / mailbox / could talk. |
| 3 | 4.0–6.2 | Follow shot | Whip-pan flight from the flag down the street to Rosa, then track alongside her on the sidewalk, with fences sliding past in the foreground | Rosa walks: stepping, satchel bouncing, cap bobbing | Flag up / meant |
| 4 | 6.2–8.0 | Low hero angle | Camera near the ground, slow push-in, sky behind her | Rosa stops (squash), spots the flag, one brow up, then a grin | I have / a letter / for you. |
| 5 | 8.0–10.4 | Over-the-shoulder | Fast push past Rosa's shoulder to the mailbox; the door opens | She opens the mailbox, pulls out the letter (it slides out and flips), and the flag drops | So / the mail carrier |
| 6 | 10.4–12.6 | Two-shot | Whip pan to the porch, then settle on Rosa and Mr. Bram | Mr. Bram waves from the porch, Rosa raises the letter; both smile | always / looked for / one thing: |
| 7 | 12.6–15.0 | Crane-out finale | Rise and pull back to a high wide shot, sun glinting off the flag | Rosa walks on to the next house as the flag catches the sun | the little / red flag. |

Transitions: shots 2→3 and 5→6 are camera flights (whip pans with a motion smear); 1→2 is a continuous move; 3→4, 4→5 and 6→7 are a 0.25 s push or blend.

## Targets for QA
- Measured saturation 24–30, brightness 100–120, shadows lifted (darkest 10% around 50–75).
- On the phone: at least 50 FPS at up to 2× resolution, using the fixed resolution logic (warm-up ignored, adjusts both ways).
- `qa/capture.js` at 0.1 s steps, a `QA.md` scorecard covering all 10 sections, and fixes applied before delivery.
