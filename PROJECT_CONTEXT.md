# Project Context

## Purpose
The owner wants to produce **vertical (9:16) 2.5D animated story shorts**: illustrated cartoon characters inside detailed, cinematically lit 3D worlds. The target production level is the "Rick Clips"-style shorts the owner shared as references. Characters, stories and art must be **original**; we copy only the production principles.

Everything renders **in a mobile browser with Three.js**. The owner's computer is too weak to render (2 GB RAM, Intel G41 graphics). The **phone is the render and playback device**: Motorola Edge 50 Fusion, Adreno 710 GPU, Android Chrome. Pages are published with **GitHub Pages**.

- **Repository:** `thecreatoredler-cloud/Animation-test` (GitHub). Work branch: `claude/quality-standard`; the owner merges it into `main` through pull requests (#2 and #3 merged so far).
- **Live site:** `https://thecreatoredler-cloud.github.io/Animation-test/` plus a page path, e.g. `productions/showcase-01-watchmaker/`.

## What exists (see CURRENT_PROGRESS.md for detail)
| Path | What it is |
|---|---|
| `index.html` | First 5 s benchmark ("Night Shift" hallway), single file |
| `productions/test-01-mailbox/` | 15 s style test, single file |
| `productions/test-02-mailbox/` | 15 s improved style test, single file |
| `productions/showcase-01-watchmaker/` | 10 s quality showcase; **the first page built on the shared `lib/` modules** and real 3D models. This is the current reference implementation. |
| `lib/` | Reusable system: stage, post, camera, character, assets |
| `assets/polyhaven/` | CC0 models (GLB) and texture sets (WebP), credits in `assets/ASSETS.md` |
| `qa/` | Frame-capture QA tool |
| `tools/` | Asset fetch/optimize pipeline, model bounds helper, MP4 renderer |
| `CLAUDE.md`, `ANIMATION_STANDARD.md`, `STYLE_GUIDE.md` | Workflow rules, quality standard, measured style guide |

## Technologies
- **Three.js 0.160.0**, loaded from jsDelivr through an **import map** (no build step; GitHub Pages serves files as they are). Addons used: `GLTFLoader`, `RoomEnvironment`, `BufferGeometryUtils`.
- **WebGL2** features: MSAA render targets with a depth texture, half-float targets when available.
- **Web Audio**: all music and sound effects are synthesized at runtime; there are no audio files.
- **Character art:** canvas drawing (tests 01/02) and **SVG strings rasterized to textures** (showcase).
- **QA and rendering in the cloud container:** Playwright with pre-installed Chromium (software GPU, SwiftShader), ffmpeg, Node 22.
- **Asset pipeline:** `@gltf-transform/cli` 4.2.1 and `sharp` (in `tools/package.json`), downloading from **Poly Haven** (CC0).
- **The owner does not use** Blender, React, Node or Remotion locally, by explicit requirement. Everything they run is the browser page.

## How it works (architecture)
1. **Everything is a pure function of time `t`.** Camera, poses, props, captions and effects are all computed from `t`, never from frame count. That makes `window.__seek(t)` frame-exact, which QA, MP4 export and smoothness all depend on.
2. **Each page exposes `window.__duration`, `window.__seek(t)` and `window.__ready`**, as required by CLAUDE.md.
3. **Characters are 2.5D "cards".** Each body part is a textured plane in a hierarchy (root → flip → body → hips → torso → neck → head; shoulder → elbow → wrist; thigh → knee). Cards always turn to face the camera.
   - A custom shader turns a blurred-alpha "shape" map into form shading and rim light from **screen-space light directions**, so a flat card reads as round.
   - A **hidden twin rig** turned toward the key light casts the shadow, through `customDepthMaterial`.
4. **Interaction trick (showcase).** A hand that must touch a 3D object is aimed by **2-bone IK** at the point where the camera ray through the object meets the character's card plane. On screen the hand lands exactly on the object. Held objects are drawn at the hand.
5. **Camera** (`lib/camera.js`): one continuous path through keyframes. Hermite curves with monotone, Fritsch–Carlson-limited tangents give continuous velocity and no overshoot. Motion blur is computed from the camera's own movement; the depth-of-field focus is scheduled per shot.
6. **Post** (`lib/post.js`): an MSAA HDR scene target, a quarter- and eighth-resolution blur chain, then one composite pass (bloom above a threshold, depth of field from depth, motion blur, glow, vignette). Tone mapping and the color grade happen inside that pass.
7. **Grade**: `installGrade()` in `lib/stage.js` replaces Three's `CustomToneMapping` with a warm/cool multiplier, then ACES, contrast, saturation and lift. Each scene sets its own values.
8. **Quality and performance** (`lib/stage.js`):
   - A warm-up before Start compiles every shader, renders every shot once, then times 40 frames and picks high, medium or low.
   - Resolution is **locked during playback**.
   - The HUD shows FPS, draw calls and triangles, with a manual **quality button**.
   - A results card appears at the end.
   - Playback time follows the **audio clock**.
9. **Assets**: Poly Haven glTF at 1k is converted to GLB with 1024 px WebP textures and quantized meshes, **keeping the node hierarchy** so clock hands can be animated. They load with `lib/assets.js` (`prop()` clones a cached GLB; `pbr()` builds MeshStandardMaterial from a texture set).

## How to run, preview, QA and render
- **On the phone:** merge the branch to `main`, then open the GitHub Pages URL. The page shows "Preparing…" during warm-up, then Start.
- **In the cloud container** (Three.js CDN is blocked here; a local copy is used):
  - `npm install --prefix qa` — once per session.
  - `node qa/capture.js productions/<name>/index.html --step 0.25` — writes frames and a contact sheet to `qa/out/<name>/`. Serves the repo over local HTTP, which modules and GLB loading need. Reports console errors and missing files.
  - `node tools/render-mp4.cjs productions/<name>/index.html` — 1080×1920, 30 fps MP4 with the page's own synthesized sound, written to `exports/` (git-ignored). Interrupted renders resume. Measured speed: about 1.3 s/frame for Test 02, about 5.5 s/frame for the showcase.
  - `cd tools && npm install`, then `node fetch-polyhaven.mjs model|texture <id> ...` — fetch and optimize Poly Haven assets.
  - `node tools/bounds.mjs <file.glb>` — print a model's bounds (used to find the lamp head).
- Pages that use `lib/` modules or GLB files **cannot be opened as `file://`**; they need HTTP. GitHub Pages and the QA server both provide it.

## Constraints and limitations
- **Real phone performance can only be measured by the owner.** The cloud machine renders with a software GPU, so its FPS means nothing.
  - Measured on the phone so far: the first benchmark averaged 59.9 FPS (1% low 48.5, Adreno 710). The owner reported Test 02 at ≥55 FPS but also said it stuttered.
  - **The showcase has not been measured on the phone yet.** It's the heaviest scene: 463 draw calls and 453k triangles on high quality.
- **Network:** the cloud environment "animation-test" allows `api.polyhaven.com` and `dl.polyhaven.org` besides package registries. jsDelivr is **not** reachable from the container, so QA routes the CDN to `qa/node_modules/three`.
- **GitHub push** works only while Claude's GitHub access is connected. One push was refused with 403 until the owner reconnected.
- **Large binaries:** MP4s are kept out of git (`exports/` is ignored). Assets are kept small: about 6.3 MB total.
- **Reference videos** are **not in the repo**. They were uploaded to a chat session, and only their measurements and descriptions survive (STYLE_GUIDE.md, DESIGN_RULES.md).
- **Licensing:** the reference shorts are only for analysis; never commit their frames. Poly Haven assets are CC0, credited in `assets/ASSETS.md`.
- **Optional tool:** a JANCTION Render MCP connector (cloud Blender rendering) was connected in an earlier session and used only for read-only Poly Haven `asset_search`. It is not part of the pipeline, because the owner chose browser rendering.

## Future session instructions
When starting a new session, read PROJECT_CONTEXT.md, DESIGN_RULES.md, CURRENT_PROGRESS.md, and TODO.md before making any changes.

Inspect the existing code before modifying it.

Preserve all established visual and technical requirements.

Do not restart the project or replace working implementations without a clear technical reason.

Continue from the exact project state documented in these files.

If something is unclear or missing, inspect the actual project rather than inventing information.

**Maintenance rule:** whenever a significant feature is completed, an important decision is made, or the architecture changes, update CURRENT_PROGRESS.md and TODO.md (and PROJECT_CONTEXT.md or DESIGN_RULES.md if needed). Keep these files accurate and concise.
