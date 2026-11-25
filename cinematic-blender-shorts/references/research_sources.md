# Research: production methods and tool evaluation

## A. What Zack D. Films production actually uses (primary sources, read 2026-11-25)
**Chris Reilly portfolio** (chrisreillyportfolio.com/zackdfilms.php). This is one freelancer's reported workflow, not proof of every video's pipeline.
- "over 100 of these short films using royalty free content, custom modeling and character animation, some clever compositing, and some physics simulation"
- Tools named: **Blender** ("my workhorse"), **Cascadeur** ("physics engine-assisted character animation"), **BlenderKit**, **After Effects**, **EmberGen**; **Flamenco** render manager with "custom Python" syncing files from a render farm; **AME templates**.
- "my workflow always starts with a variety of templates for everything from compositing, to a base 3D file, to editing"
- Uses "specific plugins and packages for the creation of 3D humans, for the retargeting and production of custom motion capture data, for smoke and water effects, and for asset acquisition", plus "custom Geometry Node work".
- The hook must "grab and hold one's attention within the first 1 to 2 seconds".

**Zack D. Films job listing** (zackdfilms.recruitee.com/o/3d-generalist):
- "captivating 20–45 second 3D clips", 9:16.
- "If the test project takes longer than one day to complete at a high standard, this role may not be the right fit."
- Skills: "character animation, camera work, lookdev, shader effects, and simulations"; "Blender proficiency is a major plus".

**Conclusion:** the studio's speed comes from **templates, prefab assets and stock humans and mocap**, not from rendering magic. Our system copies the method (templates, a tested library, scripted builds) and not their assets.

## B. Tool-by-tool evaluation
| Tool | What it does | Need for us | Free? | Works with Blender | Hardware | Automatable | Verdict / better alternative |
|---|---|---|---|---|---|---|---|
| **Blender 5.x** | Everything 3D | Essential | Yes (GPL) | n/a | CPU works; GPU much faster | Fully (Python API, `-b` background) | **Essential.** Tested here as the `bpy` 5.3 module from PyPI |
| `bpy` PyPI module | Blender as a Python library | Lets headless containers render without the Blender app | Yes | Same code as Blender | Same | Fully | **Essential here**, because the Blender download site is blocked in this environment |
| Cycles (CPU) | Path tracer | Final renders without a GPU | Yes | Built in | CPU OK, about 10× faster on GPU | Yes | **Chosen final engine on CPU hosts** (benchmarks) |
| EEVEE | Rasteriser | Fast on a real GPU | Yes | Built in | **Needs a GPU**: software GL took 248 s for the first frame and over 300 s for the next | Yes | Use only where a GPU exists (the owner's PC, a GPU cloud) |
| Rigify | Auto-rig, including face | Character rigs | Yes | Bundled | Light | Yes | Essential once characters arrive |
| MPFB 2 (MakeHuman) | Parametric CC0 humans plus rigs | Human characters (M4) | Yes (CC0 output) | Add-on | Light | Yes (Python) | **Best free option**; host allowlist needed (character_guide.md) |
| Cascadeur | Physics-assisted keyframing and mocap cleanup | Natural body motion | Free tier (check licence for commercial use) | FBX round-trip | Desktop app, moderate | No (GUI) | Optional. Our analytic library covers objects; characters may use it later on the owner's PC |
| BlenderKit | Asset browser add-on | Fast prefab assets | Free tier plus paid; mixed licences per asset | Add-on | Light | Partly | **Replace with Poly Haven and ambientCG** (CC0, scriptable, no account) |
| Poly Haven | HDRIs, textures, models | Lighting and props | CC0 | glTF/HDR | Light | **Yes** (`asset_manager.py`, tested) | Essential |
| ambientCG | PBR textures | Materials | CC0 | Image maps | Light | **Yes** (`asset_manager.py`, tested) | Essential |
| After Effects / AME | Compositing, templates, export | Captions, grade, encode | **Paid** | No | Medium | Partly | **Replace with ffmpeg + libass** (`video_assembler.py`, tested) |
| EmberGen | Real-time smoke and fire VDB | Smoke and explosions | Paid (indie licence) | VDB import | **GPU needed** | No | Unnecessary now. Use Blender Mantaflow (baked) or a cheap emission-card fake when a story needs smoke |
| Flamenco | Blender render-farm manager | Queue and resume across machines | Yes | Official | Any | Yes | Unnecessary with one machine. `render_manager.py` gives resume, skip-done, logging and per-shot renders |
| Geometry Nodes | Procedural instancing and growth | Crowds, vistas (M5), growth | Yes | Built in | Light to medium | Yes | Use per story (instancing is cheap) |
| FFmpeg | Encode, concat, filters | Assembly | Yes | n/a | Light | Yes | Essential (tested) |
| OpenCV + NumPy | Frame analysis | Reference measurement and QC | Yes | n/a | Light | Yes | Essential (`analyze_reference.py`, validated against the tutorial) |
| SciPy | Filters, convolution | Sound design | Yes | n/a | Light | Yes | Essential (`audio_tools.py`) |
| Whisper / TTS models | Transcription, voice | Tutorial transcript, narration | Yes | n/a | CPU OK | Yes | **Blocked**: model hosts (Hugging Face, OpenAI) are not reachable. The owner records the narration |
| Janction Render (an MCP in this session) | Cloud GPU Blender rendering | Could cut final render time about 10× | Free trial credit (about 100 JPY ≈ 17 GPU-minutes), then paid | Blender 5.0 scripts | Remote GPU | Yes | **Not used.** It goes beyond the free/no-account constraint once the trial ends; ask the owner before any use |

## C. Blender documentation relied on
- Command-line rendering: docs.blender.org/manual/en/latest/advanced/command_line/render.html (`blender -b file.blend -P script.py -- args`); `render_manager.py` and `scene_builder.py` accept that form.
- Python API: `bpy.ops.render.render(write_still=True)` per frame (lets us skip done frames and time each one), boolean `solver='EXACT'` with `material_mode='TRANSFER'`, Cycles `use_adaptive_sampling`, `denoiser='OPENIMAGEDENOISE'`, `use_persistent_data`.
- Colour management: AgX view transform with looks (Blender ≥ 4.0).
- Blender 4.4+ layered actions: F-curves sit in `action.layers[].strips[].channelbags[]` (handled in `camera_tools._fcurves`).

## D. Things tried and not usable (don't retry without a network change)
- download.blender.org: blocked → use `pip install bpy`.
- Hugging Face and the OpenAI model host: blocked → no Whisper or TTS.
- github.com web URLs: blocked; raw.githubusercontent.com works (fonts were fetched from there).
- freesound.org, fonts.google.com, blenderkit.com: blocked.
