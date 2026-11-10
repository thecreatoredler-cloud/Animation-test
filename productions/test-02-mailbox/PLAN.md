# Production plan — Test 02 (same story as Test 01, closer to the reference look)

Approved by the owner after watching Test 01 on the phone (average ≥55 FPS).

## Owner feedback on Test 01
- Liked the camera angle and the move into the street and house.
- **Smoothness:** the video stuttered, camera transitions felt abrupt, characters moved stiffly.
- **The world:** the background was empty compared with the references.
- **Camera:** sometimes stay further back from the character.
- **Light and color:** characters should be lit like the references, with his kind of sunlight, and better saturation and lighting.
- Chosen: **golden afternoon** light, **same story**.

## Measured gap (ffmpeg on the 7 HD references vs Test 01)
| | Warmth V | Saturation | Contrast |
|---|---|---|---|
| References | 119–135 (avg ≈ 129) | 24–29 | 99–128 |
| Test 01 | **118 (too cool)** | 28.6 | 123.5 |

## Changes
1. **Smoothness:**
   - all shaders and textures warmed up before Start, including hidden props;
   - resolution chosen in a warm-up and locked for playback;
   - CSS blur removed;
   - per-frame allocations cut;
   - picture time locked to the audio clock.
2. **Camera:** one continuous path through 17 keyframes. Curves are overshoot-free, so speed never jumps; whips are fast but continuous, with motion blur. Wider framings:
   - a wide tracking shot of Rosa in the busy street;
   - a full-body low-angle shot;
   - a medium-wide two-shot.
3. **Characters:**
   - walk with eased stride, forward lean, bending knees and heel settle;
   - forearms, hat and bag follow through, sampled slightly later in time;
   - anticipation before stopping, reaching and waving;
   - a little "pop" when expressions change;
   - idle weight shift.
4. **World:**
   - 16 houses in four rows (two on each side of the street), plus a distant neighborhood band, 150 trees on the hills, a church steeple and a water tower;
   - a garage with driveway and basketball hoop, a swing set, hedges, a garden gnome, 8 more mailboxes, trash bins, street lamps, a stop sign and street sign, 5 cars, power lines and birds;
   - background life: a kid on a bike (bell), a jogger, a neighbor watering with a hose, a dog (barks).
5. **Light:**
   - low amber sun (~21°), deep blue sky with a warm glow toward the sun, blue-violet fill;
   - characters get a warm key, a cool shade color, a top-lit gradient, grass bounce and a glowing rim, and turn cooler when a house or tree blocks the sun (checked with rays toward the sun);
   - light rays along the sun direction, sun glow and lens flare, dust in the sunbeams.
6. **Post-processing pass:**
   - anti-aliasing (MSAA), bloom, background blur on the flag close-up, motion blur on whips, warm grade, vignette;
   - automatic fallback to medium or low quality if the phone can't hold ~56 FPS during the warm-up.

## Assets
Everything is built in code. External model libraries are blocked from the build machine (allowed by the standard, section 9).
