# Master Animation Quality Standard

Every scene must look like a professionally directed short, not a Three.js demo. The target is 2.5D animated storytelling at the production level of Rick Clips, with our own original characters, stories and art.

## 1. Visual style
- Detailed 3D environments with stylized 2D illustrated human characters.
- Cinematic lighting and atmospheric depth.
- Well-designed objects with convincing proportions.
- One consistent, polished art direction.
- Characters look like illustrated cartoon people inside a real 3D world, never generic geometric figures.

## 2. Environment
- Detailed architecture and background elements, with several layers of depth.
- Carefully designed furniture, props and objects.
- Realistic variation between materials.
- Believable proportions and spatial relationships.
- Details that support the story.
- Never build a whole environment from bare cubes and planes. Use detailed geometry, textures and suitable external 3D assets (GLTF/GLB, for example Poly Haven CC0), all in a consistent style.

## 3. Characters
- A consistent face design, with clear clothing and accessories.
- Expressive faces.
- Arms, legs and body parts that move separately, in natural movement and believable poses.
- A layered 2D or 2.5D rig, not flat stickers: shading, rim light and overlapping layers give them volume.
- The same look in every shot.

## 4. Lighting (highest priority)
- Strong key light, soft fill, rim light to separate characters from the background.
- Contact shadows, ambient light, and atmospheric depth where it fits.
- Warm/cool contrast when it serves the scene.
- Objects have volume and clear materials. Never flat, evenly lit scenes.

## 5. Camera
- Never one static angle for a whole scene.
- Use tracking shots, controlled orbits, dollies, close-ups, wide establishing shots, low and high angles, and composed changes of perspective.
- Every move has a purpose: reveal information, emphasize action, guide attention.
- No random moves and no abrupt transitions.

## 6. Animation
- Ease-in and ease-out, anticipation, follow-through, secondary motion.
- Natural body movement and well-timed facial expressions.
- No sliding characters.
- Objects react convincingly when characters touch, pick up, drop or interact with them.

## 7. Rendering
- High-quality textures, suitable anti-aliasing and correct color management.
- Tuned contrast and exposure, with soft, well-defined shadows.
- Subtle post-processing only when it helps.
- No heavy bloom, oversaturation, noise or artificial-looking light.

## 8. Technical
- Runs in a mobile browser with Three.js, optimized for a modern Android phone (reference device: Motorola Edge 50 Fusion, Adreno 710).
- Vertical 9:16.
- No Blender, Remotion, Node.js or local render server. Use browser-compatible modules and assets only.
- Avoid needlessly expensive effects: best visual quality at stable performance.

## 9. Production process (before writing code)
1. Analyze the story and list every scene.
2. Decide the environments, characters and objects each scene needs.
3. Set the visual direction.
4. Plan the camera shots.
5. Plan the character and object animation.
6. Find opportunities for visual storytelling.

Then build. Don't trade quality for speed. Use primitive geometry only with a real technical or artistic reason. If an element is too complex to do well, find a simpler method that keeps its look.

## 10. Quality control (before calling it done)
Check over the whole animation:
- Character proportions and consistency.
- Object quality, lighting and shadows.
- Camera transitions, animation smoothness and composition.
- Mobile performance.
- Missing or broken assets.

Fix visible problems instead of only reporting them.
