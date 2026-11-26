# Story and script pipeline

## Stages and gates (⛔ = needs the owner's approval)
| # | Stage | Output (template) | Gate |
|---|---|---|---|
| 1 | Content intake: topic, script or VO status, duration, refs, requirements | `templates/content-brief.md` | List missing info and **ask**; never invent facts |
| 2 | Research and fact check: claim map with sources | `templates/fact-check-sheet.md` | Every on-screen claim is ✅ sourced or flagged ⚠ |
| 3 | Hook and story: curiosity question, reveal, cause→effect chain, payoff, takeaway | the brief's "Story" section | ⛔ |
| 4 | Narration → visual map (timed beats) | `templates/shot-list.md` | VO absent: provisional timing, marked "retime after VO" |
| 5 | Archetype and visual language | `references/content-archetypes.md` → shot list columns | Explain *why* it fits |
| 6 | Asset plan and acquisition | `templates/asset-manifest.csv` | No unclear licences |
| 7 | Storyboard and animatic: preview stills at every beat (and step-2 motion) | `renders/preview/` | ⛔ (readable at phone size?) |
| 8–10 | Build, animate, camera and light | shot `.py` files | Preview QC per shot |
| 11 | Render ladder: preview → review → final | `render_manager.py` | ⛔ before the final render |
| 12 | Sound and edit | `foley.py`, `video_assembler.py`, captions | |
| 13 | QC: watch the whole export, and at phone size | `templates/final-qc-checklist.md` | All FIX items closed |
| 14 | Learning capture | append to `lessons-learned.md` | |

## Hook (first 1–2 s)
- Open on the **subject already in motion**, with the first caption as a question. Examples by archetype: mechanism "How does a key open this?" (tested); body "Why doesn't your stomach digest you?"; animal "How does this shrimp boil water?"; event "Could syrup flatten a street?".
- **Establish context fast** (≤ 0.7–1.5 s) before going close: the whole object (mechanism), the person (body), the habitat (animal), the place on a map or street (event or history). The padlock v3 opening showed only a detail, so the viewer couldn't place it.
- No logos, no title cards, no slow intros.

## Information sequence
1. Write the cause→effect chain as bullets (padlock: pairs block → ridges lift → springs squeeze → gaps align → plug turns → cam frees balls → spring lifts shackle).
2. **One beat = one new picture.** If two beats share the same framing, change the framing (context → contact → consequence). v3's 3.3 s of near-identical framing was a confirmed defect, fixed in v4.
3. Hold **silent beats** on the key insight (0.3–0.5 s).
4. Payoff: return to the whole object or person, changed by the process (the lock hanging open).

## Narration → visual mapping (when VO exists)
- Speech rate is about 2.3–2.7 words/s, so a 30 s Short holds about 70–80 words.
- Mark each **noun with a visual beat**. Action times become functions of those word times (the shot's frame constants). Sound events follow automatically, because they're computed from the same functions.
- Captions come **from** the narration (1–3 words). Leave 0.4–0.6 s VO pauses before reveals.
- Without VO: build a provisional timeline, keep VO space (Foley about −22 LUFS, captions as placeholders), and tag every beat "retime after VO".

## Word budget (2.3–2.7 words/s)
20 s ≈ 50 words · 30 s ≈ 75 · 35 s ≈ 85 · 40 s ≈ 100 · 45 s ≈ 110. Leave about 10 % for reveal pauses.

## Facts vs reconstruction
- Established fact (cite) · reasonable inference (say so) · visual reconstruction (stylised or generic where unknown).
- Historical and accident topics: no invented dialogue, faces or injuries. Non-graphic always.
- **Show uncertainty visually and consistently** (theory; suggested by a Skill test): one reconstruction look per video (e.g. desaturated with ink outlines, plus a small "reconstruction" tag) against full colour for documented facts. Hypotheses get "likely" in the caption.
- **Numbers on screen:** use "~" or a range for estimates, give the source in the video description, and drop any number you can't source.
- **Superlatives** ("fastest", "biggest", "faster than a bullet") need a source **for the exact comparison**, or a qualifier ("one of the").
- **Archival photos and footage:** use them as reference only, unless the item is verified public domain or licensed (record it in the manifest). Never trace a photo's exact composition.
