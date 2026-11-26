# Sound, captions and editing as one timeline

## One timeline links: narration phrase · visual action · framing · caption · Foley · ambience · emphasis time
Build it in `templates/shot-list.md`. Sound events and action times come from **the same functions** in the shot script (`ev(t, type, …)` → `build/events_<shot>.json`), so they can't drift.

## Foley (`scripts/foley.py`)
- **Modal synthesis driven by contacts:** each object has modes (frequency, T60, gain) estimated from size and material; each contact is an impact (contact duration sets brightness) or friction (Poisson micro-impacts following speed). Recipes live in `project.json["foley"]["recipes"]`; `mute` for non-physical events.
- **Measured fixes vs the first (noise-based) version:** pin clicks detectable went from 1 of 12 to 14 of 14 (no masking beds); no sub-bass on small objects; friction damped and detuned (otherwise it fuses into a hum).
- **Limit:** synthesis approximates physics. **Nobody has listened to it yet** in the source project. Best upgrade: **own recordings** (phone, quiet room, close mic, 3 takes per action) as `{"kind": "file"}` recipes. Timing stays automatic, and the licence is your own recording.
- Licensed libraries: record every file in `templates/asset-manifest.csv`. No generic whooshes or impacts on small objects.

## Mix
- One master gain to a loudness target; true-peak ceiling −1 dBTP; check the limiter's gain reduction (over 4 dB means the climax is too far above the rest).
- Foley-only tests: about −22 LUFS (sparse transients can't go louder without crushing). With VO: **voice about −16 LUFS**, Foley ducked **−8 dB** under speech (`foley.duck_gain`: 30 ms attack, 80 ms hold, 250 ms release; verified on a synthetic voice).
- Silence on insight beats. Ambience is presence only (about −50 dB), never a bed that masks events.
- Verify with `scripts/audio_analysis.py` (BS.1770 LUFS, true peak, onsets, spectrogram), **then a human listens to the export**.

## Captions (`video_assembler.py` + `caption_placer.py`)
- Montserrat ExtraBold (OFL), white with a soft shadow, 1–3 words (≤ 2 lines), pop-in 85 → 100 %, `*emphasis*` in warm gold, used sparingly.
- **Inside the Shorts safe area:** 14 % side margins, never in the bottom 20 % or right 12 %. Wrapping on (`WrapStyle: 0`: wrapping was silently off once).
- **Never over the explained action:** `caption_placer.py --write` picks a band per caption from the rendered frames.
- **Appear after the thing they name is visible** (v1 and v2 showed "pins" before the pins).
- Wording must be accurate ("pin pairs", not "pins").

## Editing and pacing
- 30–45 s typical; 2.3–2.7 VO words/s; each beat 0.4–1.5 s; cuts on action; continuous moves within mechanism explanations.
- After the VO exists: retime actions to words, regenerate captions from words, keep 0.4–0.6 s pauses for reveals.
