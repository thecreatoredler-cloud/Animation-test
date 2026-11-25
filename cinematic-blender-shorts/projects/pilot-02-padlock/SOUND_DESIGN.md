# Sound design: pilot-02 (v2)

Engine: `scripts/foley.py` (modal synthesis driven by contact events). Events: `build/events_s01_padlock_v2.json`, written by the shot's `build()` from the same functions that drive the animation, so sync is exact by construction (frame accuracy 1/30 s; impacts placed to 1 ms).
**Source and licence of every sound: synthesised by our own code (original, no third-party recordings).** No asset licences apply. Any recipe can be swapped for a licensed recording with `{"kind": "file", "file": ...}`, which must then be recorded in `references/asset_licenses.md`.

## Timeline
| t (s) | Event | Recipe (objects) | Rel. level | Why it's there |
|---|---|---|---|---|
| 0.67 | `key_touch` | impact · key + brass_body | -17 dB | Key tip meets the brass plug face: first contact, nickel on brass (key + body modes, hard contact). |
| 0.70 | `key_enter` | impact · key + brass_body | -23 dB | Tip drops into the keyway: softer and duller (body-dominant). |
| 0.70–5.00 | `key_slide_start` | friction · key + brass_body | -31 dB | Blade sliding past the pins: Poisson micro-contacts whose rate and level follow the key speed (hesitates at each pin). Kept ~12 dB under the clicks so it never masks them. |
| 2.30–4.50 (14×) | `pin_click` | impact · brass_body + key | -19 dB | A pin tip slips over a ridge (computed from the follower simulation). Brightness follows the drop height. |
| 5.00 | `key_seat` | impact · key + brass_body | -17 dB | Key shoulder meets the plug face: the "fully home" clack. |
| 5.07 | `shear_align` | muted |  | Deliberately SILENT: alignment is not a contact. The silence makes the beat. |
| 5.40 | `turn_start` | impact · brass_body | -21 dB | Detent releases as the plug starts to turn. |
| 5.40–6.20 | `turn_friction` | friction · brass_body + key | -33 dB | Brass plug rotating in the brass body: low-rate micro-contacts. |
| 5.86 | `balls_retract` | impact · tiny_steel + brass_body | -19 dB | Steel balls leave the shackle notches: tiny hard parts coupled to the body. |
| 5.91 | `shackle_pop` | impact · shackle + brass_body | -10 dB | Spring snaps the steel shackle up: the shackle rings (beam modes ~1.9-14 kHz). |
| 5.95 | `body_drop` | impact · staple + shackle + door | -12 dB | The hanging body drops onto the shackle stop and jolts the staple; the door plank gives the only low end (185-870 Hz), heavily damped. |
| 6.06–7.28 | `swing_creak` | friction · staple + shackle | -30 dB | Shackle rocking on the staple while the lock swings, decaying with the swing. |
| 6.20 | `turn_stop` | impact · brass_body + key | -17 dB | Plug reaches its stop (paired with the visual detent settle). |
| 7.73 | `shell_seat` | muted |  | Muted: the front-half lift is an illustrative device, not a physical event (rule: no sound for purely visual devices). |
| 0–8 | ambience | band-limited air tone 60–700 Hz | −55 dB | Outdoor presence so the mix never drops to digital silence. Inaudible under events |

## Mix
- Relative levels are set per recipe. **One** master gain sets loudness, so sounds are not each normalised to the same level.
- Measured on the final mix: see `RENDER_REPORT.md` / `qc/`. Target −22 LUFS integrated with a −1 dBTP ceiling, and the limiter reduces only the shackle-pop/body-drop transient (about 3.7 dB over about 5 ms).
- Why not −14 to −16 LUFS: sparse Foley has a very high peak-to-loudness ratio. Pushing it louder means limiting the transients that make it sound physical. With narration, the voice carries the loudness and the Foley sits about 8 LU under it.
- Shot size: everything up to 6.4 s is `close` (dry). From 6.4 s, `medium` adds faint 1.6/4.1 ms reflections from the door the lock hangs on.

## What changed vs v1 (measured, `diagnosis/`)
| | v1 | v2 |
|---|---|---|
| Pin clicks detectable as events | 1 of 12 | 14 of 14 |
| Continuous noise beds | scrape at −25 LUFS for 3.4 s, plus 2 whooshes | none (friction is micro-contacts about 12 dB under the clicks) |
| Energy below 100 Hz | dominant (55–70 Hz thumps) | none except the door knock's natural 185 Hz mode |
| Loudness shape | −42 → −25 → −15 LUFS ramp | events carry the shape; silence on the alignment beat |

## Limits (honest)
- **I can't listen.** All judgements here come from measurements and spectrograms. Modal synthesis is a physical approximation, not a recording. Whether it *sounds* natural is the owner's call, and real Foley recordings would likely still be better for the key slide.
- Mode frequencies are estimates (beam/plate formulas plus typical damping), not measured from real parts.
