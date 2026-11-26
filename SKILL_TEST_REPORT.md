# Skill test report: `3d-educational-shorts-production`

Date: 2026-11-26 · Package: `3d-educational-shorts-production/` · ZIP: `3d-educational-shorts-production.zip` (0.33 MB, 52 entries)

## 1. Package validation (`scripts/tests/validate_package.py --zip`)
| Check | Result |
|---|---|
| YAML frontmatter: `name` = folder name, ≤ 64 chars | PASS (32 chars) |
| `description` ≤ 200 chars | PASS (188 chars) |
| Required files (SKILL.md, README, 12 references, 5 templates, scripts) | PASS |
| Every path referenced from SKILL.md/references exists | PASS |
| All `.py` compile | PASS |
| scripts/README lists every script | PASS |
| No absolute paths (`/home/`, `/opt/`, `/root/`, `C:\`) | PASS |
| No secrets (API-key / token patterns) | PASS |
| ZIP: single root folder `3d-educational-shorts-production/` | PASS |
| Generated files excluded (`__pycache__`, `environment_report.json`) | PASS (gitignored and excluded from the ZIP) |

## 2. Script self-tests (`scripts/tests/run_tests.py`, run with `BLENDER_PY` set)
| Test | Result |
|---|---|
| analyze_reference on a synthetic 2 %/frame zoom | PASS (1.836 %/frame measured) |
| foley + audio_analysis + ducking | PASS (−22.9 LUFS, −0.5 dBTP, 8 onsets, −8 dB duck) |
| image_compare SSIM/PSNR | PASS (self 1.000, blurred 0.946) |
| caption_placer + video_assembler + quality_control on a synthetic project | PASS |
| Blender: build template shot, render 2 frames, resume skips them | PASS |
Without Blender, test 5 is skipped and the Skill switches to planning-only mode (verified by a fresh agent).

## 3. Fresh-agent prompt tests (planning stage; three contrasting topics)
Each agent got only the Skill folder and a one-line prompt. The goal was to see whether it picks a topic-appropriate strategy rather than copying the padlock.
| Prompt | Archetypes chosen | Strategy | Padlock-forced? |
|---|---|---|---|
| "How does a mantis shrimp punch so hard?" | C animal + A/B/F mechanism/biology/physics + H abstract | Animal wide → slow-mo strike → saddle-spring cutaway → cavitation-bubble physics | No |
| "What happens when you swallow stomach acid?" (body interior) | J character → B biology → H → J | Person → transition into the organ → micro view → back to the person | No |
| "The Great Molasses Flood of 1919" | I landscape, D history, E event, F physics, J | Period street wide → tank failure → fluid wave → aftermath; **explicitly avoided A** | No |

### Friction found and fixed
- No planning-only mode when Blender is missing: added SKILL.md §0.
- Padlock-flavoured hook examples: replaced with generic ones.
- No rule for superlatives or uncertain claims: added to story-and-script-pipeline and the fact-check sheet.
- The shot-list template was too heavy for 8–15 s Shorts: added a lite table.
- Archetype E (events) and fluids were thin: expanded, marked as theory.
- No word budget per second, and no "one-shot" behaviour (state assumptions; never start a >15 min render without approval): added.

## 4. Not tested
- Installing in the Cowork UI itself (no access from this container). Steps are from the official Help Center and are in README.md.
- A full render from a fresh agent on a non-mechanism topic (only the 2 s blockouts in the source project).
- Asset downloads on a network that blocks Poly Haven/ambientCG (the procedural fallback exists).
